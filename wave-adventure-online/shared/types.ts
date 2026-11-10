/* =========================================================
   WAVE ADVENTURE ONLINE — shared data models
   ใช้ร่วมกันระหว่างหน้าเว็บ (React) และ Host Runtime บนเครื่องครู
   ========================================================= */

export type CellType = 'START' | 'NORMAL' | 'WAVE' | 'LIGHTNING' | 'FINISH';
export type CellColor = 'blue' | 'purple' | null;

export interface BoardCell {
  index: number;          // 0 = START, last = FINISH
  x: number | null;       // normalized 0..1 (null = ยังไม่ได้กำหนดพิกัด)
  y: number | null;
  type: CellType;
  color: CellColor;       // สีพื้นช่อง ใช้กับการ์ด "คลื่นหักเห"
}

export interface BoardConfig {
  id: string;
  name: string;
  image: string;          // path ของภาพกระดานต้นฉบับ
  aspect: number;         // width / height ของภาพ
  cells: BoardCell[];
  updatedAt?: number;
}

/* ---------------- Cards ---------------- */
export type WaveType = 'mechanical' | 'electromagnetic' | 'transverse' | 'longitudinal';
export type Difficulty = 'easy' | 'medium' | 'hard';

/** การ์ดสถานการณ์คลื่น (กองการ์ด WAVE) — เลือกประเภทคลื่นได้มากกว่า 1 ใบ */
export interface SituationCard {
  id: string;
  kind: 'situation';
  title: string;
  text: string;
  points: number;                 // คะแนนตามตัวเลขบนการ์ด (2–5)
  image?: string;
  answers: WaveType[][];          // ชุดคำตอบที่ถูกต้อง (มีได้หลายแบบ เช่น วิทยุ = เสียง หรือ คลื่นวิทยุ)
  explanation: string;
  note?: string;                  // หมายเหตุสำหรับครู (ไม่แสดงต่อนักเรียน)
  enabled: boolean;
}

/** การ์ดคำถามฟิสิกส์ 4 ตัวเลือก (กองการ์ด WAVE เมื่อเปิดโหมดคำถาม) */
export interface QuestionCard {
  id: string;
  kind: 'question';
  category: string;
  difficulty: Difficulty;
  text: string;                   // รองรับสมการ LaTeX ระหว่าง $...$
  image?: string;
  choices: string[];              // 4 ตัวเลือก
  answer: number;                 // index ของตัวเลือกที่ถูก
  explanation: string;
  points: number;
  enabled: boolean;
}

export type WaveCard = SituationCard | QuestionCard;

export type SpecialCardType = 'REWARD' | 'PENALTY' | 'SITUATION' | 'GOOD_DEED';

/** ผลของการ์ดพิเศษ (data-driven) */
export type Effect =
  | { op: 'score'; amount: number }
  | { op: 'move'; steps: number }
  | { op: 'skipTurn'; turns: number }
  | { op: 'extraRoll' }
  | { op: 'diceParity' }                                   // คลื่นสะท้อน: คี่ถอย คู่เดินหน้า
  | { op: 'echo' }                                         // คลื่นเสียงก้อง: ทอยถอย แล้วทอยเดินหน้า
  | { op: 'sameColor' }                                    // คลื่นหักเห: ไปช่องสีเดียวกันถัดไป
  | { op: 'nextAnswerMultiplier'; factor: number }         // คลื่นพลังงานสูง
  | { op: 'forceNextOpponentWrong' }                       // คลื่นแทรกสอด
  | { op: 'transferToNext'; amount: number }               // การดูดกลืนคลื่น
  | { op: 'teamworkNextSituation'; penaltyMultiplier: number } // แหล่งกำเนิดคลื่น
  | { op: 'goodDeed'; reward: number }                     // ภารกิจทำความดี (ครูยืนยัน)
  | { op: 'combo'; effects: Effect[] }
  | { op: 'choice'; options: { label: string; effect: Effect }[] };

export interface SpecialCard {
  id: string;
  kind: 'special';
  type: SpecialCardType;
  title: string;
  text: string;
  image?: string;
  effect: Effect;
  enabled: boolean;
}

export interface ContentBundle {
  situation: Record<string, SituationCard>;
  question: Record<string, QuestionCard>;
  special: Record<string, SpecialCard>;
}

/* ---------------- Settings ---------------- */
export interface GameSettings {
  maxPlayers: number;               // 2–6 กลุ่ม
  answerSeconds: number;            // เวลาตอบการ์ด (วินาที)
  waveDeck: 'situation' | 'question' | 'mixed';
  doubleForFullAnswer: boolean;     // เลือกประเภทคลื่นครบทุกข้อ ได้ 2 เท่า
  questionPoints: 'card' | 'fixed'; // คะแนนการ์ดคำถาม: ตามการ์ด หรือคงที่
  fixedQuestionPoints: number;
  wrongMoveBack: number;            // ตอบผิดถอยหลังกี่ช่อง
  wrongPenaltyPoints: number;       // ตอบผิดเสียคะแนนเท่าไร (0 = ไม่หัก)
  winCondition: 'highestScore' | 'firstToFinish';
  exactFinish: boolean;             // ต้องทอยได้พอดีเส้นชัยหรือไม่
  turnOrder: 'diceOff' | 'join' | 'random';
  timeLimitMinutes: number;         // 0 = ไม่จำกัด
  maxRounds: number;                // 0 = ไม่จำกัด
  specialCardsEnabled: boolean;
  goodDeedCardsEnabled: boolean;
  cardMovesTriggerCells: boolean;   // การเดินจากผลการ์ดทำให้เกิดเหตุการณ์ของช่องใหม่หรือไม่
  teacherConfirm: boolean;          // ครูยืนยันผลการตอบก่อนให้คะแนน
  skipTurnsEnabled: boolean;
  extraRollOnSix: boolean;          // ทอยได้ 6 ทอยซ้ำ
  requireSchoolLogin: boolean;      // ต้องเข้าสู่ระบบด้วยเลขประจำตัว + PIN
}

/* ---------------- Room / game state ---------------- */
export type RoomStatus = 'WAITING' | 'PLAYING' | 'PAUSED' | 'FINISHED';
export type Phase =
  | 'WAITING' | 'READY' | 'ROLLING' | 'MOVING' | 'CARD_PENDING'
  | 'ANSWERING' | 'RESOLVING' | 'TURN_COMPLETE' | 'FINISHED';

export interface PlayerStats { correct: number; partial: number; wrong: number; cards: number; specials: number; }

export interface PlayerState {
  id: string;                     // Firebase Auth uid
  name: string;                   // ชื่อกลุ่ม / ชื่อเล่น
  avatar: string;
  color: string;
  position: number;
  score: number;
  skipTurns: number;
  nextAnswerMultiplier: number;   // 1 = ปกติ
  forcedWrong: boolean;
  ready: boolean;
  joinedAt: number;
  orderRoll?: number;             // แต้มลูกเต๋าตอนจัดลำดับ
  captain?: string;               // ชื่อนักเรียนที่เข้าสู่ระบบ (ถ้ามี)
  sid?: string;                   // เลขประจำตัว (ถ้าเข้าสู่ระบบด้วย PIN)
  removed?: boolean;
  stats: PlayerStats;
}

/** ข้อมูลการ์ดที่ส่งให้ทุกเครื่อง — ไม่มีเฉลยจนกว่าจะตอบ */
export interface PublicCard {
  id: string;
  deck: 'wave' | 'special';
  kind: 'situation' | 'question' | 'special';
  title: string;
  text: string;
  image?: string;
  points?: number;
  choices?: string[];             // คำถาม 4 ตัวเลือก
  options?: string[];             // ตัวเลือกของการ์ดพิเศษแบบเลือกได้
  specialType?: SpecialCardType;
  teamwork?: boolean;             // การ์ดนี้ถูกกำหนดให้ทุกกลุ่มช่วยกันตอบ (แหล่งกำเนิดคลื่น)
  // เปิดเผยหลังตอบ
  reveal?: {
    answers?: WaveType[][];
    answer?: number;
    explanation?: string;
    selection?: WaveType[] | number | string | null;
    verdict?: Verdict;
    points?: number;
    timeout?: boolean;
  };
}

export type Verdict = 'full' | 'partial' | 'wrong';

export interface MoveInfo {
  seq: number;
  playerId: string;
  from: number;
  to: number;
  path: number[];
  kind: 'dice' | 'card' | 'penalty';
  dice?: number[];
}

export interface TurnState {
  playerId: string | null;
  seq: number;                    // เพิ่มขึ้นทุกการกระทำ (ใช้ซิงก์แอนิเมชัน)
  dice?: number | null;
  move?: MoveInfo | null;
  card?: PublicCard | null;
  awaiting: 'roll' | 'answer' | 'choice' | 'teacher' | null;
  deadline?: number | null;       // เวลาสิ้นสุด (ms epoch) ของการตอบ/เลือก
  pendingSelection?: WaveType[] | number | null; // คำตอบที่รอครูตัดสิน
  suggestedVerdict?: Verdict | null;
}

export interface LogEntry {
  seq: number;
  t: number;
  type: string;
  playerId?: string | null;
  text: string;
}

export interface GameResultRow {
  rank: number;
  playerId: string;
  name: string;
  captain?: string;
  score: number;
  position: number;
  correct: number;
  partial: number;
  wrong: number;
  cards: number;
  winner: boolean;
}

export interface RoomPublic {
  id: string;
  code: string;
  name: string;
  hostUid: string;
  hostName: string;
  createdAt: number;
  status: RoomStatus;
  phase: Phase;
  settings: GameSettings;
  board: BoardConfig;
  players: Record<string, PlayerState>;
  order: string[];
  turnIndex: number;
  round: number;
  turn: TurnState;
  teamworkNext?: { by: string; penaltyMultiplier: number } | null;
  lastCard?: (PublicCard & { playerId: string; seq: number }) | null;  // การ์ดล่าสุดพร้อมเฉลย ให้ทุกเครื่องแสดงผล
  startedAt?: number | null;
  endsAt?: number | null;
  pausedAt?: number | null;
  finishedAt?: number | null;
  endReason?: string | null;
  results?: GameResultRow[] | null;
  log: Record<string, LogEntry>;
  version: number;
  rematch?: { roomId: string; code: string } | null;   // ห้องใหม่เมื่อครูกด "เล่นใหม่"
}

export interface AnswerRecord {
  t: number;
  playerId: string;
  playerName: string;
  cardId: string;
  kind: 'situation' | 'question' | 'special';
  selection: WaveType[] | number | string | null;
  verdict: Verdict | 'applied';
  points: number;
  byTeacher?: boolean;
}

export interface RoomSecret {
  content: ContentBundle;
  decks: { wave: string[]; special: string[] };
  current?: { cardId: string; deck: 'wave' | 'special' } | null;
  history: AnswerRecord[];
  processed: Record<string, number>;  // requestId -> time (idempotency)
}

export interface RoomDoc {
  public: RoomPublic;
  secret: RoomSecret;
  members: Record<string, boolean>;
}
