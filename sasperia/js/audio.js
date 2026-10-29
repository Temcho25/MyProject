/* Ambient sound for the site: the river (filtered noise), a low drone on D, and a soft pluck
   when a chapter opens. Off until the guest presses the sound button. The same graph can be
   rendered offline (OfflineAudioContext) for the promo video. */
(function () {
  const NOTES = [293.66, 329.63, 369.99, 440.0, 493.88, 587.33]; // D E F# A B D'

  function impulse(ctx, seconds, decay) {
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }

  function brownNoise(ctx, seconds) {
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      let last = 0;
      for (let i = 0; i < len; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.2; }
      // short crossfade so the loop has no click
      const f = Math.floor(ctx.sampleRate * 0.05);
      for (let i = 0; i < f; i++) { const k = i / f; d[i] = d[i] * k + d[len - f + i] * (1 - k); }
    }
    return buf;
  }

  // Builds the full graph on any BaseAudioContext. Returns { master, pluck(time, noteIndex, vel) }.
  function build(ctx, dest) {
    const master = ctx.createGain(); master.gain.value = 0; master.connect(dest);
    const verb = ctx.createConvolver(); verb.buffer = impulse(ctx, 3.2, 2.6);
    const verbGain = ctx.createGain(); verbGain.gain.value = 0.55; verb.connect(verbGain).connect(master);
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 3; comp.connect(master);

    // River
    const river = ctx.createBufferSource(); river.buffer = brownNoise(ctx, 6); river.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 520; bp.Q.value = 0.6;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1600;
    const rg = ctx.createGain(); rg.gain.value = 0.32;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07;
    const lfoG = ctx.createGain(); lfoG.gain.value = 220; lfo.connect(lfoG).connect(bp.frequency);
    river.connect(bp).connect(lp).connect(rg).connect(comp);
    rg.connect(verb);

    // Drone on D with a slow filter swell
    const droneF = ctx.createBiquadFilter(); droneF.type = 'lowpass'; droneF.frequency.value = 700; droneF.Q.value = 0.4;
    const dLfo = ctx.createOscillator(); dLfo.frequency.value = 0.045;
    const dLfoG = ctx.createGain(); dLfoG.gain.value = 260; dLfo.connect(dLfoG).connect(droneF.frequency);
    const droneG = ctx.createGain(); droneG.gain.value = 0.11;
    droneF.connect(droneG).connect(comp); droneG.connect(verb);
    const voices = [[73.42, 'sine', 0.55], [110.0, 'triangle', 0.22], [146.83, 'sine', 0.3], [146.83 * 1.003, 'sine', 0.2], [220.0, 'sine', 0.08]];
    const oscs = voices.map(([f, type, g]) => {
      const o = ctx.createOscillator(); o.type = type; o.frequency.value = f;
      const og = ctx.createGain(); og.gain.value = g; o.connect(og).connect(droneF); return o;
    });

    const t0 = ctx.currentTime;
    [river, lfo, dLfo, ...oscs].forEach((n) => n.start(t0));

    function pluck(time, idx, vel) {
      const f = NOTES[(idx ?? Math.floor(Math.random() * NOTES.length)) % NOTES.length];
      const v = vel ?? 0.5;
      const g = ctx.createGain(); g.gain.setValueAtTime(0, time);
      g.gain.linearRampToValueAtTime(0.22 * v, time + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0008, time + 2.4);
      const tone = ctx.createBiquadFilter(); tone.type = 'lowpass';
      tone.frequency.setValueAtTime(3800, time); tone.frequency.exponentialRampToValueAtTime(600, time + 1.2);
      [[1, 'triangle', 1], [2, 'sine', 0.35], [3, 'sine', 0.12]].forEach(([m, type, a]) => {
        const o = ctx.createOscillator(); o.type = type; o.frequency.value = f * m;
        const og = ctx.createGain(); og.gain.value = a; o.connect(og).connect(tone);
        o.start(time); o.stop(time + 2.6);
      });
      tone.connect(g); g.connect(comp); g.connect(verb);
    }
    return { master, pluck };
  }

  let ctx = null, graph = null, on = false, lastPluck = 0;
  const api = {
    get on() { return on; },
    async toggle() {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return false;
        ctx = new AC();
        graph = build(ctx, ctx.destination);
      }
      on = !on;
      if (on) await ctx.resume();
      const now = ctx.currentTime;
      graph.master.gain.cancelScheduledValues(now);
      graph.master.gain.setValueAtTime(graph.master.gain.value, now);
      graph.master.gain.linearRampToValueAtTime(on ? 0.9 : 0, now + (on ? 2.2 : 0.6));
      if (on) graph.pluck(now + 0.15, 3, 0.6);
      return on;
    },
    pluck(idx) {
      if (!on || !ctx) return;
      const now = ctx.currentTime;
      if (now - lastPluck < 0.35) return;
      lastPluck = now;
      graph.pluck(now + 0.01, idx, 0.55);
    },
    // Offline render for video: events = [{t, idx, vel}], returns AudioBuffer.
    async renderOffline(seconds, events, sampleRate = 48000) {
      const off = new OfflineAudioContext(2, Math.ceil(seconds * sampleRate), sampleRate);
      const g = build(off, off.destination);
      g.master.gain.setValueAtTime(0, 0);
      g.master.gain.linearRampToValueAtTime(0.9, 2.0);
      g.master.gain.setValueAtTime(0.9, Math.max(2.1, seconds - 2.5));
      g.master.gain.linearRampToValueAtTime(0, seconds - 0.05);
      events.forEach((e) => g.pluck(e.t, e.idx, e.vel));
      return off.startRendering();
    },
  };
  window.SasperiaAudio = api;
})();
