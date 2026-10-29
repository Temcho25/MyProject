#!/usr/bin/env python3
"""
P2P-сканер USDT для GEL и USD (Binance, Bybit, OKX) с уведомлениями в Telegram.

Ищет три вида окон:
  1. cross  — купить USDT на бирже A по лучшей цене продавца, продать на бирже B
              по лучшей цене покупателя (A и B могут совпадать).
  2. maker  — разрыв между лучшим покупателем и продавцом внутри одной биржи
              (зарабатывается, если ставить свои объявления).
  3. fx     — круг через две валюты: GEL -> USDT -> USD -> GEL (и обратно),
              обмен USD/GEL по курсу Нацбанка с поправкой на спред банка.

Только стандартная библиотека Python 3.8+.
Запуск:  python3 scanner.py --once        (один проход, вывод в консоль)
         python3 scanner.py               (бесконечный цикл + Telegram)
         python3 scanner.py --test-telegram
"""

import argparse
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request
from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Optional, Tuple

UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36"
HERE = os.path.dirname(os.path.abspath(__file__))

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


def _norm(s: str) -> str:
    return re.sub(r"[^a-z0-9]", "", str(s).lower())


# нормализованное имя на бирже -> канонический ключ
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
    exchange: str
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


@dataclass
class Opportunity:
    kind: str
    key: str
    profit_pct: float
    text: str


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
                exchange="Binance", fiat=fiat, side=side,
                price=_f(a["price"]),
                min_fiat=_f(a.get("minSingleTransAmount")),
                max_fiat=_f(a.get("dynamicMaxSingleTransAmount") or a.get("maxSingleTransAmount")),
                available_usdt=_f(a.get("tradableQuantity") or a.get("surplusAmount")),
                nick=u.get("nickName", "?"),
                orders=int(_f(u.get("monthOrderCount"))),
                completion=_f(u.get("monthFinishRate")),
                payments=[canon_payment(m.get("identifier") or m.get("tradeMethodName", "")) for m in a.get("tradeMethods", [])],
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
                exchange="Bybit", fiat=fiat, side=side,
                price=_f(x["price"]),
                min_fiat=_f(x.get("minAmount")),
                max_fiat=_f(x.get("maxAmount")),
                available_usdt=_f(x.get("lastQuantity")),
                nick=x.get("nickName", "?"),
                orders=int(_f(x.get("recentOrderNum"))),
                completion=_f(x.get("recentExecuteRate")) / 100.0,
                payments=[canon_payment(names.get(str(p), str(p))) for p in x.get("payments", [])],
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
            exchange="OKX", fiat=fiat, side=side,
            price=_f(x["price"]),
            min_fiat=_f(x.get("quoteMinAmountPerOrder")),
            max_fiat=_f(x.get("quoteMaxAmountPerOrder")),
            available_usdt=_f(x.get("availableAmount")),
            nick=x.get("nickName", "?"),
            orders=int(_f(x.get("completedOrderQuantity"))),
            completion=_f(x.get("completedRate")),
            payments=[canon_payment(p) for p in x.get("paymentMethods", [])],
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
def good_ad(ad: Ad, cfg: dict, amount: float, pay_keys: List[str]) -> bool:
    f = cfg["filters"]
    if ad.price <= 0:
        return False
    if ad.orders < f["min_orders"] or ad.completion < f["min_completion"]:
        return False
    if amount and not (ad.min_fiat <= amount <= ad.max_fiat):
        return False
    if amount and ad.available_usdt and ad.available_usdt * ad.price < amount:
        return False
    if pay_keys and not set(ad.payments) & set(pay_keys):
        return False
    blocked = [n.lower() for n in f.get("blacklist_nicks", [])]
    if ad.nick.lower() in blocked:
        return False
    return True


def best(ads: List[Ad], side: str) -> Optional[Ad]:
    if not ads:
        return None
    return min(ads, key=lambda a: a.price) if side == "ask" else max(ads, key=lambda a: a.price)


# ---------------------------------------------------------------- анализ
def scan(cfg: dict) -> Tuple[Dict, List[Opportunity], Optional[float]]:
    """Возвращает книги {fiat: {exchange: {ask: Ad, bid: Ad}}}, найденные окна и курс НБГ."""
    book: Dict[str, Dict[str, Dict[str, Optional[Ad]]]] = {}
    pay_keys = [k.lower() for k in cfg.get("payment_methods", [])]
    pages = cfg.get("pages", 2)

    for fiat in cfg["fiats"]:
        amount = float(cfg["trade_amount"].get(fiat, 0))
        book[fiat] = {}
        for ex in cfg["exchanges"]:
            book[fiat][ex] = {}
            for side in ("ask", "bid"):
                try:
                    ads = FETCHERS[ex](fiat, side, amount, pay_keys, pages)
                    ads = [a for a in ads if good_ad(a, cfg, amount, pay_keys)]
                    book[fiat][ex][side] = best(ads, side)
                except Exception as e:
                    log(f"[{ex} {fiat} {side}] ошибка: {e}")
                    book[fiat][ex][side] = None

    opps: List[Opportunity] = []
    fees = cfg["fees"]

    # 1) cross: купить на A, продать на B
    for fiat, exs in book.items():
        amount = float(cfg["trade_amount"].get(fiat, 0)) or 1000.0
        for a_ex, a in exs.items():
            ask = a.get("ask")
            if not ask:
                continue
            for b_ex, b in exs.items():
                bid = b.get("bid")
                if not bid:
                    continue
                usdt = amount / ask.price
                transfer = 0.0 if a_ex == b_ex else fees["withdraw_usdt"].get(a_ex, 1.0)
                usdt_net = usdt - transfer
                revenue = usdt_net * bid.price * (1 - fees["taker_pct"] / 100)
                profit = revenue - amount
                pct = profit / amount * 100
                route = f"{ask.exchange}→{bid.exchange}" if a_ex != b_ex else f"{ask.exchange} (внутри)"
                text = (
                    f"🔁 <b>{fiat}: {route}</b>  <b>{pct:+.2f}%</b>\n"
                    f"Купить USDT по {ask.price:g} {fiat} у {ask.nick} "
                    f"({ask.orders} сд., {ask.completion*100:.0f}%) [{', '.join(ask.payments)}]\n"
                    f"Продать по {bid.price:g} {fiat} — {bid.nick} "
                    f"({bid.orders} сд., {bid.completion*100:.0f}%) [{', '.join(bid.payments)}]\n"
                    f"На {amount:g} {fiat}: {profit:+.2f} {fiat}"
                    + (f" (перевод −{transfer:g} USDT)" if transfer else "")
                )
                opps.append(Opportunity("cross", f"cross:{fiat}:{a_ex}:{b_ex}", pct, text))

    # 2) maker: спред внутри биржи
    for fiat, exs in book.items():
        for ex, s in exs.items():
            ask, bid = s.get("ask"), s.get("bid")
            if not ask or not bid:
                continue
            gross = (ask.price - bid.price) / bid.price * 100
            pct = gross - 2 * fees["maker_pct"]
            text = (
                f"📊 <b>{fiat}: спред на {ask.exchange}</b>  <b>{pct:+.2f}%</b>\n"
                f"Лучший покупатель {bid.price:g}, лучший продавец {ask.price:g}\n"
                f"Идея: своё объявление на покупку ≈{bid.price:g}+, на продажу ≈{ask.price:g}−"
            )
            opps.append(Opportunity("maker", f"maker:{fiat}:{ex}", pct, text))

    # 3) fx-круг GEL ↔ USD через USDT и банк
    nbg = fetch_nbg_usd() if {"GEL", "USD"} <= set(book) else None
    if nbg:
        bank = fees["bank_fx_spread_pct"] / 100
        usd_to_gel = nbg * (1 - bank)   # продаём USD банку
        gel_to_usd = nbg * (1 + bank)   # покупаем USD у банка
        for a_ex in cfg["exchanges"]:
            for b_ex in cfg["exchanges"]:
                transfer = 0.0 if a_ex == b_ex else fees["withdraw_usdt"].get(a_ex, 1.0)
                # GEL -> USDT(a) -> USD(b) -> GEL
                ask, bid = book["GEL"][a_ex].get("ask"), book["USD"][b_ex].get("bid")
                if ask and bid:
                    start = float(cfg["trade_amount"].get("GEL", 1000))
                    usdt = start / ask.price - transfer
                    end = usdt * bid.price * usd_to_gel
                    pct = (end / start - 1) * 100
                    text = (
                        f"💱 <b>GEL→USDT→USD→GEL</b> ({ask.exchange}→{bid.exchange})  <b>{pct:+.2f}%</b>\n"
                        f"Купить USDT за {ask.price:g} GEL ({ask.nick}), продать за {bid.price:g} USD ({bid.nick}),\n"
                        f"USD→GEL в банке ≈{usd_to_gel:.4f} (НБГ {nbg:.4f})"
                    )
                    opps.append(Opportunity("fx", f"fx:gel-usd:{a_ex}:{b_ex}", pct, text))
                # USD -> USDT(a) -> GEL(b) -> USD
                ask, bid = book["USD"][a_ex].get("ask"), book["GEL"][b_ex].get("bid")
                if ask and bid:
                    start = float(cfg["trade_amount"].get("USD", 400))
                    usdt = start / ask.price - transfer
                    end = usdt * bid.price / gel_to_usd
                    pct = (end / start - 1) * 100
                    text = (
                        f"💱 <b>USD→USDT→GEL→USD</b> ({ask.exchange}→{bid.exchange})  <b>{pct:+.2f}%</b>\n"
                        f"Купить USDT за {ask.price:g} USD ({ask.nick}), продать за {bid.price:g} GEL ({bid.nick}),\n"
                        f"GEL→USD в банке ≈{gel_to_usd:.4f} (НБГ {nbg:.4f})"
                    )
                    opps.append(Opportunity("fx", f"fx:usd-gel:{a_ex}:{b_ex}", pct, text))

    opps.sort(key=lambda o: o.profit_pct, reverse=True)
    return book, opps, nbg


# ---------------------------------------------------------------- Telegram
def tg_send(cfg: dict, text: str) -> bool:
    token, chat = cfg["telegram"]["bot_token"], cfg["telegram"]["chat_id"]
    if not token or not chat:
        return False
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    body = {"chat_id": chat, "text": text, "parse_mode": "HTML", "disable_web_page_preview": True}
    try:
        http_json(url, body)
        return True
    except Exception as e:
        log(f"Telegram ошибка: {e}")
        return False


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
    "interval_sec": 60,
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
    cfg["telegram"]["bot_token"] = os.environ.get("TG_BOT_TOKEN", cfg["telegram"]["bot_token"])
    cfg["telegram"]["chat_id"] = os.environ.get("TG_CHAT_ID", cfg["telegram"]["chat_id"])
    cfg["fiats"] = [f.upper() for f in cfg["fiats"]]
    cfg["exchanges"] = [e.lower() for e in cfg["exchanges"] if e.lower() in FETCHERS]
    return cfg


# ---------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser(description="P2P USDT сканер GEL/USD")
    ap.add_argument("--config", default=os.path.join(HERE, "config.json"))
    ap.add_argument("--once", action="store_true", help="один проход и выход")
    ap.add_argument("--all", action="store_true", help="показать все окна, даже убыточные")
    ap.add_argument("--test-telegram", action="store_true", help="отправить тестовое сообщение")
    args = ap.parse_args()

    cfg = load_cfg(args.config)
    tg_on = bool(cfg["telegram"]["bot_token"] and cfg["telegram"]["chat_id"])

    if args.test_telegram:
        ok = tg_send(cfg, "✅ P2P-сканер подключён к Telegram.")
        print("Отправлено" if ok else "Не удалось: проверь bot_token / chat_id")
        return

    th = thresholds(cfg)
    dedup = Deduper(cfg["cooldown_min"], cfg["resend_if_better_by_pct"])
    if not args.once:
        log(f"Старт: {', '.join(cfg['exchanges'])} | {', '.join(cfg['fiats'])} | "
            f"каждые {cfg['interval_sec']} с | Telegram {'вкл' if tg_on else 'выкл'}")

    while True:
        try:
            book, opps, nbg = scan(cfg)
            print_book(book, nbg)
            hits = [o for o in opps if o.profit_pct >= th[o.kind]]
            shown = opps if args.all else hits
            print()
            if shown:
                for o in shown[:15]:
                    print(strip_html(o.text) + "\n")
            else:
                top = opps[0] if opps else None
                log("Выгодных окон нет" + (f" (лучшее: {top.kind} {top.profit_pct:+.2f}%)" if top else ""))
            if tg_on:
                for o in hits:
                    if dedup.should_send(o):
                        tg_send(cfg, o.text + "\n\n⚠️ Проверь продавца и чек перед сделкой.")
        except KeyboardInterrupt:
            raise
        except Exception as e:
            log(f"Ошибка цикла: {e}")
        if args.once:
            break
        time.sleep(cfg["interval_sec"])


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nОстановлено.")
        sys.exit(0)
