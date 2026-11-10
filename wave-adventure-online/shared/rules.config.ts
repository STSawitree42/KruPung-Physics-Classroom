/* =========================================================
   rules.config.ts — กติกาเริ่มต้น (ครูปรับได้ใน Game Settings)
   ---------------------------------------------------------
   ยึดตามกติกาต้นฉบับ "ผจญภัยในโลกคลื่น (Wave Master)":
   - หยุดช่องคลื่น 🌊 → หยิบการ์ดสถานการณ์ เลือกการ์ดประเภทคลื่น (เลือกได้มากกว่า 1 ใบ)
   - ตอบถูก → ได้คะแนนตามตัวเลขบนการ์ด · ตอบถูกทั้งหมด → 2 เท่า
   - ตอบไม่ถูกเลย → 0 คะแนน และถอยหลัง 2 ช่อง
   - หยุดช่องฟ้าผ่า ⚡ → หยิบการ์ดพิเศษ ทำตามคำสั่งทันที
   - เกมจบเมื่อกลุ่มแรกถึง FINISH (เดินเกินได้) แล้วรวมคะแนน กลุ่มคะแนนสูงสุดชนะ
   - หมดเวลา 30–35 นาที → หยุดเล่นแล้วรวมคะแนน
   - ลำดับการเล่น: ทอยลูกเต๋า แต้มสูงสุดเริ่มก่อน แล้ววนตามลำดับ
   ========================================================= */
import type { GameSettings } from './types';

export const DEFAULT_SETTINGS: GameSettings = {
  maxPlayers: 6,
  answerSeconds: 60,
  waveDeck: 'situation',
  doubleForFullAnswer: true,
  questionPoints: 'card',
  fixedQuestionPoints: 10,
  wrongMoveBack: 2,
  wrongPenaltyPoints: 0,
  winCondition: 'highestScore',
  exactFinish: false,
  turnOrder: 'diceOff',
  timeLimitMinutes: 35,
  maxRounds: 0,
  specialCardsEnabled: true,
  goodDeedCardsEnabled: false,
  cardMovesTriggerCells: false,
  teacherConfirm: false,
  skipTurnsEnabled: true,
  extraRollOnSix: false,
  requireSchoolLogin: false
};

type Rule = { min?: number; max?: number; values?: readonly unknown[] };
const LIMITS: Partial<Record<keyof GameSettings, Rule>> = {
  maxPlayers: { min: 2, max: 6 },
  answerSeconds: { min: 10, max: 600 },
  fixedQuestionPoints: { min: 0, max: 100 },
  wrongMoveBack: { min: 0, max: 10 },
  wrongPenaltyPoints: { min: 0, max: 100 },
  timeLimitMinutes: { min: 0, max: 240 },
  maxRounds: { min: 0, max: 200 },
  waveDeck: { values: ['situation', 'question', 'mixed'] },
  questionPoints: { values: ['card', 'fixed'] },
  winCondition: { values: ['highestScore', 'firstToFinish'] },
  turnOrder: { values: ['diceOff', 'join', 'random'] }
};

/** รวมค่าที่ครูส่งมากับค่าเริ่มต้น และตัดค่าที่อยู่นอกขอบเขต (ใช้ทั้งฝั่ง UI และ Backend) */
export function sanitizeSettings(input: unknown): GameSettings {
  const src = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const out = { ...DEFAULT_SETTINGS } as Record<string, unknown>;
  (Object.keys(DEFAULT_SETTINGS) as (keyof GameSettings)[]).forEach(k => {
    const def = DEFAULT_SETTINGS[k];
    const v = src[k];
    if (v === undefined) return;
    const rule = LIMITS[k];
    if (typeof def === 'boolean') { out[k] = v === true; return; }
    if (typeof def === 'number') {
      const n = Math.round(Number(v));
      if (!Number.isFinite(n)) return;
      out[k] = Math.min(rule?.max ?? n, Math.max(rule?.min ?? n, n));
      return;
    }
    if (rule?.values && rule.values.includes(v)) out[k] = v;
  });
  return out as unknown as GameSettings;
}

export const AVATARS = [
  { id: 'surfer', emoji: '🏄', name: 'นักโต้คลื่น' },
  { id: 'diver', emoji: '🤿', name: 'นักดำน้ำ' },
  { id: 'scientist', emoji: '🧑‍🔬', name: 'นักวิทยาศาสตร์' },
  { id: 'captain', emoji: '🧑‍✈️', name: 'กัปตันเรือ' },
  { id: 'robot', emoji: '🤖', name: 'หุ่นยนต์คลื่น' },
  { id: 'whale', emoji: '🐋', name: 'วาฬสีน้ำเงิน' },
  { id: 'dolphin', emoji: '🐬', name: 'โลมา' },
  { id: 'octopus', emoji: '🐙', name: 'ปลาหมึก' }
] as const;

export const TOKEN_COLORS = [
  { id: 'red', hex: '#ef4444', name: 'แดง' },
  { id: 'yellow', hex: '#facc15', name: 'เหลือง' },
  { id: 'green', hex: '#22c55e', name: 'เขียว' },
  { id: 'blue', hex: '#3b82f6', name: 'น้ำเงิน' },
  { id: 'purple', hex: '#a855f7', name: 'ม่วง' },
  { id: 'cyan', hex: '#06b6d4', name: 'ฟ้า' }
] as const;

export const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // ไม่มี 0/O 1/I/L ที่สับสนง่าย
