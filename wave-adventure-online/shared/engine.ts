/* =========================================================
   Game Engine — server-authoritative state machine
   ---------------------------------------------------------
   ฟังก์ชันทั้งหมดเป็น pure TypeScript: รับเอกสารห้อง (RoomDoc) + บริบท (เวลา, ตัวสุ่ม)
   แล้วแก้ไขเอกสารนั้น — Host Runtime (เครื่องครู) เรียกใช้ภายใน RTDB transaction
   เครื่องนักเรียนไม่เคยเรียกฟังก์ชันเหล่านี้ (ส่งได้แค่คำสั่งลง inbox)

   WAITING ─start→ ROLLING ─roll→ MOVING → (ช่องปกติ) TURN_COMPLETE → ROLLING (คนถัดไป)
                                     ├→ ช่องคลื่น  → ANSWERING ─answer→ (RESOLVING*) → TURN_COMPLETE
                                     ├→ ช่องฟ้าผ่า → CARD_PENDING (การ์ดเลือกได้) → TURN_COMPLETE
                                     └→ FINISH    → FINISHED
   * RESOLVING = รอครูยืนยัน (teacherConfirm หรือภารกิจทำความดี)
   MOVING และ TURN_COMPLETE เป็นขั้นชั่วคราวที่ประมวลผลในธุรกรรมเดียวกัน (บันทึกใน log)
   ========================================================= */
import type {
  BoardConfig, ContentBundle, Effect, GameResultRow, GameSettings, LogEntry, MoveInfo, PlayerState,
  PublicCard, QuestionCard, RoomDoc, SituationCard, SpecialCard, Verdict, WaveType
} from './types';
import { gradeSituation, publicSpecialCard, publicWaveCard, WAVE_TYPE_SET } from './content';
import { finishIndex } from './board.config';

export class EngineError extends Error {
  constructor(public code: 'failed-precondition' | 'permission-denied' | 'invalid-argument' | 'not-found' | 'resource-exhausted', message: string) { super(message); }
}
function fail(code: EngineError['code'], msg: string): never { throw new EngineError(code, msg); }

export interface Ctx { now: number; rng: () => number; }
export const rollDie = (ctx: Ctx) => 1 + Math.floor(ctx.rng() * 6);

const MAX_LOG = 60;
const MAX_PROCESSED = 300;

/* =========================================================
   Room creation & lobby
   ========================================================= */
export function createRoomDoc(p: { id: string; code: string; name: string; hostUid: string; hostName: string; settings: GameSettings; board: BoardConfig; content: ContentBundle; now: number }): RoomDoc {
  return {
    public: {
      id: p.id, code: p.code, name: p.name, hostUid: p.hostUid, hostName: p.hostName, createdAt: p.now,
      status: 'WAITING', phase: 'WAITING', settings: p.settings, board: p.board,
      players: {}, order: [], turnIndex: 0, round: 0,
      turn: { playerId: null, seq: 0, dice: null, move: null, card: null, awaiting: null, deadline: null },
      teamworkNext: null, lastCard: null, startedAt: null, endsAt: null, pausedAt: null, finishedAt: null, endReason: null, results: null,
      log: {}, version: 1
    },
    secret: { content: p.content, decks: { wave: [], special: [] }, current: null, history: [], processed: {} },
    members: {}
  };
}

const activePlayers = (doc: RoomDoc) => Object.values(doc.public.players || {}).filter(pl => !pl.removed);

export function addPlayer(doc: RoomDoc, p: { uid: string; name: string; avatar: string; color: string; captain?: string; sid?: string }, now: number) {
  const pub = doc.public;
  const existing = pub.players[p.uid];
  if (existing && !existing.removed) return existing;                     // rejoin (same uid)
  if (existing && existing.removed) fail('permission-denied', 'คุณถูกนำออกจากห้องนี้แล้ว');
  if (pub.status !== 'WAITING') fail('failed-precondition', 'เกมเริ่มไปแล้ว เข้าร่วมใหม่ไม่ได้');
  const players = activePlayers(doc);
  if (players.length >= pub.settings.maxPlayers) fail('resource-exhausted', `ห้องเต็มแล้ว (สูงสุด ${pub.settings.maxPlayers} กลุ่ม)`);
  if (players.some(x => x.name.toLowerCase() === p.name.toLowerCase())) fail('invalid-argument', 'ชื่อนี้ถูกใช้ในห้องแล้ว');
  if (players.some(x => x.color === p.color)) fail('invalid-argument', 'สีตัวเดินนี้ถูกเลือกแล้ว');
  if (p.sid && players.some(x => x.sid === p.sid)) fail('invalid-argument', 'เลขประจำตัวนี้อยู่ในห้องแล้ว');
  const pl: PlayerState = {
    id: p.uid, name: p.name, avatar: p.avatar, color: p.color, position: 0, score: 0, skipTurns: 0, nextAnswerMultiplier: 1,
    forcedWrong: false, ready: false, joinedAt: now, stats: { correct: 0, partial: 0, wrong: 0, cards: 0, specials: 0 }
  };
  if (p.captain) pl.captain = p.captain;
  if (p.sid) pl.sid = p.sid;
  pub.players[p.uid] = pl;
  doc.members[p.uid] = true;
  log(doc, 'join', `${p.name} เข้าร่วมห้อง`, p.uid, now);
  refreshLobbyPhase(doc);
  return pl;
}

/** ย้ายผู้เล่นไปยัง uid ใหม่ (เข้าสู่ระบบด้วยเลขประจำตัวเดิมจากเครื่องใหม่) */
export function rebindPlayer(doc: RoomDoc, oldUid: string, newUid: string, now: number) {
  const pub = doc.public;
  const pl = pub.players[oldUid];
  if (!pl || pl.removed) fail('not-found', 'ไม่พบผู้เล่นเดิม');
  if (pub.players[newUid]) fail('failed-precondition', 'บัญชีนี้อยู่ในห้องแล้ว');
  pl.id = newUid;
  pub.players[newUid] = pl; delete pub.players[oldUid];
  pub.order = pub.order.map(u => (u === oldUid ? newUid : u));
  if (pub.turn.playerId === oldUid) pub.turn.playerId = newUid;
  delete doc.members[oldUid]; doc.members[newUid] = true;
  log(doc, 'rejoin', `${pl.name} กลับเข้าห้องจากอุปกรณ์ใหม่`, newUid, now);
}

export function setReady(doc: RoomDoc, uid: string, ready: boolean) {
  const pl = doc.public.players[uid];
  if (!pl || pl.removed) fail('permission-denied', 'คุณไม่ได้อยู่ในห้องนี้');
  if (doc.public.status !== 'WAITING') fail('failed-precondition', 'เกมเริ่มแล้ว');
  pl.ready = !!ready;
  refreshLobbyPhase(doc);
}

function refreshLobbyPhase(doc: RoomDoc) {
  if (doc.public.status !== 'WAITING') return;
  const ps = activePlayers(doc);
  doc.public.phase = ps.length >= 2 && ps.every(p => p.ready) ? 'READY' : 'WAITING';
}

export function removePlayer(doc: RoomDoc, uid: string, ctx: Ctx) {
  const pub = doc.public;
  const pl = pub.players[uid];
  if (!pl || pl.removed) fail('not-found', 'ไม่พบผู้เล่น');
  if (pub.status === 'WAITING') { delete pub.players[uid]; delete doc.members[uid]; log(doc, 'leave', `${pl.name} ออกจากห้อง`, uid, ctx.now); refreshLobbyPhase(doc); return; }
  pl.removed = true;
  delete doc.members[uid];
  log(doc, 'remove', `${pl.name} ถูกนำออกจากเกม`, uid, ctx.now);
  const wasTurn = pub.turn.playerId === uid;
  pub.order = pub.order.filter(u => u !== uid);
  if (pub.status === 'FINISHED') return;
  if (pub.order.length < 1) return endGame(doc, 'noPlayers', ctx);
  if (wasTurn) { pub.turnIndex = (pub.turnIndex - 1 + pub.order.length) % pub.order.length; doc.secret.current = null; nextTurn(doc, ctx); }
  else pub.turnIndex = Math.max(0, pub.order.indexOf(pub.turn.playerId || '') );
}

/* =========================================================
   Start
   ========================================================= */
export function startGame(doc: RoomDoc, ctx: Ctx) {
  const pub = doc.public;
  if (pub.status !== 'WAITING') fail('failed-precondition', 'เกมเริ่มไปแล้ว');
  const ps = activePlayers(doc);
  if (ps.length < 2) fail('failed-precondition', 'ต้องมีผู้เล่นอย่างน้อย 2 กลุ่ม');
  if (!ps.every(p => p.ready)) fail('failed-precondition', 'ผู้เล่นทุกกลุ่มต้องกด “พร้อม” ก่อน');
  // turn order
  let order: string[];
  if (pub.settings.turnOrder === 'join') order = ps.sort((a, b) => a.joinedAt - b.joinedAt).map(p => p.id);
  else if (pub.settings.turnOrder === 'random') order = shuffle(ps.map(p => p.id), ctx);
  else {
    const rolls = ps.map(p => { const r = rollDie(ctx); p.orderRoll = r; return { id: p.id, r, tie: ctx.rng() }; });
    order = rolls.sort((a, b) => b.r - a.r || b.tie - a.tie).map(x => x.id);
    log(doc, 'order', 'ทอยลูกเต๋าเลือกลำดับ: ' + rolls.map(x => `${pub.players[x.id].name} ${x.r}`).join(' · '), null, ctx.now);
  }
  pub.order = order;
  doc.secret.decks = { wave: buildWaveDeck(doc, ctx), special: buildSpecialDeck(doc, ctx) };
  pub.status = 'PLAYING';
  pub.startedAt = ctx.now;
  pub.endsAt = pub.settings.timeLimitMinutes > 0 ? ctx.now + pub.settings.timeLimitMinutes * 60000 : null;
  pub.round = 1;
  pub.turnIndex = 0;
  ps.forEach(p => { p.position = 0; p.score = 0; });
  log(doc, 'start', 'เริ่มเกม! ' + order.map((u, i) => `${i + 1}. ${pub.players[u].name}`).join('  '), null, ctx.now);
  beginTurn(doc, ctx);
}

/* =========================================================
   Roll & move
   ========================================================= */
export function roll(doc: RoomDoc, uid: string, ctx: Ctx): number {
  const pub = doc.public;
  assertPlaying(doc);
  if (pub.turn.playerId !== uid) fail('permission-denied', 'ยังไม่ถึงตาของคุณ');
  if (pub.phase !== 'ROLLING' || pub.turn.awaiting !== 'roll') fail('failed-precondition', 'ตอนนี้ยังทอยลูกเต๋าไม่ได้');
  const d = rollDie(ctx);
  pub.turn.dice = d;
  const pl = pub.players[uid];
  log(doc, 'roll', `${pl.name} ทอยได้ ${d}`, uid, ctx.now);
  pub.phase = 'MOVING';
  const fin = finishIndex(pub.board);
  let steps = d;
  if (pub.settings.exactFinish && pl.position + d > fin) {
    steps = 0;
    log(doc, 'bounce', `${pl.name} ต้องทอยให้พอดีเส้นชัย จึงอยู่ที่เดิม`, uid, ctx.now);
  }
  moveBy(doc, uid, steps, 'dice', ctx, [d]);
  if (pub.status === 'PLAYING') landOn(doc, uid, ctx, { fromDice: d });
  return d;
}

function moveBy(doc: RoomDoc, uid: string, steps: number, kind: MoveInfo['kind'], ctx: Ctx, dice?: number[]) {
  const pub = doc.public;
  const pl = pub.players[uid];
  const fin = finishIndex(pub.board);
  const from = pl.position;
  const to = Math.max(0, Math.min(fin, from + steps));
  const path: number[] = [];
  for (let i = from; i !== to; i += to > from ? 1 : -1) path.push(i + (to > from ? 1 : -1));
  pl.position = to;
  pub.turn.seq++;
  pub.turn.move = { seq: pub.turn.seq, playerId: uid, from, to, path, kind, dice: dice || [] };
  if (to === fin && from !== fin) {
    log(doc, 'finish', `🏁 ${pl.name} ถึงเส้นชัย!`, uid, ctx.now);
    endGame(doc, 'finish', ctx, uid);
  }
  return to;
}

function landOn(doc: RoomDoc, uid: string, ctx: Ctx, opts: { fromDice?: number } = {}) {
  const pub = doc.public;
  const pl = pub.players[uid];
  const t = pub.board.cells[pl.position]?.type || 'NORMAL';
  if (t === 'WAVE') return drawWave(doc, uid, ctx);
  if (t === 'LIGHTNING' && pub.settings.specialCardsEnabled) return drawSpecial(doc, uid, ctx);
  completeTurn(doc, ctx, { extraRoll: !!(pub.settings.extraRollOnSix && opts.fromDice === 6) });
}

/* =========================================================
   Wave cards (situation / question)
   ========================================================= */
function buildWaveDeck(doc: RoomDoc, ctx: Ctx): string[] {
  const c = doc.secret.content, mode = doc.public.settings.waveDeck;
  const ids: string[] = [];
  if (mode !== 'question') Object.values(c.situation).forEach(x => x.enabled && ids.push('S:' + x.id));
  if (mode !== 'situation') Object.values(c.question).forEach(x => x.enabled && ids.push('Q:' + x.id));
  return shuffle(ids, ctx);
}
function buildSpecialDeck(doc: RoomDoc, ctx: Ctx): string[] {
  const allowGood = doc.public.settings.goodDeedCardsEnabled;
  return shuffle(Object.values(doc.secret.content.special).filter(x => x.enabled && (allowGood || x.type !== 'GOOD_DEED')).map(x => x.id), ctx);
}
function drawFrom(doc: RoomDoc, deck: 'wave' | 'special', ctx: Ctx): string | null {
  const d = doc.secret.decks;
  if (!d[deck] || !d[deck].length) d[deck] = deck === 'wave' ? buildWaveDeck(doc, ctx) : buildSpecialDeck(doc, ctx);
  return d[deck].shift() || null;
}

function waveCardById(doc: RoomDoc, ref: string): SituationCard | QuestionCard | null {
  const [k, id] = ref.split(':');
  return (k === 'S' ? doc.secret.content.situation[id] : doc.secret.content.question[id]) || null;
}

function drawWave(doc: RoomDoc, uid: string, ctx: Ctx) {
  const pub = doc.public;
  const ref = drawFrom(doc, 'wave', ctx);
  const card = ref ? waveCardById(doc, ref) : null;
  if (!card) { log(doc, 'nodeck', 'ไม่มีการ์ดคลื่นในคลัง ข้ามเหตุการณ์', uid, ctx.now); return completeTurn(doc, ctx); }
  const teamwork = !!pub.teamworkNext;
  pub.players[uid].stats.cards++;
  doc.secret.current = { cardId: ref!, deck: 'wave' };
  pub.turn.card = publicWaveCard(card, teamwork);
  pub.turn.awaiting = 'answer';
  pub.turn.deadline = ctx.now + pub.settings.answerSeconds * 1000;
  pub.turn.pendingSelection = null; pub.turn.suggestedVerdict = null;
  pub.phase = 'ANSWERING';
  pub.turn.seq++;
  log(doc, 'card', `🌊 ${pub.players[uid].name} เปิดการ์ด: ${card.kind === 'situation' ? card.title : 'คำถาม' + card.category}${teamwork ? ' (ทุกกลุ่มช่วยกันตอบ)' : ''}`, uid, ctx.now);
}

/** ผู้เล่นส่งคำตอบ: situation → รายการประเภทคลื่น, question → index ตัวเลือก */
export function answer(doc: RoomDoc, uid: string, payload: unknown, ctx: Ctx) {
  const pub = doc.public;
  assertPlaying(doc);
  if (pub.turn.playerId !== uid) fail('permission-denied', 'ยังไม่ถึงตาของคุณ');
  if (pub.phase !== 'ANSWERING' || pub.turn.awaiting !== 'answer' || !doc.secret.current) fail('failed-precondition', 'ไม่มีคำถามที่รอคำตอบ');
  if (pub.turn.deadline && ctx.now > pub.turn.deadline + 2000) return timeout(doc, ctx);
  const card = waveCardById(doc, doc.secret.current.cardId)!;
  let selection: WaveType[] | number;
  if (card.kind === 'situation') {
    if (!Array.isArray(payload)) fail('invalid-argument', 'รูปแบบคำตอบไม่ถูกต้อง');
    selection = [...new Set((payload as unknown[]).filter((t): t is WaveType => WAVE_TYPE_SET.includes(t as WaveType)))];
    if (!selection.length) fail('invalid-argument', 'เลือกการ์ดประเภทคลื่นอย่างน้อย 1 ใบ');
  } else {
    const n = Number(payload);
    if (!Number.isInteger(n) || n < 0 || n >= card.choices.length) fail('invalid-argument', 'เลือกคำตอบ 1 ข้อ');
    selection = n;
  }
  const verdict: Verdict = card.kind === 'situation' ? gradeSituation(selection as WaveType[], card.answers) : (selection === card.answer ? 'full' : 'wrong');
  if (pub.settings.teacherConfirm) {
    pub.turn.pendingSelection = selection; pub.turn.suggestedVerdict = verdict;
    pub.turn.awaiting = 'teacher'; pub.turn.deadline = null; pub.phase = 'RESOLVING'; pub.turn.seq++;
    log(doc, 'submitted', `${pub.players[uid].name} ส่งคำตอบแล้ว รอครูตัดสิน`, uid, ctx.now);
    return;
  }
  resolveWave(doc, uid, card, selection, verdict, ctx, {});
}

function resolveWave(doc: RoomDoc, uid: string, card: SituationCard | QuestionCard, selection: WaveType[] | number | null, verdict: Verdict, ctx: Ctx, o: { timeout?: boolean; byTeacher?: boolean }) {
  const pub = doc.public, s = pub.settings;
  const pl = pub.players[uid];
  let v = verdict;
  if (pl.forcedWrong) { pl.forcedWrong = false; if (v !== 'wrong') { v = 'wrong'; log(doc, 'interference', `〰️ คลื่นแทรกสอด! คำตอบของ ${pl.name} ถือว่าผิด`, uid, ctx.now); } }
  const base = card.kind === 'situation' ? card.points : (s.questionPoints === 'fixed' ? s.fixedQuestionPoints : card.points);
  let pts = 0;
  if (v === 'full') pts = card.kind === 'situation' && s.doubleForFullAnswer ? base * 2 : base;
  else if (v === 'partial') pts = base;
  if (pts > 0 && pl.nextAnswerMultiplier > 1) { pts *= pl.nextAnswerMultiplier; log(doc, 'energy', `⚡ คลื่นพลังงานสูง: คะแนน ×${pl.nextAnswerMultiplier}`, uid, ctx.now); }
  pl.nextAnswerMultiplier = 1;
  const teamwork = pub.turn.card?.teamwork ? pub.teamworkNext : null;
  if (teamwork) pub.teamworkNext = null;
  let delta = pts;
  if (v === 'wrong') {
    delta = -(teamwork ? base * teamwork.penaltyMultiplier : s.wrongPenaltyPoints);
    pl.stats.wrong++;
  } else if (v === 'partial') pl.stats.partial++; else pl.stats.correct++;
  pl.score = Math.max(0, pl.score + delta);
  pub.turn.card = {
    ...(pub.turn.card as PublicCard),
    reveal: {
      answers: card.kind === 'situation' ? card.answers : undefined,
      answer: card.kind === 'question' ? card.answer : undefined,
      explanation: card.explanation, selection, verdict: v, points: delta, timeout: o.timeout || undefined
    }
  };
  doc.secret.history.push({ t: ctx.now, playerId: uid, playerName: pl.name, cardId: card.id, kind: card.kind, selection, verdict: v, points: delta, byTeacher: o.byTeacher || undefined });
  const label = v === 'full' ? 'ถูกทั้งหมด' : v === 'partial' ? 'ถูกบางส่วน' : (o.timeout ? 'หมดเวลา' : 'ไม่ถูกต้อง');
  pub.lastCard = { ...(pub.turn.card as PublicCard), playerId: uid, seq: pub.turn.seq + 1 };
  log(doc, 'answer', `${v === 'wrong' ? '❌' : '✅'} ${pl.name} ${label} ${delta >= 0 ? '+' : ''}${delta} คะแนน`, uid, ctx.now);
  doc.secret.current = null;
  pub.turn.awaiting = null; pub.turn.deadline = null; pub.turn.pendingSelection = null; pub.turn.suggestedVerdict = null;
  pub.phase = 'TURN_COMPLETE';
  if (v === 'wrong' && s.wrongMoveBack > 0) {
    moveBy(doc, uid, -s.wrongMoveBack, 'penalty', ctx);
    log(doc, 'back', `${pl.name} ถอยหลัง ${s.wrongMoveBack} ช่อง`, uid, ctx.now);
  }
  completeTurn(doc, ctx);
}

/* =========================================================
   Special cards
   ========================================================= */
function drawSpecial(doc: RoomDoc, uid: string, ctx: Ctx) {
  const pub = doc.public;
  const id = drawFrom(doc, 'special', ctx);
  const card = id ? doc.secret.content.special[id] : null;
  const pl = pub.players[uid];
  if (!card) { log(doc, 'nodeck', 'ไม่มีการ์ดพิเศษในคลัง ข้ามเหตุการณ์', uid, ctx.now); return completeTurn(doc, ctx); }
  pl.stats.specials++;
  doc.secret.current = { cardId: card.id, deck: 'special' };
  log(doc, 'special', `⚡ ${pl.name} เปิดการ์ดพิเศษ: ${card.title}`, uid, ctx.now);
  pub.turn.seq++;
  const choice = resolveChoiceOptions(doc, uid, card);
  if (choice) {
    pub.turn.card = publicSpecialCard(card, choice.map(o => o.label));
    pub.turn.awaiting = 'choice'; pub.turn.deadline = ctx.now + pub.settings.answerSeconds * 1000;
    pub.phase = 'CARD_PENDING';
    return;
  }
  if (card.effect.op === 'goodDeed') {
    pub.turn.card = publicSpecialCard(card);
    pub.turn.awaiting = 'teacher'; pub.turn.deadline = null; pub.phase = 'RESOLVING';
    return;
  }
  pub.turn.card = publicSpecialCard(card);
  pub.phase = 'RESOLVING';
  const r = applyEffect(doc, uid, card.effect, ctx, card);
  finishSpecial(doc, uid, card, null, ctx, r.extraRoll);
}

/** การ์ดที่ให้ผู้เล่นเลือก (choice หรือ sameColor) → คืนรายการตัวเลือก */
function resolveChoiceOptions(doc: RoomDoc, uid: string, card: SpecialCard): { label: string; effect: Effect }[] | null {
  if (card.effect.op === 'choice') return card.effect.options;
  if (card.effect.op === 'sameColor') {
    const target = nextSameColor(doc, uid);
    if (target == null) return null;
    const pos = doc.public.players[uid].position;
    return [{ label: `ไปยังช่อง ${target} ที่มีสีเดียวกัน (เดินหน้า ${target - pos} ช่อง)`, effect: { op: 'move', steps: target - pos } }, { label: 'อยู่ที่ช่องเดิม', effect: { op: 'score', amount: 0 } }];
  }
  return null;
}

function nextSameColor(doc: RoomDoc, uid: string): number | null {
  const cells = doc.public.board.cells;
  const pos = doc.public.players[uid].position;
  const color = cells[pos]?.color;
  if (!color) return null;
  for (let i = pos + 1; i < cells.length - 1; i++) if (cells[i].color === color) return i;
  return null;
}

export function choose(doc: RoomDoc, uid: string, index: unknown, ctx: Ctx) {
  const pub = doc.public;
  assertPlaying(doc);
  if (pub.turn.playerId !== uid) fail('permission-denied', 'ยังไม่ถึงตาของคุณ');
  if (pub.phase !== 'CARD_PENDING' || pub.turn.awaiting !== 'choice' || !doc.secret.current) fail('failed-precondition', 'ไม่มีการ์ดที่รอการเลือก');
  const card = doc.secret.content.special[doc.secret.current.cardId];
  const opts = resolveChoiceOptions(doc, uid, card) || [];
  const i = Number(index);
  if (!Number.isInteger(i) || i < 0 || i >= opts.length) fail('invalid-argument', 'ตัวเลือกไม่ถูกต้อง');
  applyChoice(doc, uid, card, opts, i, ctx);
}

function applyChoice(doc: RoomDoc, uid: string, card: SpecialCard, opts: { label: string; effect: Effect }[], i: number, ctx: Ctx, auto = false) {
  const pub = doc.public;
  log(doc, 'choice', `${pub.players[uid].name} ${auto ? 'หมดเวลา ระบบเลือก' : 'เลือก'}: ${opts[i].label}`, uid, ctx.now);
  pub.phase = 'RESOLVING';
  const r = applyEffect(doc, uid, opts[i].effect, ctx, card);
  finishSpecial(doc, uid, card, opts[i].label, ctx, r.extraRoll);
}

function finishSpecial(doc: RoomDoc, uid: string, card: SpecialCard, chosen: string | null, ctx: Ctx, extraRoll?: boolean) {
  const pub = doc.public;
  doc.secret.history.push({ t: ctx.now, playerId: uid, playerName: pub.players[uid]?.name || '', cardId: card.id, kind: 'special', selection: chosen, verdict: 'applied', points: 0 });
  doc.secret.current = null;
  if (pub.turn.card) {
    pub.turn.card = { ...pub.turn.card, reveal: { selection: chosen } };
    pub.lastCard = { ...pub.turn.card, playerId: uid, seq: pub.turn.seq + 1 };
  }
  pub.turn.awaiting = null; pub.turn.deadline = null;
  if (pub.status !== 'PLAYING') return;
  pub.phase = 'TURN_COMPLETE';
  if (pub.settings.cardMovesTriggerCells && pub.turn.move && pub.turn.move.kind === 'card' && pub.turn.move.playerId === uid && pub.turn.move.seq === pub.turn.seq) {
    const t = pub.board.cells[pub.players[uid].position]?.type;
    if (t === 'WAVE' || t === 'LIGHTNING') return landOn(doc, uid, ctx);
  }
  completeTurn(doc, ctx, { extraRoll });
}

/** ประมวลผลของการ์ด (Backend เท่านั้น) */
export function applyEffect(doc: RoomDoc, uid: string, e: Effect, ctx: Ctx, card?: SpecialCard): { extraRoll?: boolean } {
  const pub = doc.public;
  const pl = pub.players[uid];
  const next = nextPlayerId(doc, uid);
  switch (e.op) {
    case 'score': {
      if (e.amount === 0) return {};
      pl.score = Math.max(0, pl.score + e.amount);
      log(doc, 'score', `${pl.name} ${e.amount > 0 ? 'ได้รับ' : 'เสีย'} ${Math.abs(e.amount)} คะแนน`, uid, ctx.now);
      return {};
    }
    case 'move': {
      moveBy(doc, uid, e.steps, 'card', ctx);
      log(doc, 'cardmove', `${pl.name} ${e.steps > 0 ? 'เดินหน้า' : 'ถอยหลัง'} ${Math.abs(e.steps)} ช่อง → ช่อง ${pl.position}`, uid, ctx.now);
      return {};
    }
    case 'skipTurn': {
      if (!pub.settings.skipTurnsEnabled) { log(doc, 'skipoff', 'ปิดการข้ามตาไว้ในการตั้งค่า', uid, ctx.now); return {}; }
      pl.skipTurns += e.turns;
      log(doc, 'skip', `${pl.name} ต้องพักการเดิน ${e.turns} ตา`, uid, ctx.now);
      return {};
    }
    case 'extraRoll': log(doc, 'extra', `${pl.name} ได้ทอยลูกเต๋าอีกครั้ง`, uid, ctx.now); return { extraRoll: true };
    case 'diceParity': {
      const d = rollDie(ctx);
      const steps = d % 2 === 1 ? -d : d;
      log(doc, 'reflect', `🎲 คลื่นสะท้อน: ทอยได้ ${d} (${d % 2 ? 'คี่ ถอยหลัง' : 'คู่ เดินหน้า'} ${d} ช่อง)`, uid, ctx.now);
      moveBy(doc, uid, steps, 'card', ctx, [d]);
      return {};
    }
    case 'echo': {
      const back = rollDie(ctx), fwd = rollDie(ctx);
      log(doc, 'echo', `🎲 คลื่นเสียงก้อง: ถอยหลัง ${back} แล้วเดินหน้า ${fwd} (สุทธิ ${fwd - back >= 0 ? '+' : ''}${fwd - back} ช่อง)`, uid, ctx.now);
      const from = pl.position;
      const mid = Math.max(0, from - back);
      const fin = finishIndex(pub.board);
      const to = Math.min(fin, mid + fwd);
      const path: number[] = [];
      for (let i = from - 1; i >= mid; i--) path.push(i);
      for (let i = mid + 1; i <= to; i++) path.push(i);
      pl.position = to; pub.turn.seq++;
      pub.turn.move = { seq: pub.turn.seq, playerId: uid, from, to, path, kind: 'card', dice: [back, fwd] };
      if (to === fin && from !== fin) { log(doc, 'finish', `🏁 ${pl.name} ถึงเส้นชัย!`, uid, ctx.now); endGame(doc, 'finish', ctx, uid); }
      return {};
    }
    case 'sameColor': return {};   // handled as a choice
    case 'nextAnswerMultiplier': pl.nextAnswerMultiplier = Math.max(pl.nextAnswerMultiplier, e.factor); log(doc, 'energy', `${pl.name} จะได้คะแนน ×${e.factor} เมื่อตอบถูกครั้งถัดไป`, uid, ctx.now); return {};
    case 'forceNextOpponentWrong': {
      if (!next) return {};
      pub.players[next].forcedWrong = true;
      log(doc, 'interference', `${pub.players[next].name} จะถูกนับว่าตอบผิดในการตอบครั้งถัดไป`, uid, ctx.now);
      return {};
    }
    case 'transferToNext': {
      if (!next) return {};
      const amt = Math.min(e.amount, pl.score);
      pl.score -= amt; pub.players[next].score += amt;
      log(doc, 'absorb', `${pl.name} ส่ง ${amt} คะแนนให้ ${pub.players[next].name}`, uid, ctx.now);
      return {};
    }
    case 'teamworkNextSituation':
      pub.teamworkNext = { by: uid, penaltyMultiplier: e.penaltyMultiplier };
      log(doc, 'teamwork', 'ทุกกลุ่มต้องช่วยกันตอบการ์ดสถานการณ์ใบถัดไป ถ้าตอบผิดหักคะแนน ' + e.penaltyMultiplier + ' เท่า', uid, ctx.now);
      return {};
    case 'goodDeed': pl.score += e.reward; log(doc, 'gooddeed', `🌟 ภารกิจทำความดีสำเร็จ ${pl.name} +${e.reward} คะแนน`, uid, ctx.now); return {};
    case 'combo': { let extra = false; for (const f of e.effects) { if (pub.status !== 'PLAYING') break; extra = !!applyEffect(doc, uid, f, ctx, card).extraRoll || extra; } return { extraRoll: extra }; }
    case 'choice': return {};
  }
  return {};
}

/* =========================================================
   Teacher decisions
   ========================================================= */
export function teacherJudge(doc: RoomDoc, decision: unknown, ctx: Ctx) {
  const pub = doc.public;
  assertPlaying(doc);
  if (pub.phase !== 'RESOLVING' || pub.turn.awaiting !== 'teacher' || !doc.secret.current) fail('failed-precondition', 'ไม่มีรายการที่รอครูตัดสิน');
  const uid = pub.turn.playerId!;
  if (doc.secret.current.deck === 'special') {
    const card = doc.secret.content.special[doc.secret.current.cardId];
    const approved = decision === 'approve' || decision === 'full';
    if (approved) applyEffect(doc, uid, card.effect, ctx, card);
    else log(doc, 'gooddeed', `ภารกิจทำความดียังไม่ผ่าน`, uid, ctx.now);
    return finishSpecial(doc, uid, card, approved ? 'ครูยืนยัน' : 'ครูไม่ยืนยัน', ctx);
  }
  if (decision !== 'full' && decision !== 'partial' && decision !== 'wrong') fail('invalid-argument', 'ผลการตัดสินไม่ถูกต้อง');
  const card = waveCardById(doc, doc.secret.current.cardId)!;
  resolveWave(doc, uid, card, pub.turn.pendingSelection ?? null, decision as Verdict, ctx, { byTeacher: true });
}

/** เรียกได้ทุกเมื่อ: ถ้าเลยเวลา ระบบตัดสินตามกติกา (คำตอบ = ผิด, การเลือก = ตัวเลือกแรก, หมดเวลาเกม = จบ) */
export function timeout(doc: RoomDoc, ctx: Ctx): boolean {
  const pub = doc.public;
  if (pub.status !== 'PLAYING') return false;
  if (pub.endsAt && ctx.now >= pub.endsAt) { endGame(doc, 'timeLimit', ctx); return true; }
  if (!pub.turn.deadline || ctx.now < pub.turn.deadline) return false;
  const uid = pub.turn.playerId!;
  if (pub.turn.awaiting === 'answer' && doc.secret.current) {
    const card = waveCardById(doc, doc.secret.current.cardId)!;
    resolveWave(doc, uid, card, null, 'wrong', ctx, { timeout: true });
    return true;
  }
  if (pub.turn.awaiting === 'choice' && doc.secret.current) {
    const card = doc.secret.content.special[doc.secret.current.cardId];
    const opts = resolveChoiceOptions(doc, uid, card) || [];
    if (opts.length) applyChoice(doc, uid, card, opts, 0, ctx, true);
    return true;
  }
  return false;
}

export function teacherSkipTurn(doc: RoomDoc, ctx: Ctx) {
  assertPlaying(doc);
  const uid = doc.public.turn.playerId;
  if (doc.secret.current && doc.public.turn.awaiting === 'answer') {
    const card = waveCardById(doc, doc.secret.current.cardId)!;
    log(doc, 'teacher', 'ครูข้ามคำถามนี้', uid, ctx.now);
    doc.secret.current = null; doc.public.turn.card = { ...(doc.public.turn.card as PublicCard), reveal: { answers: card.kind === 'situation' ? card.answers : undefined, answer: card.kind === 'question' ? card.answer : undefined, explanation: card.explanation, verdict: undefined } };
  } else log(doc, 'teacher', 'ครูข้ามตานี้', uid, ctx.now);
  doc.secret.current = null;
  completeTurn(doc, ctx);
}

export function adjustScore(doc: RoomDoc, uid: string, delta: unknown, ctx: Ctx) {
  const pl = doc.public.players[uid];
  if (!pl || pl.removed) fail('not-found', 'ไม่พบผู้เล่น');
  const d = Math.round(Number(delta));
  if (!Number.isFinite(d) || d === 0 || Math.abs(d) > 100) fail('invalid-argument', 'ปรับคะแนนได้ครั้งละ ±1–100');
  pl.score = Math.max(0, pl.score + d);
  log(doc, 'teacher', `ครูปรับคะแนน ${pl.name} ${d > 0 ? '+' : ''}${d}`, uid, ctx.now);
  doc.public.turn.seq++;
}

export function pauseGame(doc: RoomDoc, ctx: Ctx) {
  if (doc.public.status !== 'PLAYING') fail('failed-precondition', 'เกมไม่ได้กำลังเล่นอยู่');
  doc.public.status = 'PAUSED'; doc.public.pausedAt = ctx.now;
  log(doc, 'pause', '⏸ ครูหยุดเกมชั่วคราว', null, ctx.now);
}
export function resumeGame(doc: RoomDoc, ctx: Ctx) {
  const pub = doc.public;
  if (pub.status !== 'PAUSED') fail('failed-precondition', 'เกมไม่ได้หยุดอยู่');
  const paused = ctx.now - (pub.pausedAt || ctx.now);
  if (pub.endsAt) pub.endsAt += paused;
  if (pub.turn.deadline) pub.turn.deadline += paused;
  pub.status = 'PLAYING'; pub.pausedAt = null;
  log(doc, 'resume', '▶ เล่นต่อ', null, ctx.now);
}

/* =========================================================
   Turn flow
   ========================================================= */
function beginTurn(doc: RoomDoc, _ctx: Ctx) {
  const pub = doc.public;
  const uid = pub.order[pub.turnIndex];
  pub.turn = { playerId: uid, seq: (pub.turn?.seq || 0) + 1, dice: null, move: pub.turn?.move || null, card: null, awaiting: 'roll', deadline: null, pendingSelection: null, suggestedVerdict: null };
  pub.phase = 'ROLLING';
}

function completeTurn(doc: RoomDoc, ctx: Ctx, o: { extraRoll?: boolean } = {}) {
  const pub = doc.public;
  if (pub.status !== 'PLAYING') return;
  pub.phase = 'TURN_COMPLETE';
  if (o.extraRoll) {
    log(doc, 'extra', `🎲 ${pub.players[pub.turn.playerId!].name} ได้ทอยอีกครั้ง`, pub.turn.playerId, ctx.now);
    pub.turn.awaiting = 'roll'; pub.turn.seq++; pub.phase = 'ROLLING';
    return;
  }
  nextTurn(doc, ctx);
}

function nextTurn(doc: RoomDoc, ctx: Ctx) {
  const pub = doc.public;
  if (pub.endsAt && ctx.now >= pub.endsAt) return endGame(doc, 'timeLimit', ctx);
  const n = pub.order.length;
  if (!n) return endGame(doc, 'noPlayers', ctx);
  for (let guard = 0; guard < n * 6 + 2; guard++) {
    pub.turnIndex = (pub.turnIndex + 1) % n;
    if (pub.turnIndex === 0) {
      pub.round++;
      if (pub.settings.maxRounds > 0 && pub.round > pub.settings.maxRounds) { pub.round--; return endGame(doc, 'maxRounds', ctx); }
    }
    const pl = pub.players[pub.order[pub.turnIndex]];
    if (pl.skipTurns > 0) { pl.skipTurns--; log(doc, 'skipped', `⏭ ${pl.name} พักการเดิน 1 ตา`, pl.id, ctx.now); continue; }
    beginTurn(doc, ctx);
    return;
  }
  beginTurn(doc, ctx);
}

export function endGame(doc: RoomDoc, reason: 'finish' | 'timeLimit' | 'maxRounds' | 'teacher' | 'noPlayers', ctx: Ctx, finisher?: string) {
  const pub = doc.public;
  if (pub.status === 'FINISHED') return;
  pub.status = 'FINISHED'; pub.phase = 'FINISHED'; pub.finishedAt = ctx.now; pub.endReason = reason;
  pub.turn.awaiting = null; pub.turn.deadline = null;
  doc.secret.current = null;
  pub.results = computeResults(doc, finisher);
  const w = pub.results.filter(r => r.winner).map(r => r.name).join(', ');
  const why = { finish: 'มีกลุ่มถึงเส้นชัย', timeLimit: 'หมดเวลา', maxRounds: 'ครบจำนวนรอบ', teacher: 'ครูจบเกม', noPlayers: 'ไม่มีผู้เล่น' }[reason];
  log(doc, 'end', `🏆 จบเกม (${why}) ผู้ชนะ: ${w || '-'}`, null, ctx.now);
}

export function computeResults(doc: RoomDoc, finisher?: string): GameResultRow[] {
  const pub = doc.public;
  const ps = Object.values(pub.players).filter(p => !p.removed);
  const firstWins = pub.settings.winCondition === 'firstToFinish' && finisher;
  const sorted = ps.sort((a, b) => {
    if (firstWins) { if (a.id === finisher) return -1; if (b.id === finisher) return 1; }
    return b.score - a.score || b.position - a.position || b.stats.correct - a.stats.correct || a.joinedAt - b.joinedAt;
  });
  const top = sorted[0];
  const rows: GameResultRow[] = [];
  sorted.forEach((p, i) => {
    const prev = rows[i - 1];
    const sameAsPrev = prev && !firstWins && prev.score === p.score && prev.position === p.position;
    const rank = sameAsPrev ? prev.rank : i + 1;
    const winner = firstWins ? p.id === finisher : !!top && rank === 1;
    const row: GameResultRow = { rank, playerId: p.id, name: p.name, score: p.score, position: p.position, correct: p.stats.correct, partial: p.stats.partial, wrong: p.stats.wrong, cards: p.stats.cards, winner: !!winner };
    if (p.captain) row.captain = p.captain;
    rows.push(row);
  });
  return rows;
}

/* =========================================================
   Utilities
   ========================================================= */
function assertPlaying(doc: RoomDoc) {
  if (doc.public.status === 'PAUSED') fail('failed-precondition', 'เกมหยุดชั่วคราว');
  if (doc.public.status !== 'PLAYING') fail('failed-precondition', 'เกมไม่ได้กำลังเล่นอยู่');
}

export function nextPlayerId(doc: RoomDoc, uid: string): string | null {
  const o = doc.public.order;
  if (o.length < 2) return null;
  const i = o.indexOf(uid);
  return o[(i + 1) % o.length];
}

export function shuffle<T>(a: T[], ctx: Ctx): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(ctx.rng() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
  return r;
}

export function log(doc: RoomDoc, type: string, text: string, playerId: string | null | undefined, t: number) {
  const pub = doc.public;
  pub.log = pub.log || {};
  pub.version = (pub.version || 0) + 1;
  const seq = pub.version;
  const key = 'e' + String(seq).padStart(7, '0');
  const entry: LogEntry = { seq, t, type, text, playerId: playerId ?? null };
  pub.log[key] = entry;
  const keys = Object.keys(pub.log).sort();
  for (let i = 0; i < keys.length - MAX_LOG; i++) delete pub.log[keys[i]];
}

/** ป้องกันคำสั่งซ้ำ (idempotency key) — คืน false ถ้าเคยประมวลผลแล้ว */
export function markRequest(doc: RoomDoc, requestId: string, now: number): boolean {
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(requestId)) fail('invalid-argument', 'requestId ไม่ถูกต้อง');
  const pr = doc.secret.processed = doc.secret.processed || {};
  if (pr[requestId]) return false;
  pr[requestId] = now;
  const keys = Object.keys(pr);
  if (keys.length > MAX_PROCESSED) keys.sort((a, b) => pr[a] - pr[b]).slice(0, keys.length - MAX_PROCESSED).forEach(k => delete pr[k]);
  return true;
}

/** RTDB ไม่เก็บ array ว่าง/undefined — เติมโครงสร้างที่หายไปหลังอ่านจากฐานข้อมูล */
export function normalizeDoc(raw: RoomDoc): RoomDoc {
  const d = raw;
  d.members = d.members || {};
  const p = d.public;
  p.players = p.players || {};
  Object.values(p.players).forEach(pl => { pl.stats = pl.stats || { correct: 0, partial: 0, wrong: 0, cards: 0, specials: 0 }; pl.skipTurns = pl.skipTurns || 0; pl.nextAnswerMultiplier = pl.nextAnswerMultiplier || 1; pl.forcedWrong = !!pl.forcedWrong; });
  p.order = p.order || [];
  p.log = p.log || {};
  p.turn = p.turn || { playerId: null, seq: 0, awaiting: null };
  p.board.cells = p.board.cells || [];
  if (p.turn.move) p.turn.move.path = p.turn.move.path || [];
  if (p.turn.card?.reveal?.answers) p.turn.card.reveal.answers = p.turn.card.reveal.answers.map(a => a || []);
  const s = d.secret;
  s.content = s.content || { situation: {}, question: {}, special: {} };
  s.content.situation = s.content.situation || {}; s.content.question = s.content.question || {}; s.content.special = s.content.special || {};
  s.decks = s.decks || { wave: [], special: [] };
  s.decks.wave = s.decks.wave || []; s.decks.special = s.decks.special || [];
  s.history = s.history || [];
  s.processed = s.processed || {};
  return d;
}

export type { SituationCard, QuestionCard };
