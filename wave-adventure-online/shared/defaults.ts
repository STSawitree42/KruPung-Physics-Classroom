/* ชุดข้อมูลเริ่มต้นพร้อมเฉลย — ใช้ใน Backend และชุดทดสอบเท่านั้น
   ห้าม import ไฟล์นี้จากโค้ด Frontend (src/) เพราะจะทำให้เฉลยติดไปกับ JavaScript ของนักเรียน */
import type { ContentBundle } from './types';
import { SITUATION_CARDS } from './data/situationCards';
import { SPECIAL_CARDS } from './data/specialCards';
import { QUESTION_CARDS } from './data/questions';

export function defaultContent(): ContentBundle {
  const byId = <T extends { id: string }>(a: T[]) => Object.fromEntries(a.map(x => [x.id, structuredClone(x)])) as Record<string, T>;
  return { situation: byId(SITUATION_CARDS), question: byId(QUESTION_CARDS), special: byId(SPECIAL_CARDS) };
}
