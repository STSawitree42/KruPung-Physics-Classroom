/* =========================================================
   Audio: synthesized sound effects + tone generator for labs
   ========================================================= */
(function (SQ) {
  'use strict';
  let ctx = null;
  const A = SQ.audio = {};

  A.ctx = function () {
    if (!ctx) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; ctx = new C(); }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  };
  A.enabled = () => SQ.store.settings().sfx !== false;

  function beep(freqs, step, type, vol) {
    if (!A.enabled()) return; const c = A.ctx(); if (!c) return;
    freqs.forEach((f, i) => {
      const o = c.createOscillator(), g = c.createGain(), t = c.currentTime + i * step;
      o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + step * 1.6);
      o.connect(g).connect(c.destination); o.start(t); o.stop(t + step * 1.7);
    });
  }
  /* Sound effects (respect the on/off toggle) */
  SQ.sfx = {
    click: () => beep([700], 0.04, 'square', 0.04),
    select: () => beep([520, 780], 0.05, 'triangle', 0.08),
    correct: () => beep([660, 880, 1320], 0.08, 'triangle', 0.16),
    wrong: () => beep([240, 170], 0.16, 'sawtooth', 0.07),
    hint: () => beep([990, 740], 0.07, 'sine', 0.1),
    unlock: () => beep([392, 523, 659, 784, 1046], 0.09, 'triangle', 0.14),
    level: () => beep([523, 659, 784, 1046, 1318, 1568], 0.1, 'triangle', 0.15),
    badge: () => beep([880, 1175, 1568], 0.1, 'sine', 0.14)
  };

  /* Lab tone generator — used by missions. Plays even when SFX is muted,
     because hearing the tone is part of the experiment (user starts it). */
  A.tones = function (freqs, opts) {
    opts = opts || {};
    const c = A.ctx(); if (!c) return { set() {}, stop() {} };
    const master = c.createGain(); master.gain.value = opts.volume != null ? opts.volume : 0.18; master.connect(c.destination);
    const t = c.currentTime;
    const oscs = freqs.map((f, i) => {
      const o = c.createOscillator(), g = c.createGain();
      o.type = opts.type || 'sine'; o.frequency.value = f;
      const amp = opts.amps ? opts.amps[i] : 1;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(amp, t + 0.04);
      o.connect(g).connect(master); o.start(t); return { o, g };
    });
    let stopped = false, timer = null;
    const h = {
      set(newFreqs, amps) {
        if (stopped) return;
        newFreqs.forEach((f, i) => oscs[i] && oscs[i].o.frequency.setTargetAtTime(f, c.currentTime, 0.02));
        if (amps) amps.forEach((a, i) => oscs[i] && oscs[i].g.gain.setTargetAtTime(a, c.currentTime, 0.02));
      },
      stop() {
        if (stopped) return; stopped = true; clearTimeout(timer);
        const n = c.currentTime;
        master.gain.setTargetAtTime(0, n, 0.03);
        oscs.forEach(x => { try { x.o.stop(n + 0.2); } catch (e) {} });
        setTimeout(() => { try { master.disconnect(); } catch (e) {} }, 400);
        opts.onend && opts.onend();
      },
      get stopped() { return stopped; }
    };
    if (opts.duration) timer = setTimeout(() => h.stop(), opts.duration * 1000);
    return h;
  };
})(window.SQ);
