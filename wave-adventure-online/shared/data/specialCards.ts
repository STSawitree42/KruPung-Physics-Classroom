/* =========================================================
   การ์ดพิเศษ (ช่องฟ้าผ่า ⚡) — จากการ์ดต้นฉบับ "Physics SPECIAL Card" 10 ใบ
   + การ์ดภารกิจทำความดี 2 ใบ (ปิดไว้เป็นค่าเริ่มต้น เปิดได้ใน Game Settings)
   ผลของการ์ดเป็นข้อมูล (Effect) ประมวลผลบน Backend เท่านั้น
   ========================================================= */
import type { SpecialCard } from '../types';

const IMG = (f: string) => `/assets/cards/special/${f}.webp`;

export const SPECIAL_CARDS: SpecialCard[] = [
  { id: 'sp-interference', kind: 'special', type: 'REWARD', title: 'คลื่นแทรกสอด', image: IMG('interference'), enabled: true,
    text: 'คู่แข่งตอบผิดในตาถัดไป (ถ้าตอบถูกก็ให้ถือว่าผิด) หรือคุณได้เดินหน้าเพิ่ม 1 ช่อง',
    effect: { op: 'choice', options: [
      { label: 'ให้กลุ่มถัดไปตอบผิดในการตอบครั้งถัดไป', effect: { op: 'forceNextOpponentWrong' } },
      { label: 'เดินหน้าเพิ่ม 1 ช่อง', effect: { op: 'move', steps: 1 } }] } },
  { id: 'sp-medium-missing', kind: 'special', type: 'PENALTY', title: 'คลื่นตัวกลางขาดหาย', image: IMG('medium-missing'), enabled: true,
    text: 'ถอยหลัง 2 ช่อง หรือพลาดตาเดิน 1 ครั้ง',
    effect: { op: 'choice', options: [
      { label: 'ถอยหลัง 2 ช่อง', effect: { op: 'move', steps: -2 } },
      { label: 'พลาดตาเดิน 1 ครั้ง', effect: { op: 'skipTurn', turns: 1 } }] } },
  { id: 'sp-new-knowledge', kind: 'special', type: 'REWARD', title: 'ความรู้ใหม่', image: IMG('new-knowledge'), enabled: true,
    text: 'คุณได้รับคะแนนพิเศษ 10 คะแนน หรือเดินหน้า 3 ช่อง',
    effect: { op: 'choice', options: [
      { label: 'รับคะแนนพิเศษ 10 คะแนน', effect: { op: 'score', amount: 10 } },
      { label: 'เดินหน้า 3 ช่อง', effect: { op: 'move', steps: 3 } }] } },
  { id: 'sp-reflection', kind: 'special', type: 'SITUATION', title: 'คลื่นสะท้อน', image: IMG('reflection'), enabled: true,
    text: 'ทอยลูกเต๋าใหม่ หากได้เลขคี่ถอยหลังตามจำนวนที่ได้ หากได้เลขคู่เดินหน้าตามจำนวนที่ได้',
    effect: { op: 'diceParity' } },
  { id: 'sp-refraction', kind: 'special', type: 'REWARD', title: 'คลื่นหักเห', image: IMG('refraction'), enabled: true,
    text: 'สามารถเลือกเดินไปยังช่องที่มีสีเดียวกันได้ 1 ช่อง',
    effect: { op: 'sameColor' } },
  { id: 'sp-standing', kind: 'special', type: 'SITUATION', title: 'คลื่นนิ่ง', image: IMG('standing'), enabled: true,
    text: 'ติดอยู่ในช่องปัจจุบัน 1 ตา แต่ได้รับคะแนนพิเศษ 5 คะแนน',
    effect: { op: 'combo', effects: [{ op: 'skipTurn', turns: 1 }, { op: 'score', amount: 5 }] } },
  { id: 'sp-high-energy', kind: 'special', type: 'REWARD', title: 'คลื่นพลังงานสูง', image: IMG('high-energy'), enabled: true,
    text: 'หากตอบคำถามในตาถัดไปถูกต้อง จะได้รับคะแนนเป็น 2 เท่า',
    effect: { op: 'nextAnswerMultiplier', factor: 2 } },
  { id: 'sp-echo', kind: 'special', type: 'SITUATION', title: 'คลื่นเสียงก้อง', image: IMG('echo'), enabled: true,
    text: 'ทอยลูกเต๋า 1 ครั้งเพื่อถอยหลัง และทอยอีก 1 ครั้งเพื่อเดินหน้า',
    effect: { op: 'echo' } },
  { id: 'sp-source', kind: 'special', type: 'SITUATION', title: 'แหล่งกำเนิดคลื่น', image: IMG('source'), enabled: true,
    text: 'ทุกคนต้องช่วยกันตอบคำถามในการ์ดสถานการณ์ถัดไป หากตอบผิดจะถูกหักคะแนน 2 เท่า',
    effect: { op: 'teamworkNextSituation', penaltyMultiplier: 2 } },
  { id: 'sp-absorption', kind: 'special', type: 'PENALTY', title: 'การดูดกลืนคลื่น', image: IMG('absorption'), enabled: true,
    text: 'คุณต้องสูญเสีย 5 คะแนนให้ผู้เล่นคนถัดไป',
    effect: { op: 'transferToNext', amount: 5 } },
  // ---- ภารกิจทำความดี (ครูยืนยันก่อนให้คะแนน) ----
  { id: 'gd-explain', kind: 'special', type: 'GOOD_DEED', title: 'ภารกิจทำความดี: ครูผู้ช่วย', enabled: true,
    text: 'อธิบายความแตกต่างระหว่างคลื่นกลกับคลื่นแม่เหล็กไฟฟ้าให้กลุ่มอื่นฟัง 1 นาที เมื่อครูยืนยัน รับ 5 คะแนน',
    effect: { op: 'goodDeed', reward: 5 } },
  { id: 'gd-help', kind: 'special', type: 'GOOD_DEED', title: 'ภารกิจทำความดี: เพื่อนช่วยเพื่อน', enabled: true,
    text: 'ยกตัวอย่างคลื่นตามยาวในชีวิตประจำวันที่ยังไม่มีใครพูดถึง 2 ตัวอย่าง เมื่อครูยืนยัน รับ 5 คะแนน',
    effect: { op: 'goodDeed', reward: 5 } }
];
