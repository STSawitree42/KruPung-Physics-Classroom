/* Sound effects — สังเคราะห์ด้วย Web Audio (ไม่ต้องโหลดไฟล์เสียง) */
let ctx: AudioContext | null = null;
const PREF = 'wao.prefs';

export interface Prefs { sound: boolean; reduceMotion: boolean; }
export function getPrefs(): Prefs {
  try { return { sound: true, reduceMotion: false, ...JSON.parse(localStorage.getItem(PREF) || '{}') }; } catch { return { sound: true, reduceMotion: false }; }
}
export function setPrefs(p: Partial<Prefs>) {
  const next = { ...getPrefs(), ...p };
  try { localStorage.setItem(PREF, JSON.stringify(next)); } catch { /* ignore */ }
  document.documentElement.classList.toggle('reduce-motion', next.reduceMotion);
  return next;
}

function ac() {
  if (!ctx) { const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext; if (!C) return null; ctx = new C(); }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}
function tone(freqs: number[], step: number, type: OscillatorType, vol: number) {
  if (!getPrefs().sound) return;
  const c = ac(); if (!c) return;
  freqs.forEach((f, i) => {
    const o = c.createOscillator(), g = c.createGain(), t = c.currentTime + i * step;
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + step * 1.6);
    o.connect(g).connect(c.destination); o.start(t); o.stop(t + step * 1.7);
  });
}
function noise(dur: number, vol: number) {
  if (!getPrefs().sound) return;
  const c = ac(); if (!c) return;
  const b = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2);
  const s = c.createBufferSource(), g = c.createGain(), f = c.createBiquadFilter();
  f.type = 'bandpass'; f.frequency.value = 1800; g.gain.value = vol;
  s.buffer = b; s.connect(f).connect(g).connect(c.destination); s.start();
}

export const sfx = {
  click: () => tone([720], 0.04, 'square', 0.035),
  dice: () => { for (let i = 0; i < 5; i++) setTimeout(() => noise(0.05, 0.25), i * 90); },
  step: () => tone([520], 0.05, 'triangle', 0.05),
  flip: () => tone([400, 900], 0.06, 'sine', 0.08),
  correct: () => tone([660, 880, 1320], 0.09, 'triangle', 0.15),
  partial: () => tone([660, 880], 0.09, 'triangle', 0.12),
  wrong: () => tone([260, 180], 0.16, 'sawtooth', 0.06),
  turn: () => tone([880, 1175], 0.08, 'sine', 0.09),
  special: () => tone([523, 784, 1046, 784], 0.07, 'square', 0.05),
  victory: () => tone([523, 659, 784, 1046, 1318, 1568], 0.12, 'triangle', 0.15),
  tick: () => tone([1400], 0.03, 'square', 0.03)
};
