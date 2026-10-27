// Звук сайта (Web Audio, без файлов): тёмный эмбиент-грув 84 BPM + шум прокрутки + акценты.
// Включается только по кнопке.
export function createSound() {
  let ctx = null, master, bus, noiseBuf, scrollG, scrollF, on = false, timer = null;
  let nextBeat = 0, beat = 0;
  const BPM = 84, SPB = 60 / BPM;
  const CHORDS = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]];   // Am F C G
  const ARP = [0, 1, 2, 1, 2, 0, 1, 2];
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);

  function init() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 4;
    master.connect(comp).connect(ctx.destination);
    // простая «комната»: задержка с обратной связью
    bus = ctx.createGain(); bus.gain.value = 1; bus.connect(master);
    const dl = ctx.createDelay(1); dl.delayTime.value = SPB * 0.75; const fb = ctx.createGain(); fb.gain.value = 0.32;
    const dlf = ctx.createBiquadFilter(); dlf.type = 'lowpass'; dlf.frequency.value = 2200;
    const send = ctx.createGain(); send.gain.value = 0.28; bus.connect(send).connect(dl).connect(dlf).connect(fb).connect(dl); dlf.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    // пэд
    const padF = ctx.createBiquadFilter(); padF.type = 'lowpass'; padF.frequency.value = 520; padF.Q.value = 0.7;
    const padG = ctx.createGain(); padG.gain.value = 0.05; padF.connect(padG).connect(bus);
    [45, 52, 57.07, 44.95].forEach(m => { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = hz(m); o.connect(padF); o.start(); });
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07; const lg = ctx.createGain(); lg.gain.value = 260; lfo.connect(lg).connect(padF.frequency); lfo.start();
    // шум прокрутки
    const n = ctx.createBufferSource(); n.buffer = noiseBuf; n.loop = true;
    scrollF = ctx.createBiquadFilter(); scrollF.type = 'bandpass'; scrollF.frequency.value = 800; scrollF.Q.value = 0.9;
    scrollG = ctx.createGain(); scrollG.gain.value = 0; n.connect(scrollF).connect(scrollG).connect(bus); n.start();
    nextBeat = ctx.currentTime + 0.1;
  }

  function kick(t, v = 1) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.18);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.55 * v, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
    o.connect(g).connect(master); o.start(t); o.stop(t + 0.5);
  }
  function hat(t, v = 1) {
    const s = ctx.createBufferSource(); s.buffer = noiseBuf; const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 7000;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.06 * v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    s.connect(f).connect(g).connect(bus); s.start(t, Math.random()); s.stop(t + 0.08);
  }
  function pluck(t, m, v = 1, dur = 0.5) {
    const o = ctx.createOscillator(), o2 = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = 'triangle'; o2.type = 'sine'; o.frequency.value = hz(m); o2.frequency.value = hz(m + 12);
    f.type = 'lowpass'; f.frequency.setValueAtTime(3200, t); f.frequency.exponentialRampToValueAtTime(500, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.09 * v, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(f); o2.connect(f); f.connect(g).connect(bus); o.start(t); o2.start(t); o.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
  }
  function bass(t, m) {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = hz(m - 24);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.22, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + SPB * 1.8);
    o.connect(g).connect(master); o.start(t); o.stop(t + SPB * 2);
  }

  function schedule() {
    while (nextBeat < ctx.currentTime + 0.15) {
      const bar = Math.floor(beat / 4) % 4, b = beat % 4, ch = CHORDS[bar], t = nextBeat;
      if (b === 0 || b === 2) kick(t, b === 0 ? 1 : 0.7);
      if (b === 0) bass(t, ch[0]);
      hat(t + SPB / 2, 0.8);
      [0, 1].forEach(h => { const step = (b * 2 + h); const note = ch[ARP[step]] + 12; if (step % 3 !== 2) pluck(t + h * SPB / 2, note, 0.6 + (step === 0 ? 0.4 : 0), 0.45); });
      nextBeat += SPB; beat++;
    }
  }

  return {
    toggle() {
      if (!ctx) init();
      on = !on;
      if (on) { ctx.resume(); master.gain.setTargetAtTime(0.9, ctx.currentTime, 0.4); timer = setInterval(schedule, 25); }
      else { master.gain.setTargetAtTime(0, ctx.currentTime, 0.2); clearInterval(timer); setTimeout(() => !on && ctx.suspend(), 900); }
      return on;
    },
    update(vel) {
      if (!on) return;
      const v = Math.min(1, Math.abs(vel) / 3000);
      scrollG.gain.setTargetAtTime(v * 0.18, ctx.currentTime, 0.08);
      scrollF.frequency.setTargetAtTime(500 + v * 2500, ctx.currentTime, 0.1);
    },
    whoosh() {
      if (!on) return; const t = ctx.currentTime;
      const s = ctx.createBufferSource(); s.buffer = noiseBuf; const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.4;
      f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(3800, t + 0.45);
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.25, t + 0.2); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
      s.connect(f).connect(g).connect(bus); s.start(t); s.stop(t + 0.8);
    },
    blip(i) {
      if (!on) return; const t = ctx.currentTime;
      [69, 72, 76, 79, 81].slice(0, 3).forEach((m, j) => pluck(t + j * 0.06, m + [0, 2, -3, 5, 7][i % 5], 1.1, 0.7));
    },
  };
}
