#!/usr/bin/env python3
"""
P2P-сканер USDT для GEL и USD (Binance, Bybit, OKX) с Telegram-ботом.

Ищет три вида окон и к каждому пишет пошаговый сценарий под твой баланс:
  1. cross  — купить USDT на бирже A у продавца, продать на бирже B покупателю
              (A и B могут совпадать).
  2. maker  — разрыв между лучшим покупателем и продавцом внутри одной биржи:
              ставишь свои объявления на покупку и продажу.
  3. fx     — круг GEL -> USDT -> USD -> GEL (и обратно) с обменом в банке.

Только стандартная библиотека Python 3.8+.
Запуск:  python3 scanner.py --once        (один проход, вывод в консоль)
         python3 scanner.py               (бесконечный цикл + Telegram)
         python3 scanner.py --test-telegram
"""

import argparse
import html
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Optional, Tuple

UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36"
HERE = os.path.dirname(os.path.abspath(__file__))
CHAT_FILE = os.path.join(HERE, "chat_id.txt")
BALANCE_FILE = os.path.join(HERE, "balance.json")

# ---------------------------------------------------------------- способы оплаты
# Канонический ключ -> как метод называется на каждой бирже.
PAYMENTS = {
    "tbc":     {"binance": "TBCbank",       "bybit": "165", "okx": "TBC Bank"},
    "bog":     {"binance": "BankofGeorgia", "bybit": "11",  "okx": "Bank of Georgia"},
    "liberty": {"binance": "LIBERTYBANK",   "bybit": "360", "okx": "Liberty Bank"},
    "credo":   {"binance": "CREDOBANK",     "bybit": "359", "okx": "Credo Bank"},
    "basis":   {"binance": "BASISBANK",     "bybit": None,  "okx": "Basis Bank"},
    "tera":    {"binance": "Terabank",      "bybit": None,  "okx": "Terabank"},
    "fastoo":  {"binance": "Fastoowallet",  "bybit": None,  "okx": "Fastoo Wallet"},
}
PAY_LABEL = {"tbc": "TBC", "bog": "Bank of Georgia", "liberty": "Liberty", "credo": "Credo",
             "basis": "Basis", "tera": "Terabank", "fastoo": "Fastoo"}
EX_LABEL = {"binance": "Binance", "bybit": "Bybit", "okx": "OKX"}


def _norm(s: str) -> str:
    return re.sub(r"[^a-z0-9]", "", str(s).lower())


_ALIAS = {}
for _key, _names in PAYMENTS.items():
    _ALIAS[_key] = _key
    for _n in _names.values():
        if _n:
            _ALIAS[_norm(_n)] = _key


def canon_payment(name: str) -> str:
    n = _norm(name)
    return _ALIAS.get(n, n)


# ---------------------------------------------------------------- модели
@dataclass
class Ad:
    exchange: str        # ключ: binance / bybit / okx
    fiat: str
    side: str            # "ask" — продавец (мы покупаем USDT), "bid" — покупатель (мы продаём)
    price: float
    min_fiat: float
    max_fiat: float
    available_usdt: float
    nick: str
    orders: int
    completion: float    # 0..1
    payments: List[str] = field(default_factory=list)
    decimals: int = 2    # знаков в цене — шаг цены для своих объявлений
    link: str = ""       # ссылка на профиль продавца / объявление

    def __post_init__(self):
        self.nick = html.escape(str(self.nick))  # ники идут в HTML-сообщения Telegram

    @property
    def ex(self) -> str:
        return EX_LABEL.get(self.exchange, self.exchange)

    def who(self) -> str:
        return f"<b>{self.nick}</b> ({self.orders} сделок, {self.completion*100:.0f}%)"

    def banks(self, pay_keys: List[str]) -> str:
        mine = [p for p in self.payments if not pay_keys or p in pay_keys] or self.payments
        return ", ".join(PAY_LABEL.get(p, p) for p in mine)


@dataclass
class Opportunity:
    kind: str
    key: str
    profit_pct: float
    profit_abs: float
    fiat: str
    text: str            # короткий заголовок
    plan: str = ""       # пошаговый сценарий


# ---------------------------------------------------------------- HTTP
def http_json(url: str, body: Optional[dict] = None, timeout: int = 20):
    data = json.dumps(body).encode() if body is not None else None
    headers = {"User-Agent": UA, "Accept": "application/json"}
    if data is not None:
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, headers=headers)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.load(r)


def _f(x, default=0.0) -> float:
    try:
        return float(x)
    except (TypeError, ValueError):
        return default


def _dec(s) -> int:
    s = str(s)
    return len(s.split(".")[1]) if "." in s else 0


# ---------------------------------------------------------------- биржи
def fetch_binance(fiat: str, side: str, amount: float, pay_keys: List[str], pages: int) -> List[Ad]:
    pay_types = [PAYMENTS[k]["binance"] for k in pay_keys if PAYMENTS.get(k, {}).get("binance")]
    ads = []
    for page in range(1, pages + 1):
        body = {
            "asset": "USDT", "fiat": fiat,
            "tradeType": "BUY" if side == "ask" else "SELL",
            "page": page, "rows": 20, "payTypes": pay_types,
            "transAmount": str(int(amount)) if amount else "",
            "publisherType": None,
        }
        d = http_json("https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search", body)
        rows = d.get("data") or []
        for x in rows:
            a, u = x["adv"], x["advertiser"]
            ads.append(Ad(
                exchange="binance", fiat=fiat, side=side,
                price=_f(a["price"]), decimals=_dec(a["price"]),
                min_fiat=_f(a.get("minSingleTransAmount")),
                max_fiat=_f(a.get("dynamicMaxSingleTransAmount") or a.get("maxSingleTransAmount")),
                available_usdt=_f(a.get("tradableQuantity") or a.get("surplusAmount")),
                nick=u.get("nickName", "?"),
                orders=int(_f(u.get("monthOrderCount"))),
                completion=_f(u.get("monthFinishRate")),
                payments=[canon_payment(m.get("identifier") or m.get("tradeMethodName", "")) for m in a.get("tradeMethods", [])],
                link=f"https://p2p.binance.com/en/advertiserDetail?advertiserNo={u.get('userNo', '')}",
            ))
        if len(rows) < 20:
            break
    return ads


_BYBIT_NAMES: Dict[str, str] = {}


def _bybit_payment_names() -> Dict[str, str]:
    if not _BYBIT_NAMES:
        try:
            d = http_json("https://api2.bybit.com/fiat/otc/configuration/queryAllPaymentList", {})
            for p in d["result"]["paymentConfigVo"]:
                _BYBIT_NAMES[str(p["paymentType"])] = p["paymentName"]
        except Exception:
            pass
    return _BYBIT_NAMES


def fetch_bybit(fiat: str, side: str, amount: float, pay_keys: List[str], pages: int) -> List[Ad]:
    names = _bybit_payment_names()
    pay_ids = [PAYMENTS[k]["bybit"] for k in pay_keys if PAYMENTS.get(k, {}).get("bybit")]
    ads = []
    for page in range(1, pages + 1):
        body = {
            "tokenId": "USDT", "currencyId": fiat,
            "side": "1" if side == "ask" else "0",   # 1 — мы покупаем, 0 — продаём
            "size": "20", "page": str(page),
            "payment": pay_ids,
            "amount": str(int(amount)) if amount else "",
        }
        d = http_json("https://api2.bybit.com/fiat/otc/item/online", body)
        rows = (d.get("result") or {}).get("items") or []
        for x in rows:
            ads.append(Ad(
                exchange="bybit", fiat=fiat, side=side,
                price=_f(x["price"]), decimals=_dec(x["price"]),
                min_fiat=_f(x.get("minAmount")),
                max_fiat=_f(x.get("maxAmount")),
                available_usdt=_f(x.get("lastQuantity")),
                nick=x.get("nickName", "?"),
                orders=int(_f(x.get("recentOrderNum"))),
                completion=_f(x.get("recentExecuteRate")) / 100.0,
                payments=[canon_payment(names.get(str(p), str(p))) for p in x.get("payments", [])],
                link=(f"https://www.bybit.com/fiat/trade/otc/profile/{x['userMaskId']}/USDT/{fiat}/item"
                      if x.get("userMaskId") else
                      f"https://www.bybit.com/fiat/trade/otc/?actionType={'1' if side == 'ask' else '0'}&token=USDT&fiat={fiat}"),
            ))
        if len(rows) < 20:
            break
    return ads


def fetch_okx(fiat: str, side: str, amount: float, pay_keys: List[str], pages: int) -> List[Ad]:
    okx_side = "sell" if side == "ask" else "buy"
    q = urllib.parse.urlencode({
        "quoteCurrency": fiat, "baseCurrency": "USDT", "side": okx_side,
        "paymentMethod": "all", "userType": "all",
        "quoteMinAmountPerOrder": str(int(amount)) if amount else "",
    })
    d = http_json("https://www.okx.com/v3/c2c/tradingOrders/books?" + q)
    rows = (d.get("data") or {}).get(okx_side) or []
    ads = []
    for x in rows:
        ads.append(Ad(
            exchange="okx", fiat=fiat, side=side,
            price=_f(x["price"]), decimals=_dec(x["price"]),
            min_fiat=_f(x.get("quoteMinAmountPerOrder")),
            max_fiat=_f(x.get("quoteMaxAmountPerOrder")),
            available_usdt=_f(x.get("availableAmount")),
            nick=x.get("nickName", "?"),
            orders=int(_f(x.get("completedOrderQuantity"))),
            completion=_f(x.get("completedRate")),
            payments=[canon_payment(p) for p in x.get("paymentMethods", [])],
            link=(f"https://www.okx.com/p2p/ads-merchant?publicUserId={x['publicUserId']}"
                  if x.get("publicUserId") else
                  f"https://www.okx.com/p2p-markets/{fiat.lower()}/{'buy' if side == 'ask' else 'sell'}-usdt"),
        ))
    return ads


FETCHERS = {"binance": fetch_binance, "bybit": fetch_bybit, "okx": fetch_okx}


def fetch_nbg_usd() -> Optional[float]:
    """Официальный курс USD/GEL Нацбанка Грузии."""
    try:
        d = http_json("https://nbg.gov.ge/gw/api/ct/monetarypolicy/currencies/en/json/?currencies=USD")
        return float(d[0]["currencies"][0]["rate"])
    except Exception:
        return None


# ---------------------------------------------------------------- фильтрация
def good_ad(ad: Ad, cfg: dict, amount: float, min_size: float, pay_keys: List[str]) -> bool:
    """amount — сколько хотим провести, min_size — минимальная осмысленная сделка."""
    f = cfg["filters"]
    if ad.price <= 0:
        return False
    if ad.orders < f["min_orders"] or ad.completion < f["min_completion"]:
        return False
    if ad.min_fiat > amount or ad.max_fiat < min_size:
        return False
    if ad.available_usdt and ad.available_usdt * ad.price < min_size:
        return False
    if pay_keys and not set(ad.payments) & set(pay_keys):
        return False
    if ad.nick.lower() in [n.lower() for n in f.get("blacklist_nicks", [])]:
        return False
    return True


def best(ads: List[Ad], side: str) -> Optional[Ad]:
    if not ads:
        return None
    return min(ads, key=lambda a: a.price) if side == "ask" else max(ads, key=lambda a: a.price)


def ad_cap(ad: Ad) -> float:
    """Сколько фиата можно провести через объявление за один ордер."""
    cap = ad.max_fiat
    if ad.available_usdt:
        cap = min(cap, ad.available_usdt * ad.price)
    return cap


# ---------------------------------------------------------------- деньги
def capital_for(cfg: dict, fiat: str) -> Tuple[float, bool]:
    """(сумма, задана ли пользователем)."""
    bal = cfg.get("balance", {})
    if bal.get(fiat):
        return float(bal[fiat]), True
    return float(cfg["trade_amount"].get(fiat, 1000)), False


def money(x: float, cur: str) -> str:
    return f"{x:,.2f} {cur}".replace(",", " ")


def usdt(x: float) -> str:
    return f"{x:,.2f} USDT".replace(",", " ")


SAFETY = (
    "🛡 <b>Безопасность</b>\n"
    "• Плати только со <b>своего</b> счёта, принимай только от человека с тем же ФИО, что в ордере.\n"
    "• USDT отпускай, только когда деньги <b>уже на счёте</b> (смотри в банке, не скриншот).\n"
    "• Не пиши в назначении платежа «USDT», «крипта», «Binance»."
)


# ---------------------------------------------------------------- сценарии
def plan_cross(fiat, size, ask: Ad, bid: Ad, got_usdt, transfer, sell_usdt, revenue, profit, pct, pay_keys, user_cap):
    same = ask.exchange == bid.exchange
    lines = [
        f"🔁 <b>{fiat}: {ask.ex}{'' if same else ' → ' + bid.ex}</b>  <b>{pct:+.2f}%</b>  ({profit:+.2f} {fiat})",
        "",
        f"💼 Сумма: <b>{money(size, fiat)}</b>" + (" (твой баланс)" if user_cap and size >= user_cap - 0.01
                                                   else " (ограничено лимитом объявления)" if user_cap
                                                   else " (пример — задай баланс: /balance)"),
        "",
        f"<b>1. Купить USDT на {ask.ex}</b>",
        f"P2P → Купить USDT → оплата {ask.banks(pay_keys)}",
        f"Продавец {ask.who()}, цена <b>{ask.price:g}</b>",
        f"Введи сумму <b>{money(size, fiat)}</b> → получишь ≈ <b>{usdt(got_usdt)}</b>",
        f"Переведи {money(size, fiat)} на реквизиты из ордера со своей карты → «Оплачено».",
        f"Лимиты продавца: {ask.min_fiat:g}–{ask.max_fiat:g} {fiat}.",
    ]
    n = 2
    if not same:
        lines += [
            "",
            f"<b>{n}. Перевести USDT {ask.ex} → {bid.ex}</b>",
            f"На {bid.ex}: Активы → Депозит → USDT → скопируй адрес (сеть TRC20, или дешевле: TON / Aptos / BEP20 — если есть на обеих).",
            f"На {ask.ex}: Вывод → USDT → этот адрес, та же сеть. Комиссия ≈ {transfer:g} USDT.",
            f"На {bid.ex} переведи USDT в P2P/Funding-кошелёк.",
        ]
        n += 1
    lines += [
        "",
        f"<b>{n}. Продать USDT на {bid.ex}</b>",
        f"P2P → Продать USDT → оплата {bid.banks(pay_keys)}",
        f"Покупатель {bid.who()}, цена <b>{bid.price:g}</b>",
        f"Продай <b>{usdt(sell_usdt)}</b> → придёт <b>{money(revenue, fiat)}</b>",
        f"Лимиты покупателя: {bid.min_fiat:g}–{bid.max_fiat:g} {fiat}.",
        "",
        f"✅ <b>Итог: {money(size, fiat)} → {money(revenue, fiat)}  ({profit:+.2f} {fiat}, {pct:+.2f}%)</b>",
    ]
    if pct <= 0:
        lines.append("⛔️ Сейчас в минус — <b>не делай</b>, жди сигнала.")
    else:
        lines.append("⏱ Цены меняются за минуты — перед оплатой сверь цену в ордере.")
    return "\n".join(lines)


def plan_maker(fiat, cap, ask: Ad, bid: Ad, buy_p, sell_p, pct, profit, maker_pct, pay_keys, user_cap):
    got = cap / buy_p
    back = got * sell_p * (1 - 2 * maker_pct / 100)
    lines = [
        f"📊 <b>{fiat}: свои объявления на {ask.ex}</b>  <b>{pct:+.2f}%</b> за круг",
        "",
        f"Сейчас: покупают по {bid.price:g} ({bid.nick}), продают по {ask.price:g} ({ask.nick}).",
        f"💼 Сумма: <b>{money(cap, fiat)}</b>" + ("" if user_cap else " (пример — задай баланс: /balance)"),
        "",
        f"<b>1. Объявление «Куплю USDT»</b> на {ask.ex}",
        f"P2P → Разместить объявление → Купить USDT, фиксированная цена <b>{buy_p:g}</b>",
        (f"(на шаг выше лучшего покупателя {bid.price:g}, чтобы стоять первым)." if buy_p > bid.price
         else f"(как у лучшего покупателя — шагнуть внутрь некуда, встанешь в очередь)."),
        f"Объём {money(cap, fiat)} ≈ {usdt(got)}, оплата {bid.banks(pay_keys) or 'твой банк'}, лимит за ордер например {min(cap, 200):g}–{cap:g} {fiat}.",
        "Тебе продают USDT → ты платишь продавцу со своей карты.",
        "",
        f"<b>2. Объявление «Продам USDT»</b>",
        f"Цена <b>{sell_p:g}</b> " + (f"(на шаг ниже лучшего продавца {ask.price:g})." if sell_p < ask.price
                                      else "(как у лучшего продавца)."),
        "У тебя покупают → ждёшь денег на счёт → проверяешь ФИО → отпускаешь USDT.",
        "",
        f"✅ <b>Один полный круг: {money(cap, fiat)} → {money(back, fiat)}  ({profit:+.2f} {fiat})</b>",
        f"Учтена комиссия мейкера {maker_pct:g}% × 2.",
        "",
        "⚠️ Следи за объявлениями: если кто-то перебил цену — подвинь свою на шаг. "
        "Если цена ушла против тебя — не продавай в минус, подожди.",
        "ℹ️ Чтобы ставить объявления, нужна верификация; на OKX и Bybit часто нужен статус мерчанта.",
    ]
    if ask.nick == bid.nick:
        lines.insert(1, f"⚠️ На обеих сторонах один трейдер ({ask.nick}) — клиентов мало, сделки могут идти медленно.")
    if pct <= 0:
        lines.insert(1, "⛔️ Спред слишком узкий — сейчас <b>не выгодно</b>.")
    return "\n".join(lines)


def plan_fx(route, start_cur, end_cur, start, ask: Ad, bid: Ad, got_usdt, transfer, mid, bank_rate, nbg, end, pct, pay_keys, user_cap):
    same = ask.exchange == bid.exchange
    lines = [
        f"💱 <b>{route}</b> ({ask.ex}{'' if same else ' → ' + bid.ex})  <b>{pct:+.2f}%</b>",
        "",
        f"💼 Старт: <b>{money(start, start_cur)}</b>" + ("" if user_cap else " (пример — задай баланс: /balance)"),
        "",
        f"<b>1.</b> {ask.ex} P2P → купить USDT за {start_cur} у {ask.who()} по <b>{ask.price:g}</b> "
        f"({ask.banks(pay_keys)}) → ≈ {usdt(got_usdt)}",
    ]
    n = 2
    if not same:
        lines.append(f"<b>{n}.</b> Вывести USDT на {bid.ex} (комиссия ≈ {transfer:g} USDT)")
        n += 1
    other = "USD" if start_cur == "GEL" else "GEL"
    lines += [
        f"<b>{n}.</b> {bid.ex} P2P → продать USDT за {other} {bid.who()} по <b>{bid.price:g}</b> "
        f"({bid.banks(pay_keys)}) → ≈ {money(mid, other)}",
        f"<b>{n+1}.</b> В банке обменять {other} → {end_cur} по ≈ {bank_rate:.4f} (НБГ {nbg:.4f})",
        "",
        f"✅ <b>Итог: {money(start, start_cur)} → {money(end, end_cur)}  ({pct:+.2f}%)</b>",
        "Курс банка — оценка; посмотри точный в приложении банка перед стартом.",
    ]
    if pct <= 0:
        lines.append("⛔️ Сейчас в минус — <b>не делай</b>.")
    return "\n".join(lines)


# ---------------------------------------------------------------- анализ
def scan(cfg: dict) -> Tuple[Dict, List[Opportunity], Optional[float]]:
    """Возвращает книги {fiat: {exchange: {ask: Ad, bid: Ad}}}, окна со сценариями и курс НБГ."""
    book: Dict[str, Dict[str, Dict[str, Optional[Ad]]]] = {}
    pay_keys = [k.lower() for k in cfg.get("payment_methods", [])]
    pages = cfg.get("pages", 2)

    def fetch_best(job):
        fiat, ex, side = job
        amount, _ = capital_for(cfg, fiat)
        min_size = min(amount, float(cfg["trade_amount"].get(fiat, amount)))
        try:
            ads = FETCHERS[ex](fiat, side, min_size, pay_keys, pages)
            return job, best([a for a in ads if good_ad(a, cfg, amount, min_size, pay_keys)], side)
        except Exception as e:
            log(f"[{ex} {fiat} {side}] ошибка: {e}")
            return job, None

    if "bybit" in cfg["exchanges"]:
        _bybit_payment_names()  # справочник грузится ~10 с один раз — не дёргаем его из каждого потока
    # все запросы к биржам — параллельно: проход занимает секунды, а не ~20 с
    jobs =[(f, ex, s) for f in cfg["fiats"] for ex in cfg["exchanges"] for s in ("ask", "bid")]
    with ThreadPoolExecutor(max_workers=min(12, len(jobs))) as pool:
        nbg_future = pool.submit(fetch_nbg_usd) if {"GEL", "USD"} <= set(cfg["fiats"]) else None
        for (fiat, ex, side), ad in pool.map(fetch_best, jobs):
            book.setdefault(fiat, {}).setdefault(ex, {})[side] = ad
        nbg = nbg_future.result() if nbg_future else None

    opps: List[Opportunity] = []
    fees = cfg["fees"]
    taker = fees["taker_pct"] / 100

    # 1) cross: купить на A, продать на B
    for fiat, exs in book.items():
        cap, user_cap = capital_for(cfg, fiat)
        for a_ex, a in exs.items():
            ask = a.get("ask")
            if not ask:
                continue
            for b_ex, b in exs.items():
                bid = b.get("bid")
                if not bid:
                    continue
                transfer = 0.0 if a_ex == b_ex else fees["withdraw_usdt"].get(a_ex, 1.0)
                # сколько реально провести: баланс, лимит продавца, лимит покупателя
                size = min(cap, ad_cap(ask), (ad_cap(bid) / bid.price + transfer) * ask.price)
                got = size / ask.price
                sell = got - transfer
                revenue = sell * bid.price * (1 - taker)
                if sell <= 0 or revenue < bid.min_fiat:
                    continue
                profit = revenue - size
                pct = profit / size * 100
                head = f"🔁 {fiat}: {ask.ex}{'' if a_ex == b_ex else '→' + bid.ex}"
                plan = plan_cross(fiat, size, ask, bid, got, transfer, sell, revenue, profit, pct, pay_keys, cap if user_cap else 0)
                opps.append(Opportunity("cross", f"cross:{fiat}:{a_ex}:{b_ex}", pct, profit, fiat, head, plan))

    # 2) maker: свои объявления внутри биржи
    mk = fees["maker_pct"]
    for fiat, exs in book.items():
        cap, user_cap = capital_for(cfg, fiat)
        for ex, s in exs.items():
            ask, bid = s.get("ask"), s.get("bid")
            if not ask or not bid:
                continue
            tick = 10 ** -max(ask.decimals, bid.decimals, 2)
            buy_p, sell_p = round(bid.price + tick, 6), round(ask.price - tick, 6)
            if sell_p <= buy_p:
                buy_p, sell_p = bid.price, ask.price
            profit = cap / buy_p * sell_p * (1 - 2 * mk / 100) - cap
            pct = profit / cap * 100
            head = f"📊 {fiat}: спред на {ask.ex}"
            plan = plan_maker(fiat, cap, ask, bid, buy_p, sell_p, pct, profit, mk, pay_keys, user_cap)
            opps.append(Opportunity("maker", f"maker:{fiat}:{ex}", pct, profit, fiat, head, plan))

    # 3) fx-круг GEL ↔ USD через USDT и банк
    if nbg and {"GEL", "USD"} <= set(book):
        bank = fees["bank_fx_spread_pct"] / 100
        usd_to_gel = nbg * (1 - bank)   # продаём USD банку
        gel_to_usd = nbg * (1 + bank)   # покупаем USD у банка
        for a_ex in cfg["exchanges"]:
            for b_ex in cfg["exchanges"]:
                transfer = 0.0 if a_ex == b_ex else fees["withdraw_usdt"].get(a_ex, 1.0)
                for start_cur, other in (("GEL", "USD"), ("USD", "GEL")):
                    ask, bid = book[start_cur][a_ex].get("ask"), book[other][b_ex].get("bid")
                    if not ask or not bid:
                        continue
                    cap, user_cap = capital_for(cfg, start_cur)
                    start = min(cap, ad_cap(ask))
                    got = start / ask.price
                    mid = min((got - transfer) * bid.price * (1 - taker), ad_cap(bid))
                    if mid <= 0 or mid < bid.min_fiat:
                        continue
                    if start_cur == "GEL":
                        rate, end = usd_to_gel, mid * usd_to_gel
                    else:
                        rate, end = gel_to_usd, mid / gel_to_usd
                    pct = (end / start - 1) * 100
                    route = f"{start_cur}→USDT→{other}→{start_cur}"
                    plan = plan_fx(route, start_cur, start_cur, start, ask, bid, got, transfer, mid, rate, nbg, end, pct, pay_keys, user_cap)
                    opps.append(Opportunity("fx", f"fx:{start_cur}:{a_ex}:{b_ex}", pct, end - start, start_cur, "💱 " + route, plan))

    opps.sort(key=lambda o: o.profit_pct, reverse=True)
    return book, opps, nbg


# ---------------------------------------------------------------- /buy и /sell
CUR_ALIAS = {"ЛАРИ": "GEL", "₾": "GEL", "GEL": "GEL", "$": "USD", "ДОЛЛАР": "USD", "ДОЛЛАРОВ": "USD",
             "ДОЛЛАРА": "USD", "USD": "USD", "USDT": "USDT", "ЮСДТ": "USDT"}


def parse_amount(cfg: dict, args: List[str]) -> Tuple[float, str, str]:
    """'/buy 500 gel' | '/buy 200 usdt' | '/buy usd 300' | '/buy' -> (сумма, валюта суммы, фиат)."""
    amount, cur = None, None
    for a in args:
        a2 = a.replace(",", ".")
        try:
            amount = float(a2)
            continue
        except ValueError:
            pass
        cur = CUR_ALIAS.get(a.upper(), a.upper())
    fiat = cur if cur in cfg["fiats"] else "GEL"
    if cur == "USDT":
        unit = "USDT"
    elif cur and cur not in cfg["fiats"]:
        raise ValueError(f"Валюта {cur} не поддерживается. Можно: {', '.join(cfg['fiats'])}, USDT")
    else:
        unit = fiat
    if amount is None:
        amount, _ = capital_for(cfg, fiat)
        unit = fiat
    if amount <= 0:
        raise ValueError("Сумма должна быть больше нуля")
    return amount, unit, fiat


def quote(cfg: dict, side: str, args: List[str], top: int = 5) -> str:
    """side='ask' — где купить USDT дешевле всего, 'bid' — где продать дороже всего."""
    try:
        amount, unit, fiat = parse_amount(cfg, args)
    except ValueError as e:
        return f"{e}\n\nПримеры: /buy 500 gel • /buy 200 usdt • /sell 300 usd"
    pay_keys = [k.lower() for k in cfg.get("payment_methods", [])]
    server_amount = amount if unit != "USDT" else 0

    def get(ex):
        try:
            return FETCHERS[ex](fiat, side, server_amount, pay_keys, cfg.get("pages", 2))
        except Exception as e:
            log(f"[{ex} {fiat} {side}] ошибка: {e}")
            return []

    with ThreadPoolExecutor(len(cfg["exchanges"])) as pool:
        ads = [a for lst in pool.map(get, cfg["exchanges"]) for a in lst]

    def fiat_of(ad):  # сколько фиата в этой сделке
        return amount * ad.price if unit == "USDT" else amount

    ads = [a for a in ads if good_ad(a, cfg, fiat_of(a), fiat_of(a), pay_keys)]
    ads.sort(key=lambda a: a.price, reverse=(side == "bid"))
    seen, uniq = set(), []
    for a in ads:
        if (a.exchange, a.nick) not in seen:
            seen.add((a.exchange, a.nick))
            uniq.append(a)
    if not uniq:
        return (f"😕 Не нашёл подходящих объявлений на {amount:g} {unit}.\n"
                "Попробуй другую сумму — у продавцов есть мин/макс лимиты.")

    buy = side == "ask"
    if unit == "USDT":
        title = f"🛒 <b>Купить {amount:g} USDT за {fiat}</b>" if buy else f"💰 <b>Продать {amount:g} USDT за {fiat}</b>"
    else:
        title = f"🛒 <b>Купить USDT на {amount:g} {unit}</b>" if buy else f"💰 <b>Продать USDT за {amount:g} {unit}</b>"
    lines = [title, f"Лучшие {min(top, len(uniq))} из {len(uniq)} надёжных объявлений (Binance, Bybit, OKX)", ""]
    medals = ["🥇", "🥈", "🥉", "4.", "5.", "6.", "7.", "8."]
    for i, a in enumerate(uniq[:top]):
        f_amt = fiat_of(a)
        u_amt = amount if unit == "USDT" else amount / a.price
        deal = (f"{money(f_amt, fiat)} → <b>{usdt(u_amt)}</b>" if buy
                else f"{usdt(u_amt)} → <b>{money(f_amt, fiat)}</b>")
        lines += [
            f"{medals[i]} <b>{a.price:g}</b> — {a.ex} — {a.who()}",
            f"    {deal}",
            f"    {a.banks(pay_keys)} • лимит {a.min_fiat:g}–{a.max_fiat:g} {fiat} • <a href=\"{a.link}\">открыть</a>",
            "",
        ]
    b, w = uniq[0], uniq[min(top, len(uniq)) - 1]
    if len(uniq) > 1 and b.price != w.price:
        if unit == "USDT":
            diff = abs(b.price - w.price) * amount
        else:
            diff = abs(amount / b.price - amount / w.price) * (b.price if buy else w.price)
        lines.append(f"💡 Лучший вариант выгоднее {len(uniq[:top])}-го на ≈ {money(diff, fiat)}.")
    if fiat == "GEL":
        nbg = fetch_nbg_usd()
        if nbg:
            d = (b.price / nbg - 1) * 100
            lines.append(f"📈 1 USDT = {b.price:g} GEL — это на {abs(d):.2f}% {'дешевле' if d < 0 else 'дороже'} "
                         f"официального доллара (НБГ {nbg:.4f}).")
    lines += ["", "⚠️ Ссылка ведёт на профиль трейдера — выбери у него объявление с этой ценой. "
              "Платить только со своего счёта, USDT отпускать после поступления денег."]
    return "\n".join(lines)


# ---------------------------------------------------------------- Telegram
def tg_send(cfg: dict, text: str) -> bool:
    token, chat = cfg["telegram"]["bot_token"], cfg["telegram"]["chat_id"]
    if not token or not chat:
        return False
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    for chunk in [text[i:i + 4000] for i in range(0, len(text), 4000)]:
        body = {"chat_id": chat, "text": chunk, "parse_mode": "HTML", "disable_web_page_preview": True}
        try:
            http_json(url, body)
        except Exception as e:
            log(f"Telegram ошибка: {e}")
            return False
    return True


HELP = (
    "🤖 <b>P2P-сканер USDT</b>\n\n"
    "<b>Сначала скажи, сколько у тебя денег:</b>\n"
    "/balance 2000 gel\n"
    "/balance 500 usd\n"
    "/balance — показать баланс\n\n"
    "<b>Где выгоднее купить / продать USDT:</b>\n"
    "/buy 500 gel — где купить USDT на 500 лари\n"
    "/buy 200 usdt — где купить 200 USDT\n"
    "/sell 300 usd — где продать USDT за 300 $\n\n"
    "/plan — лучший арбитражный сценарий, по шагам\n"
    "/scan — цены на всех биржах\n"
    "<b>Алерты:</b>\n"
    "/alert buy 2.57 — напишу, когда USDT будет по 2.57 или дешевле\n"
    "/alert sell 2.62 — когда можно продать по 2.62 или дороже\n"
    "/alert — список алертов\n"
    "/threshold — порог прибыли для сигналов\n"
    "/interval 20 — как часто проверять (сек)\n\n"
    "/pause — выключить уведомления\n"
    "/resume — включить уведомления\n"
    "/help — эта справка\n\n"
    "Когда появится выгодное окно, я сам пришлю пошаговый план под твою сумму."
)


def load_balance() -> Dict[str, float]:
    try:
        with open(BALANCE_FILE) as f:
            return {k.upper(): float(v) for k, v in json.load(f).items()}
    except Exception:
        return {}


def save_balance(bal: Dict[str, float]):
    with open(BALANCE_FILE, "w") as f:
        json.dump(bal, f)


SETTINGS_FILE = os.path.join(HERE, "settings.json")
KIND_NAMES = {"cross": "купить→продать", "maker": "свои объявления", "fx": "через доллар"}


def load_settings() -> dict:
    try:
        with open(SETTINGS_FILE) as f:
            return json.load(f)
    except Exception:
        return {}


def save_settings(cfg: dict):
    with open(SETTINGS_FILE, "w") as f:
        json.dump({"interval_sec": cfg["interval_sec"],
                   "alert_min_profit_pct": cfg["alert_min_profit_pct"],
                   "price_alerts": cfg.get("price_alerts", [])}, f, ensure_ascii=False)


def handle_interval(cfg: dict, args: List[str]) -> str:
    if args:
        try:
            sec = int(float(args[0]))
        except ValueError:
            return "Пример: /interval 30"
        cfg["interval_sec"] = max(10, min(3600, sec))
        save_settings(cfg)
        return f"⏱ Теперь проверяю каждые <b>{cfg['interval_sec']} сек</b>. Применится со следующей проверки."
    return f"⏱ Проверяю каждые <b>{cfg['interval_sec']} сек</b>.\nИзменить: /interval 20 (от 10 до 3600)"


def handle_threshold(cfg: dict, args: List[str]) -> str:
    t = cfg["alert_min_profit_pct"]
    if len(args) >= 2:
        kind = {"купить": "cross", "свои": "maker", "доллар": "fx"}.get(args[0].lower(), args[0].lower())
        if kind not in t:
            return "Тип: cross, maker или fx. Пример: /threshold maker 0.5"
        try:
            t[kind] = float(args[1].replace(",", "."))
        except ValueError:
            return "Пример: /threshold maker 0.5"
        save_settings(cfg)
    lines = ["🎚 <b>Порог сигнала</b> (минимальная прибыль):"]
    lines += [f"• {k} ({KIND_NAMES[k]}): <b>{v:g}%</b>" for k, v in t.items()]
    lines += ["", "Чем ниже порог — тем чаще сигналы (но меньше прибыль).",
              "Изменить: /threshold maker 0.5  •  /threshold cross 0.1"]
    return "\n".join(lines)


def handle_alert(cfg: dict, args: List[str]) -> str:
    alerts = cfg.setdefault("price_alerts", [])
    usage = ("Примеры:\n/alert buy 2.57 — напишу, когда USDT можно купить по 2.57 GEL или дешевле\n"
             "/alert sell 2.62 — когда можно продать по 2.62 или дороже\n"
             "/alert buy 0.99 usd — то же в долларах\n"
             "/alert — список  •  /alert del 1 — удалить  •  /alert off — удалить все")
    if not args:
        if not alerts:
            return "🔔 Ценовых алертов нет.\n\n" + usage
        rows = [f"{i}. {'купить' if a['side'] == 'buy' else 'продать'} по "
                f"{'≤' if a['side'] == 'buy' else '≥'} {a['price']:g} {a['fiat']}" for i, a in enumerate(alerts, 1)]
        return "🔔 <b>Твои алерты:</b>\n" + "\n".join(rows) + "\n\n" + usage
    cmd = args[0].lower()
    if cmd in ("off", "clear", "выкл"):
        alerts.clear()
        save_settings(cfg)
        return "🔕 Все ценовые алерты удалены."
    if cmd in ("del", "rm", "удалить"):
        try:
            removed = alerts.pop(int(args[1]) - 1)
        except (IndexError, ValueError):
            return "Пример: /alert del 1"
        save_settings(cfg)
        return f"Удалил: {removed['side']} {removed['price']:g} {removed['fiat']}"
    side = {"buy": "buy", "купить": "buy", "sell": "sell", "продать": "sell"}.get(cmd)
    if not side or len(args) < 2:
        return usage
    try:
        price = float(args[1].replace(",", "."))
    except ValueError:
        return usage
    fiat = CUR_ALIAS.get(args[2].upper(), args[2].upper()) if len(args) > 2 else ("USD" if price < 1.5 else "GEL")
    if fiat not in cfg["fiats"]:
        return f"Валюта {fiat} не сканируется. Можно: {', '.join(cfg['fiats'])}"
    alerts.append({"side": side, "price": price, "fiat": fiat})
    save_settings(cfg)
    return (f"🔔 Готово! Напишу, как только USDT можно будет "
            f"{'купить по ' + format(price, 'g') + ' ' + fiat + ' или дешевле' if side == 'buy' else 'продать по ' + format(price, 'g') + ' ' + fiat + ' или дороже'}.\n"
            f"Проверяю каждые {cfg['interval_sec']} сек.")


def check_price_alerts(cfg: dict, book: Dict) -> List[str]:
    """Срабатывает один раз и удаляет алерт. Возвращает тексты сообщений."""
    out, left = [], []
    for a in cfg.get("price_alerts", []):
        side = "ask" if a["side"] == "buy" else "bid"
        ads = [s.get(side) for s in book.get(a["fiat"], {}).values() if s.get(side)]
        b = best(ads, side)
        hit = b and (b.price <= a["price"] if side == "ask" else b.price >= a["price"])
        if not hit:
            left.append(a)
            continue
        verb = "купить" if side == "ask" else "продать"
        out.append(
            f"🔔 <b>Алерт сработал!</b>\n\nСейчас можно <b>{verb}</b> USDT по <b>{b.price:g} {a['fiat']}</b> "
            f"(ты ждал {'≤' if side == 'ask' else '≥'} {a['price']:g})\n\n"
            f"{b.ex} — {b.who()}\n{b.banks([k.lower() for k in cfg.get('payment_methods', [])])} • "
            f"лимит {b.min_fiat:g}–{b.max_fiat:g} {a['fiat']} • <a href=\"{b.link}\">открыть</a>\n\n"
            f"Все варианты: /{'buy' if side == 'ask' else 'sell'} {a['fiat'].lower()}\n"
            f"Алерт удалён. Поставить снова: /alert {a['side']} {a['price']:g} {a['fiat'].lower()}"
        )
    if out:
        cfg["price_alerts"] = left
        save_settings(cfg)
    return out


def balance_text(cfg: dict) -> str:
    bal = cfg.get("balance", {})
    if not bal:
        return "💼 Баланс не задан. Напиши, например: /balance 2000 gel"
    return "💼 <b>Твой баланс:</b>\n" + "\n".join(money(v, k) for k, v in bal.items()) + \
        "\n\nИзменить: /balance 1500 gel  •  удалить: /balance 0 usd"


def handle_balance(cfg: dict, args: List[str]) -> str:
    if not args:
        return balance_text(cfg)
    try:
        amount = float(args[0].replace(",", "."))
        cur = (args[1] if len(args) > 1 else "GEL").upper()
        cur = {"ЛАРИ": "GEL", "ЛАРИ.": "GEL", "₾": "GEL", "$": "USD", "ДОЛЛАР": "USD", "ДОЛЛАРОВ": "USD"}.get(cur, cur)
    except ValueError:
        return "Не понял. Пример: /balance 2000 gel"
    if cur not in cfg["fiats"]:
        return f"Валюта {cur} не сканируется. Доступно: {', '.join(cfg['fiats'])}"
    bal = cfg.setdefault("balance", {})
    if amount <= 0:
        bal.pop(cur, None)
    else:
        bal[cur] = amount
    save_balance(bal)
    return balance_text(cfg) + "\n\nТеперь /plan покажет сценарий под эту сумму."


class TgBot:
    """Простой бот на long polling: принимает команды и шлёт сигналы."""

    def __init__(self, cfg: dict):
        self.cfg = cfg
        self.token = cfg["telegram"]["bot_token"]
        self.offset = 0
        self.paused = False
        if not cfg["telegram"]["chat_id"] and os.path.exists(CHAT_FILE):
            cfg["telegram"]["chat_id"] = open(CHAT_FILE).read().strip()

    @property
    def chat_id(self) -> str:
        return str(self.cfg["telegram"]["chat_id"] or "")

    def poll(self, wait_sec: float, handlers: Dict):
        """Слушает команды до wait_sec секунд."""
        end = time.time() + wait_sec
        while time.time() < end:
            t = max(1, min(25, int(end - time.time())))
            try:
                url = (f"https://api.telegram.org/bot{self.token}/getUpdates"
                       f"?timeout={t}&offset={self.offset}")
                d = http_json(url, timeout=t + 10)
            except Exception as e:
                log(f"Telegram polling ошибка: {e}")
                time.sleep(5)
                continue
            for u in d.get("result", []):
                self.offset = u["update_id"] + 1
                msg = u.get("message") or {}
                chat = str((msg.get("chat") or {}).get("id", ""))
                parts = (msg.get("text") or "").strip().split()
                if not chat or not parts or not parts[0].startswith("/"):
                    continue
                cmd, args = parts[0].split("@")[0].lower(), parts[1:]
                if not self.chat_id:  # первый, кто написал боту, становится владельцем
                    self.cfg["telegram"]["chat_id"] = chat
                    with open(CHAT_FILE, "w") as f:
                        f.write(chat)
                    log(f"Привязан chat_id {chat}")
                if chat != self.chat_id:
                    continue  # чужие чаты игнорируем
                try:
                    self.dispatch(cmd, args, handlers)
                except Exception as e:
                    tg_send(self.cfg, f"Ошибка: {e}")

    def dispatch(self, cmd: str, args: List[str], handlers: Dict):
        if cmd in ("/start", "/help"):
            tg_send(self.cfg, HELP)
        elif cmd == "/pause":
            self.paused = True
            tg_send(self.cfg, "⏸ Уведомления выключены. /resume — включить.")
        elif cmd == "/resume":
            self.paused = False
            tg_send(self.cfg, "▶️ Уведомления включены.")
        elif cmd in ("/balance", "/bal"):
            tg_send(self.cfg, handle_balance(self.cfg, args))
        elif cmd == "/alert":
            tg_send(self.cfg, handle_alert(self.cfg, args))
        elif cmd == "/interval":
            tg_send(self.cfg, handle_interval(self.cfg, args))
        elif cmd == "/threshold":
            tg_send(self.cfg, handle_threshold(self.cfg, args))
        elif cmd in ("/buy", "/sell"):
            tg_send(self.cfg, "⏳ Ищу лучшие предложения (~10 сек)…")
            tg_send(self.cfg, quote(self.cfg, "ask" if cmd == "/buy" else "bid", args))
        elif cmd in handlers:
            tg_send(self.cfg, "⏳ Сканирую биржи (~20 сек)…")
            handlers[cmd]()
        else:
            tg_send(self.cfg, "Не знаю такой команды.\n\n" + HELP)


def book_text(book: Dict, nbg: Optional[float]) -> str:
    lines = []
    for fiat, exs in book.items():
        lines.append(f"<b>{fiat}</b>" + (f" (НБГ {nbg:.4f})" if fiat == "USD" and nbg else ""))
        lines.append("<code>биржа    купить  продать</code>")
        for ex, s in exs.items():
            ask, bid = s.get("ask"), s.get("bid")
            lines.append(f"<code>{ex:<8}{(f'{ask.price:g}' if ask else '—'):>7}{(f'{bid.price:g}' if bid else '—'):>9}</code>")
        lines.append("")
    return "\n".join(lines)


class Deduper:
    """Не шлёт одно и то же окно чаще cooldown, если прибыль заметно не выросла."""

    def __init__(self, cooldown_min: float, improve_pct: float):
        self.cooldown = cooldown_min * 60
        self.improve = improve_pct
        self.sent: Dict[str, Tuple[float, float]] = {}

    def should_send(self, o: Opportunity) -> bool:
        last = self.sent.get(o.key)
        now = time.time()
        if last and now - last[0] < self.cooldown and o.profit_pct < last[1] + self.improve:
            return False
        self.sent[o.key] = (now, o.profit_pct)
        return True


# ---------------------------------------------------------------- вывод
def log(msg: str):
    print(f"[{datetime.now():%H:%M:%S}] {msg}", flush=True)


def print_book(book: Dict, nbg: Optional[float]):
    for fiat, exs in book.items():
        print(f"\n  {fiat}{f'   (НБГ USD = {nbg:.4f} GEL)' if fiat == 'USD' and nbg else ''}")
        print(f"  {'биржа':<9}{'купить USDT':>13}{'продать USDT':>14}   продавец / покупатель")
        for ex, s in exs.items():
            ask, bid = s.get("ask"), s.get("bid")
            print(f"  {ex:<9}{(f'{ask.price:g}' if ask else '—'):>13}{(f'{bid.price:g}' if bid else '—'):>14}   "
                  f"{ask.nick if ask else '—'} / {bid.nick if bid else '—'}")


def strip_html(s: str) -> str:
    return re.sub(r"<[^>]+>", "", s)


def thresholds(cfg: dict) -> Dict[str, float]:
    t = cfg["alert_min_profit_pct"]
    return {"cross": t["cross"], "maker": t["maker"], "fx": t["fx"]}


def mine(cfg: dict, opps: List[Opportunity]) -> List[Opportunity]:
    """Если баланс задан — только окна в тех валютах, которые у тебя есть."""
    bal = cfg.get("balance") or {}
    return [o for o in opps if o.fiat in bal] if bal else opps


def best_plans(cfg: dict, opps: List[Opportunity]) -> str:
    """Лучший сценарий каждого типа: сначала выгодные, иначе честно — что лучшее и почему не делать."""
    th = thresholds(cfg)
    opps = mine(cfg, opps)
    names = {"cross": "Купить и сразу продать", "maker": "Свои объявления", "fx": "Через доллар и банк"}
    out = []
    for kind in ("cross", "maker", "fx"):
        ks = [o for o in opps if o.kind == kind]
        if not ks:
            continue
        o = ks[0]
        ok = o.profit_pct >= th[kind]
        out.append(f"{'🟢' if ok else '🔴'} <b>{names[kind]}</b>: лучшее {o.profit_pct:+.2f}% "
                   f"({o.profit_abs:+.2f} {o.fiat})" + ("" if ok else " — ниже порога"))
    good = [o for o in opps if o.profit_pct >= th[o.kind]]
    head = "\n".join(out)
    if good:
        return head + "\n\n━━━━━━━━━━━━\n\n" + good[0].plan + "\n\n" + SAFETY
    return (head + "\n\n😐 <b>Сейчас выгодного окна нет.</b> Ничего не делай — я напишу, когда появится.\n\n"
            "Для понимания, как выглядел бы лучший вариант:\n\n━━━━━━━━━━━━\n\n" + opps[0].plan) if opps else head


# ---------------------------------------------------------------- конфиг
DEFAULT_CFG = {
    "exchanges": ["binance", "bybit", "okx"],
    "fiats": ["GEL", "USD"],
    "trade_amount": {"GEL": 1000, "USD": 400},
    "payment_methods": ["tbc", "bog", "liberty", "credo"],
    "pages": 2,
    "filters": {"min_orders": 50, "min_completion": 0.95, "blacklist_nicks": []},
    "fees": {
        "taker_pct": 0.0,
        "maker_pct": 0.2,
        "withdraw_usdt": {"binance": 1.0, "bybit": 1.0, "okx": 1.0},
        "bank_fx_spread_pct": 1.0,
    },
    "alert_min_profit_pct": {"cross": 0.3, "maker": 1.0, "fx": 0.7},
    "interval_sec": 20,
    "cooldown_min": 30,
    "resend_if_better_by_pct": 0.2,
    "telegram": {"bot_token": "", "chat_id": ""},
}


def deep_merge(base: dict, over: dict) -> dict:
    out = dict(base)
    for k, v in over.items():
        out[k] = deep_merge(base[k], v) if isinstance(v, dict) and isinstance(base.get(k), dict) else v
    return out


def load_cfg(path: str) -> dict:
    cfg = deep_merge(DEFAULT_CFG, {})
    if os.path.exists(path):
        with open(path, encoding="utf-8") as f:
            cfg = deep_merge(DEFAULT_CFG, json.load(f))
    cfg["telegram"] = dict(cfg["telegram"])
    cfg["telegram"]["bot_token"] = os.environ.get("TG_BOT_TOKEN", cfg["telegram"]["bot_token"])
    cfg["telegram"]["chat_id"] = os.environ.get("TG_CHAT_ID", cfg["telegram"]["chat_id"])
    cfg["fiats"] = [f.upper() for f in cfg["fiats"]]
    cfg["exchanges"] = [e.lower() for e in cfg["exchanges"] if e.lower() in FETCHERS]
    cfg["balance"] = load_balance()
    s = load_settings()  # то, что менял через бота, важнее config.json
    if "interval_sec" in s:
        cfg["interval_sec"] = s["interval_sec"]
    cfg["alert_min_profit_pct"] = {**cfg["alert_min_profit_pct"], **s.get("alert_min_profit_pct", {})}
    cfg["price_alerts"] = s.get("price_alerts", [])
    return cfg


# ---------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser(description="P2P USDT сканер GEL/USD")
    ap.add_argument("--config", default=os.path.join(HERE, "config.json"))
    ap.add_argument("--once", action="store_true", help="один проход и выход")
    ap.add_argument("--all", action="store_true", help="показать все окна, даже убыточные")
    ap.add_argument("--plan", action="store_true", help="напечатать лучший сценарий")
    ap.add_argument("--test-telegram", action="store_true", help="отправить тестовое сообщение")
    ap.add_argument("--buy", nargs="*", metavar="ARG", help="где купить USDT, напр. --buy 500 gel")
    ap.add_argument("--sell", nargs="*", metavar="ARG", help="где продать USDT, напр. --sell 200 usdt")
    args = ap.parse_args()

    cfg = load_cfg(args.config)
    bot = TgBot(cfg) if cfg["telegram"]["bot_token"] else None

    if args.buy is not None or args.sell is not None:
        side, a = ("ask", args.buy) if args.buy is not None else ("bid", args.sell)
        print(strip_html(quote(cfg, side, a)))
        return

    if args.test_telegram:
        ok = tg_send(cfg, "✅ P2P-сканер подключён к Telegram.")
        print("Отправлено" if ok else "Не удалось: проверь bot_token / chat_id")
        return

    dedup = Deduper(cfg["cooldown_min"], cfg["resend_if_better_by_pct"])
    if not args.once:
        log(f"Старт: {', '.join(cfg['exchanges'])} | {', '.join(cfg['fiats'])} | "
            f"каждые {cfg['interval_sec']} с | Telegram {'вкл' if bot else 'выкл'}")
        if bot and not bot.chat_id:
            log("Напиши своему боту /start в Telegram — он запомнит твой чат.")
        elif bot:
            tg_send(cfg, "✅ Сканер обновлён и запущен.\n\n" + HELP)

    def cmd_scan():
        book, opps, nbg = scan(cfg)
        tg_send(cfg, book_text(book, nbg) + "Пошаговый план: /plan")

    def cmd_plan():
        _, opps, _ = scan(cfg)
        tg_send(cfg, best_plans(cfg, opps))

    handlers = {"/scan": cmd_scan, "/plan": cmd_plan}

    while True:
        try:
            book, opps, nbg = scan(cfg)
            print_book(book, nbg)
            th = thresholds(cfg)  # мог измениться через /threshold
            hits = [o for o in opps if o.profit_pct >= th[o.kind]]
            print()
            if args.plan:
                print(strip_html(best_plans(cfg, opps)))
            else:
                for o in (opps if args.all else hits)[:15]:
                    print(strip_html(o.plan) + "\n")
                if not hits:
                    top = opps[0] if opps else None
                    log("Выгодных окон нет" + (f" (лучшее: {top.kind} {top.profit_pct:+.2f}%)" if top else ""))
            if bot and bot.chat_id and not bot.paused:
                for msg in check_price_alerts(cfg, book):
                    tg_send(cfg, msg)
                for o in mine(cfg, hits):
                    if dedup.should_send(o):
                        tg_send(cfg, "🚨 <b>Сигнал!</b>\n\n" + o.plan + "\n\n" + SAFETY)
        except KeyboardInterrupt:
            raise
        except Exception as e:
            log(f"Ошибка цикла: {e}")
        if args.once:
            break
        if bot:
            bot.poll(cfg["interval_sec"], handlers)
        else:
            time.sleep(cfg["interval_sec"])


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nОстановлено.")
        sys.exit(0)
