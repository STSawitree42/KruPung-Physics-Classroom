/* Teacher content management — เขียนตรงไปที่ /content (Security Rules อนุญาตเฉพาะครู) */
import { get, ref, remove, set, update } from 'firebase/database';
import { fb } from '../config/firebase';
import { validateQuestion, validateSituation, validateSpecial } from '@shared/content';
import type { BoardConfig, ContentBundle, GameSettings, QuestionCard, SituationCard, SpecialCard } from '@shared/types';
import { sanitizeSettings } from '@shared/rules.config';

const clean = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

export async function loadContent(): Promise<{ content: ContentBundle; seeded: boolean }> {
  const s = await get(ref(fb().db, 'content'));
  const v = (s.val() || {}) as Partial<ContentBundle>;
  const content = { situation: v.situation || {}, question: v.question || {}, special: v.special || {} };
  return { content, seeded: !!(Object.keys(content.situation).length || Object.keys(content.question).length || Object.keys(content.special).length) };
}

/** นำเข้าชุดเริ่มต้น (ไฟล์ setup/wave-content.json: การ์ดต้นฉบับ + คำถาม 50 ข้อ พร้อมเฉลย)
 *  เฉลยไม่ได้ฝังอยู่ในแอป ครูนำเข้าจากไฟล์เองครั้งเดียว · ไม่เขียนทับรายการที่มีอยู่แล้ว เว้นแต่ overwrite */
export async function importContentBundle(raw: unknown, overwrite = false): Promise<{ added: number; errors: string[] }> {
  const src = (raw && typeof raw === 'object' ? raw : {}) as Partial<Record<keyof ContentBundle, Record<string, unknown>>>;
  const cur = (await loadContent()).content;
  const up: Record<string, unknown> = {}; const errors: string[] = [];
  const check = { question: validateQuestion, situation: validateSituation, special: validateSpecial } as const;
  (['situation', 'question', 'special'] as const).forEach(k => Object.entries(src[k] || {}).forEach(([id, c]) => {
    const v = check[k](c);
    if (!v.ok) { errors.push(`${k}/${id}: ${v.error}`); return; }
    if (!overwrite && cur[k][v.value.id]) return;
    up[`content/${k}/${v.value.id}`] = clean(v.value);
  }));
  if (!Object.keys(up).length && !errors.length && !Object.keys(src).some(k => ['situation', 'question', 'special'].includes(k))) errors.push('ไฟล์ไม่ใช่ชุดการ์ดของ WAVE ADVENTURE');
  if (Object.keys(up).length) await update(ref(fb().db), up);
  return { added: Object.keys(up).length, errors };
}

export async function saveQuestion(raw: unknown) { const v = validateQuestion(raw); if (!v.ok) throw new Error(v.error); await set(ref(fb().db, `content/question/${v.value.id}`), clean(v.value)); return v.value; }
export async function saveSituation(raw: unknown) { const v = validateSituation(raw); if (!v.ok) throw new Error(v.error); await set(ref(fb().db, `content/situation/${v.value.id}`), clean(v.value)); return v.value; }
export async function saveSpecial(raw: unknown) { const v = validateSpecial(raw); if (!v.ok) throw new Error(v.error); await set(ref(fb().db, `content/special/${v.value.id}`), clean(v.value)); return v.value; }
export async function deleteCard(kind: keyof ContentBundle, id: string) { await remove(ref(fb().db, `content/${kind}/${id}`)); }

/** นำเข้าคำถามหลายข้อ (ตรวจทุกข้อก่อนบันทึก) */
export async function importQuestions(list: unknown[]): Promise<{ saved: number; errors: string[] }> {
  const up: Record<string, unknown> = {}; const errors: string[] = [];
  list.forEach((r, i) => { const v = validateQuestion(r); if (v.ok) up[`content/question/${v.value.id}`] = clean(v.value); else errors.push(`แถว ${i + 1}: ${v.error}`); });
  if (Object.keys(up).length) await update(ref(fb().db), up);
  return { saved: Object.keys(up).length, errors };
}

export async function loadDefaultSettings(): Promise<GameSettings | null> {
  try { const s = await get(ref(fb().db, 'content/defaults/settings')); return s.exists() ? sanitizeSettings(s.val()) : null; } catch { return null; }
}
export async function saveDefaultSettings(s: GameSettings) { await set(ref(fb().db, 'content/defaults/settings'), sanitizeSettings(s)); }

export async function loadBoard(): Promise<BoardConfig | null> { const s = await get(ref(fb().db, 'config/board')); return s.exists() ? (s.val() as BoardConfig) : null; }
export async function saveBoard(b: BoardConfig) {
  const cells = b.cells.map(c => { const o: Record<string, unknown> = { index: c.index, type: c.type }; if (c.x != null) o.x = c.x; if (c.y != null) o.y = c.y; if (c.color) o.color = c.color; return o; });
  await set(ref(fb().db, 'config/board'), { id: b.id, name: b.name, image: b.image, aspect: b.aspect, cells, updatedAt: Date.now() });
}
export async function resetBoard() { await remove(ref(fb().db, 'config/board')); }

export type { QuestionCard, SituationCard, SpecialCard };
