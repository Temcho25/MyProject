// Generative ambience + small sound design, all synthesized with Web Audio.
// `createEngine` works on any context (live or offline), so the promo video
// can render the exact same score; `createSound` is the live, opt-in player.

export const CHORD_LEN = 7.5;
// slow loop — Am9 · Fmaj7 · C(add9) · G6
const CHORDS = [
  [57, 60, 64, 67, 71],
  [53, 57, 60, 64, 69],
  [48, 55, 60, 62, 64],
  [55, 59, 62, 64, 67],
];
const hz = m => 440 * Math.pow(2, (m - 69) / 12);

export function createEngine(ctx, destination) {
  const master = ctx.createGain(); master.gain.value = 0.9;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -18; comp.ratio.value = 3;
  master.connect(comp).connect(destination);

  // simple stereo echo as the room
  const delayL = ctx.createDelay(1), delayR = ctx.createDelay(1);
  delayL.delayTime.value = 0.37; delayR.delayTime.value = 0.53;
  const fb = ctx.createGain(); fb.gain.value = 0.32;
  const wet = ctx.createGain(); wet.gain.value = 0.35;
  const merger = ctx.createChannelMerger(2);
  delayL.connect(fb); delayR.connect(fb); fb.connect(delayL); fb.connect(delayR);
  delayL.connect(merger, 0, 0); delayR.connect(merger, 0, 1);
  merger.connect(wet).connect(master);

  const musicBus = ctx.createGain(); musicBus.gain.value = 0.9;
  const sfxBus = ctx.createGain(); sfxBus.gain.value = 0.8;
  musicBus.connect(master); musicBus.connect(delayL);
  sfxBus.connect(master); sfxBus.connect(delayR);

  function noise(dur) {
    const b = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const s = ctx.createBufferSource(); s.buffer = b; return s;
  }

  function bell(f, t, vol) {
    const o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = f;
    o2.type = 'sine'; o2.frequency.value = f * 2.01;
    const g2 = ctx.createGain(); g2.gain.value = 0.3;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 3.5);
    o.connect(g); o2.connect(g2).connect(g); g.connect(musicBus);
    o.start(t); o2.start(t); o.stop(t + 3.6); o2.stop(t + 3.6);
  }

  function pad(index, t, dur = CHORD_LEN) {
    const notes = CHORDS[index % CHORDS.length];
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.Q.value = 0.6;
    lp.frequency.setValueAtTime(500, t);
    lp.frequency.linearRampToValueAtTime(1300, t + dur * 0.5);
    lp.frequency.linearRampToValueAtTime(600, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.07, t + 2.2);
    g.gain.setValueAtTime(0.07, t + dur - 2.4);
    g.gain.linearRampToValueAtTime(0, t + dur + 0.6);
    lp.connect(g).connect(musicBus);
    notes.forEach((n, i) => {
      [-6, 6].forEach(det => {
        const o = ctx.createOscillator();
        o.type = i === 0 ? 'triangle' : 'sawtooth';
        o.frequency.value = hz(n - (i === 0 ? 12 : 0));
        o.detune.value = det + (Math.random() - 0.5) * 4;
        const og = ctx.createGain(); og.gain.value = i === 0 ? 0.5 : 0.16;
        o.connect(og).connect(lp);
        o.start(t); o.stop(t + dur + 0.8);
      });
    });
    bell(hz(notes[notes.length - 1] + 12), t + 0.05, 0.05);
  }

  // a slab settling: low body + dusty transient
  function thud(t, v = 1) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(110, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.35);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.55 * v, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
    o.connect(g).connect(sfxBus); o.start(t); o.stop(t + 0.65);
    const n = noise(0.25), lp = ctx.createBiquadFilter(), ng = ctx.createGain();
    lp.type = 'lowpass'; lp.frequency.value = 900;
    ng.gain.setValueAtTime(0.18 * v, t); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    n.connect(lp).connect(ng).connect(sfxBus); n.start(t);
  }

  function tick(t) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'triangle'; o.frequency.setValueAtTime(1800, t); o.frequency.exponentialRampToValueAtTime(900, t + 0.04);
    g.gain.setValueAtTime(0.08, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    o.connect(g).connect(sfxBus); o.start(t); o.stop(t + 0.07);
  }

  function whoosh(t, len = 0.9) {
    const n = noise(len), bp = ctx.createBiquadFilter(), g = ctx.createGain();
    bp.type = 'bandpass'; bp.Q.value = 1.4;
    bp.frequency.setValueAtTime(300, t); bp.frequency.exponentialRampToValueAtTime(2400, t + len * 0.7);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.16, t + len * 0.45); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    n.connect(bp).connect(g).connect(sfxBus); n.start(t);
  }

  return { master, pad, bell, thud, tick, whoosh };
}

// Live player: silent until the visitor presses the sound button.
export function createSound() {
  let ctx = null, out = null, eng = null, on = false, started = false, timer = null;
  let next = 0, idx = 0;

  function init() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    out = ctx.createGain(); out.gain.value = 0;
    out.connect(ctx.destination);
    eng = createEngine(ctx, out);
  }
  function schedule() {
    while (next < ctx.currentTime + 2) { eng.pad(idx++, next); next += CHORD_LEN; }
  }

  const sfx = {
    thud(v = 1) { if (on) eng.thud(ctx.currentTime, v); },
    tick() { if (on) eng.tick(ctx.currentTime); },
    whoosh(len = 0.9) { if (on) eng.whoosh(ctx.currentTime, len); },
  };

  function toggle() {
    if (!ctx) init();
    on = !on;
    const now = ctx.currentTime;
    out.gain.cancelScheduledValues(now);
    out.gain.setValueAtTime(out.gain.value, now);
    if (on) {
      ctx.resume();
      if (!started) { started = true; next = now + 0.1; schedule(); timer = setInterval(schedule, 500); }
      out.gain.linearRampToValueAtTime(1, now + 1.2);
      eng.whoosh(now, 1.1);
    } else {
      out.gain.linearRampToValueAtTime(0, now + 0.5);
    }
    return on;
  }

  document.addEventListener('visibilitychange', () => {
    if (!ctx || !on) return;
    if (document.hidden) ctx.suspend(); else ctx.resume();
  });

  return { toggle, sfx, get on() { return on; } };
}
