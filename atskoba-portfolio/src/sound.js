// Generated sound: a slow ambient pad, soft ticks for hovers and a filtered whoosh for
// scene changes. Nothing plays until the visitor turns sound on (browsers block autoplay).
let ctx = null, master = null, padGain = null, on = false;

function noiseBuffer(c) {
  const b = c.createBuffer(1, c.sampleRate * 1.5, c.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return b;
}
let noise = null;

function buildPad() {
  padGain = ctx.createGain();
  padGain.gain.value = 0;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.value = 700; lp.Q.value = 0.6;
  const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07;
  const lfoAmt = ctx.createGain(); lfoAmt.gain.value = 380;
  lfo.connect(lfoAmt).connect(lp.frequency); lfo.start();
  // A-minor-ish open chord, slightly detuned pairs for width.
  [110, 164.81, 220, 261.63, 329.63].forEach((f, i) => {
    for (const det of [-6, 6]) {
      const o = ctx.createOscillator();
      o.type = i < 2 ? 'sawtooth' : 'triangle';
      o.frequency.value = f; o.detune.value = det;
      const g = ctx.createGain(); g.gain.value = i < 2 ? 0.025 : 0.035;
      const pan = ctx.createStereoPanner(); pan.pan.value = det > 0 ? 0.4 : -0.4;
      o.connect(g).connect(pan).connect(lp); o.start();
    }
  });
  lp.connect(padGain).connect(master);
}

export function toggleSound() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0.8; master.connect(ctx.destination);
    noise = noiseBuffer(ctx);
    buildPad();
  }
  on = !on;
  if (on) ctx.resume();
  const t = ctx.currentTime;
  padGain.gain.cancelScheduledValues(t);
  padGain.gain.setTargetAtTime(on ? 0.55 : 0, t, on ? 1.2 : 0.25);
  if (on) whoosh(0.6);
  return on;
}

export function tick(pitch = 1) {
  if (!on) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator(); o.type = 'sine';
  o.frequency.setValueAtTime(1800 * pitch, t);
  o.frequency.exponentialRampToValueAtTime(900 * pitch, t + 0.05);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.06, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
  o.connect(g).connect(master); o.start(t); o.stop(t + 0.1);
}

export function whoosh(strength = 1) {
  if (!on) return;
  const t = ctx.currentTime;
  const s = ctx.createBufferSource(); s.buffer = noise;
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.4;
  bp.frequency.setValueAtTime(300, t);
  bp.frequency.exponentialRampToValueAtTime(2600, t + 0.45);
  bp.frequency.exponentialRampToValueAtTime(500, t + 0.9);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.16 * strength, t + 0.35);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.95);
  s.connect(bp).connect(g).connect(master); s.start(t); s.stop(t + 1);
  // A low "thud" so scene changes land on a beat.
  const o = ctx.createOscillator(); o.type = 'sine';
  o.frequency.setValueAtTime(90, t + 0.33); o.frequency.exponentialRampToValueAtTime(42, t + 0.7);
  const og = ctx.createGain();
  og.gain.setValueAtTime(0.0001, t + 0.33);
  og.gain.exponentialRampToValueAtTime(0.22 * strength, t + 0.35);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
  o.connect(og).connect(master); o.start(t + 0.3); o.stop(t + 0.85);
}
