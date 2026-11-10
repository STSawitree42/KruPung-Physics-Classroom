/* =========================================================
   Content helpers: validation, defaults, public views (no answers)
   ========================================================= */
import type { ContentBundle, Effect, QuestionCard, SituationCard, SpecialCard, WaveType, PublicCard, Verdict } from './types';

export const WAVE_TYPE_SET: WaveType[] = ['mechanical', 'electromagnetic', 'transverse', 'longitudinal'];

const str = (v: unknown, max: number) => typeof v === 'string' ? v.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').trim().slice(0, max) : '';
const isId = (v: unknown) => typeof v === 'string' && /^[A-Za-z0-9_-]{1,40}$/.test(v);
const img = (v: unknown) => { const s = str(v, 300); return /^(\/assets\/|https:\/\/)[^\s"'<>]*$/.test(s) ? s : undefined; };

export function validateQuestion(raw: unknown): { ok: true; value: QuestionCard } | { ok: false; error: string } {
  const q = (raw || {}) as Record<string, unknown>;
  if (!isId(q.id)) return { ok: false, error: 'รหัสคำถามไม่ถูกต้อง (ใช้ a-z 0-9 - _)' };
  const text = str(q.text, 1000); if (!text) return { ok: false, error: `${q.id}: ไม่มีโจทย์` };
  const choices = Array.isArray(q.choices) ? q.choices.map(c => str(c, 300)) : [];
  if (choices.length !== 4 || choices.some(c => !c)) return { ok: false, error: `${q.id}: ต้องมีตัวเลือก 4 ข้อที่ไม่ว่าง` };
  if (new Set(choices).size !== 4) return { ok: false, error: `${q.id}: ตัวเลือกซ้ำกัน` };
  const answer = Number(q.answer);
  if (!Number.isInteger(answer) || answer < 0 || answer > 3) return { ok: false, error: `${q.id}: คำตอบต้องเป็น 0–3` };
  const difficulty = (['easy', 'medium', 'hard'] as const).find(d => d === q.difficulty) || 'medium';
  const points = Math.max(0, Math.min(100, Math.round(Number(q.points ?? 3)) || 0));
  return { ok: true, value: { id: q.id as string, kind: 'question', category: str(q.category, 80) || 'ทั่วไป', difficulty, text, image: img(q.image), choices, answer, explanation: str(q.explanation, 1500), points, enabled: q.enabled !== false } };
}

export function validateSituation(raw: unknown): { ok: true; value: SituationCard } | { ok: false; error: string } {
  const s = (raw || {}) as Record<string, unknown>;
  if (!isId(s.id)) return { ok: false, error: 'รหัสการ์ดไม่ถูกต้อง' };
  const text = str(s.text, 600); const title = str(s.title, 120);
  if (!text || !title) return { ok: false, error: `${s.id}: ต้องมีชื่อและข้อความสถานการณ์` };
  const answers = Array.isArray(s.answers) ? s.answers.map(a => Array.isArray(a) ? [...new Set(a.filter((t): t is WaveType => WAVE_TYPE_SET.includes(t as WaveType)))] : []).filter(a => a.length) : [];
  if (!answers.length) return { ok: false, error: `${s.id}: ต้องมีชุดคำตอบอย่างน้อย 1 ชุด` };
  const points = Math.max(0, Math.min(100, Math.round(Number(s.points ?? 2)) || 0));
  return { ok: true, value: { id: s.id as string, kind: 'situation', title, text, points, image: img(s.image), answers, explanation: str(s.explanation, 1500), note: str(s.note, 600) || undefined, enabled: s.enabled !== false } };
}

export function validateEffect(e: unknown, depth = 0): e is Effect {
  if (!e || typeof e !== 'object' || depth > 3) return false;
  const x = e as Record<string, unknown>;
  const num = (v: unknown, lo: number, hi: number) => typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi;
  switch (x.op) {
    case 'score': return num(x.amount, -100, 100);
    case 'move': return num(x.steps, -20, 20) && Number.isInteger(x.steps);
    case 'skipTurn': return num(x.turns, 1, 5);
    case 'extraRoll': case 'diceParity': case 'echo': case 'sameColor': case 'forceNextOpponentWrong': return true;
    case 'nextAnswerMultiplier': return num(x.factor, 1, 5);
    case 'transferToNext': return num(x.amount, 1, 100);
    case 'teamworkNextSituation': return num(x.penaltyMultiplier, 1, 5);
    case 'goodDeed': return num(x.reward, 0, 100);
    case 'combo': return Array.isArray(x.effects) && x.effects.length > 0 && x.effects.length <= 4 && x.effects.every(f => validateEffect(f, depth + 1) && (f as Effect).op !== 'choice');
    case 'choice': return Array.isArray(x.options) && x.options.length >= 2 && x.options.length <= 4 &&
      x.options.every(o => o && typeof o === 'object' && str((o as Record<string, unknown>).label, 120) && validateEffect((o as Record<string, unknown>).effect, depth + 1) && ((o as { effect: Effect }).effect.op !== 'choice'));
    default: return false;
  }
}

export function validateSpecial(raw: unknown): { ok: true; value: SpecialCard } | { ok: false; error: string } {
  const s = (raw || {}) as Record<string, unknown>;
  if (!isId(s.id)) return { ok: false, error: 'รหัสการ์ดไม่ถูกต้อง' };
  const title = str(s.title, 120), text = str(s.text, 600);
  if (!title || !text) return { ok: false, error: `${s.id}: ต้องมีชื่อและข้อความ` };
  const type = (['REWARD', 'PENALTY', 'SITUATION', 'GOOD_DEED'] as const).find(t => t === s.type) || 'SITUATION';
  if (!validateEffect(s.effect)) return { ok: false, error: `${s.id}: ผลของการ์ดไม่ถูกต้อง` };
  const effect = structuredClone(s.effect) as Effect;
  if (effect.op === 'choice') effect.options.forEach(o => { o.label = str(o.label, 120); });
  return { ok: true, value: { id: s.id as string, kind: 'special', type, title, text, image: img(s.image), effect, enabled: s.enabled !== false } };
}

/** ตรวจและทำความสะอาดคลังทั้งหมด (ใช้ตอนสร้างห้อง) — การ์ดที่ไม่ถูกต้องจะถูกตัดออก */
export function sanitizeContent(input: Partial<ContentBundle> | null | undefined): { content: ContentBundle; errors: string[] } {
  const errors: string[] = [];
  const out: ContentBundle = { situation: {}, question: {}, special: {} };
  const take = <T>(src: Record<string, unknown> | undefined, fn: (r: unknown) => { ok: true; value: T } | { ok: false; error: string }, dest: Record<string, T>) => {
    Object.values(src || {}).forEach(r => { const v = fn(r); if (v.ok) dest[(v.value as unknown as { id: string }).id] = v.value; else errors.push(v.error); });
  };
  take(input?.situation as Record<string, unknown>, validateSituation, out.situation);
  take(input?.question as Record<string, unknown>, validateQuestion, out.question);
  take(input?.special as Record<string, unknown>, validateSpecial, out.special);
  return { content: out, errors };
}

/* ---------------- Grading ---------------- */
export function gradeSituation(selection: WaveType[], answers: WaveType[][]): Verdict {
  const sel = [...new Set(selection)].filter(t => WAVE_TYPE_SET.includes(t));
  if (!sel.length) return 'wrong';
  let best: Verdict = 'wrong';
  for (const alt of answers) {
    if (sel.every(t => alt.includes(t))) {
      if (sel.length === alt.length) return 'full';
      best = 'partial';
    }
  }
  return best;
}

/* ---------------- Public (answer-free) card views ---------------- */
export function publicWaveCard(card: SituationCard | QuestionCard, teamwork = false): PublicCard {
  if (card.kind === 'situation') return { id: card.id, deck: 'wave', kind: 'situation', title: card.title, text: card.text, image: card.image, points: card.points, teamwork: teamwork || undefined };
  return { id: card.id, deck: 'wave', kind: 'question', title: card.category, text: card.text, image: card.image, points: card.points, choices: [...card.choices], teamwork: teamwork || undefined };
}
export function publicSpecialCard(card: SpecialCard, options?: string[]): PublicCard {
  return { id: card.id, deck: 'special', kind: 'special', title: card.title, text: card.text, image: card.image, specialType: card.type, options };
}
