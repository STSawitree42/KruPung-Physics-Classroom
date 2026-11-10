/* Teacher content management — เขียนตรงไปที่ /content (Security Rules อนุญาตเฉพาะครู) */
import { get, ref, remove, set, update } from 'firebase/database';
import { fb } from '../config/firebase';
import { validateQuestion, validateSituation, validateSpecial } from '@shared/content';
import { httpsCallable } from 'firebase/functions';
import type { BoardConfig, ContentBundle, GameSettings, QuestionCard, SituationCard, SpecialCard } from '@shared/types';
import { sanitizeSettings } from '@shared/rules.config';

const clean = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

export async function loadContent(): Promise<{ content: ContentBundle; seeded: boolean }> {
  const s = await get(ref(fb().db, 'content'));
  // ชุดเริ่มต้นพร้อมเฉลยดึงจาก Backend (เฉพาะครู) ไม่ฝังไว้ใน JavaScript ของแอป
  const def = (await httpsCallable<unknown, ContentBundle>(fb().fns, 'getDefaultContent')()).data;
  if (!s.exists() || (!s.child('question').exists() && !s.child('situation').exists() && !s.child('special').exists())) return { content: def, seeded: false };
  const v = s.val() as Partial<ContentBundle>;
  return { content: { situation: v.situation || def.situation, question: v.question || def.question, special: v.special || def.special }, seeded: true };
}
/** บันทึกชุดข้อมูลเริ่มต้น (การ์ดต้นฉบับ + คำถาม 50 ข้อ) ลงฐานข้อมูล เพื่อเริ่มแก้ไข */
export async function seedDefaults() {
  await httpsCallable(fb().fns, 'seedContent')();
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
