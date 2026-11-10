/* =========================================================
   Host Runtime — "เซิร์ฟเวอร์ของเกม" ที่ทำงานบนเครื่องครู (Firebase แพ็กเกจฟรี Spark)
   ---------------------------------------------------------
   • นักเรียนส่งได้เฉพาะ "คำสั่ง" ลง inbox/{room}/{uid}/{requestId} (Security Rules บังคับ uid ตัวเอง)
   • เครื่องครู (Host) อ่านคำสั่ง → ตัดสินด้วย Game Engine ใน transaction → เขียนสถานะเกม + คำตอบกลับ
   • ลูกเต๋าสุ่มด้วย crypto บนเครื่องครู · เฉลยอยู่ใน rooms/{id}/secret ซึ่งอ่านได้เฉพาะครู
   • ทุกคำสั่งมี requestId → ประมวลผลซ้ำไม่ได้ (เปิดหลายแท็บก็ไม่ได้คะแนนซ้ำ)
   ไฟล์นี้ไม่พึ่ง React เพื่อให้ทดสอบกับ Firebase Emulator ได้โดยตรง
   ========================================================= */
import { get, onValue, push, ref, runTransaction, set, update, type Database } from 'firebase/database';
import * as E from '../../shared/engine';
import { applyHostAction, applyPlayerCommand, nextDeadline, PLAYER_COMMANDS, str, type HostAction, type PlayerCommand, type StudentLink } from '../../shared/commands';
import { DEFAULT_BOARD, validateBoard } from '../../shared/board.config';
import { sanitizeContent } from '../../shared/content';
import { sanitizeSettings, CODE_ALPHABET } from '../../shared/rules.config';
import type { AnswerRecord, BoardConfig, ContentBundle, GameSettings, RoomDoc } from '../../shared/types';

const clean = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
const randU32 = () => globalThis.crypto.getRandomValues(new Uint32Array(1))[0];
const randomId = (n: number) => Array.from({ length: n }, () => 'abcdefghijklmnopqrstuvwxyz0123456789'[randU32() % 36]).join('');

export class HostError extends Error { constructor(public code: string, message: string) { super(message); } }

/** ความต่างเวลาเครื่องครูกับเซิร์ฟเวอร์ Firebase — ใช้เวลาเซิร์ฟเวอร์ตัดสินการหมดเวลา */
const offsets = new WeakMap<Database, number>();
function watchOffset(db: Database) {
  if (offsets.has(db)) return;
  offsets.set(db, 0);
  onValue(ref(db, '.info/serverTimeOffset'), s => offsets.set(db, Number(s.val()) || 0));
}
export const hostCtx = (db: Database): E.Ctx => ({ now: Date.now() + (offsets.get(db) || 0), rng: () => randU32() / 0x100000000 });

/** คืนค่านี้จากฟังก์ชันใน mutateRoom เพื่อยกเลิกโดยไม่เขียนข้อมูล */
export const NO_CHANGE = Symbol('NO_CHANGE');

interface Mutation<R> { result: R; duplicate: boolean; doc: RoomDoc | null; newHistory: AnswerRecord[]; finishedNow: boolean }

/** แก้ไขห้องแบบ atomic: อ่าน → Game Engine → เขียนกลับ (Firebase retry ให้อัตโนมัติเมื่อมีการแก้ชนกัน) */
export async function mutateRoom<R>(db: Database, roomId: string, requestId: string | null, fn: (doc: RoomDoc, ctx: E.Ctx) => R): Promise<Mutation<R>> {
  watchOffset(db);
  let out: Mutation<R> = { result: undefined as R, duplicate: false, doc: null, newHistory: [], finishedNow: false };
  let error: unknown = null;
  const tx = await runTransaction(ref(db, `rooms/${roomId}`), (raw: RoomDoc | null) => {
    if (raw === null) return raw;                          // ยังไม่มีข้อมูลในเครื่อง → Firebase จะเรียกซ้ำด้วยข้อมูลจริง
    error = null;
    const doc = E.normalizeDoc(raw);
    const histLen = doc.secret.history.length;
    const wasFinished = doc.public.status === 'FINISHED';
    const ctx = hostCtx(db);
    try {
      if (requestId && !E.markRequest(doc, requestId, ctx.now)) { out = { ...out, duplicate: true, doc }; return; }
      const result = fn(doc, ctx);
      if ((result as unknown) === NO_CHANGE) { out = { ...out, doc: null }; return; }
      out = { result, duplicate: false, doc, newHistory: doc.secret.history.slice(histLen), finishedNow: !wasFinished && doc.public.status === 'FINISHED' };
      return clean(doc);
    } catch (e) { error = e; return; }
  }, { applyLocally: false });
  if (error) throw error;
  if (!tx.snapshot.exists()) throw new HostError('not-found', 'ไม่พบห้องนี้');
  if (tx.committed && out.doc && !out.duplicate) await afterCommit(db, roomId, out);
  return out;
}

/** หลังบันทึกสำเร็จ: เก็บคำตอบรายข้อและผลการแข่งขันสำหรับ Teacher Dashboard */
async function afterCommit<R>(db: Database, roomId: string, m: Mutation<R>) {
  const doc = m.doc!;
  const up: Record<string, unknown> = {};
  m.newHistory.forEach(h => { up[`roomAnswers/${roomId}/${push(ref(db, `roomAnswers/${roomId}`)).key}`] = clean(h); });
  up[`teacherRooms/${doc.public.hostUid}/${roomId}/status`] = doc.public.status;
  up[`teacherRooms/${doc.public.hostUid}/${roomId}/players`] = Object.values(doc.public.players).filter(p => !p.removed).length;
  if (m.finishedNow) {
    up[`results/${roomId}`] = clean({ roomId, code: doc.public.code, name: doc.public.name, hostUid: doc.public.hostUid, startedAt: doc.public.startedAt, finishedAt: doc.public.finishedAt, endReason: doc.public.endReason, results: doc.public.results });
  }
  await update(ref(db), up);
}

/* =========================================================
   สร้างห้อง (ครู)
   ========================================================= */
async function claimCode(db: Database, roomId: string): Promise<string> {
  for (let i = 0; i < 20; i++) {
    let c = '';
    for (let k = 0; k < 6; k++) c += CODE_ALPHABET[randU32() % CODE_ALPHABET.length];
    if ((await get(ref(db, `roomCodes/${c}`))).exists()) continue;      // รหัสซ้ำ → สุ่มใหม่
    try { await set(ref(db, `roomCodes/${c}`), roomId); return c; }      // Rules: เขียนได้เฉพาะครู และรหัสที่ยังไม่มีคนใช้
    catch (e) { if (i > 2) throw new HostError('permission-denied', 'บัญชีนี้ไม่มีสิทธิ์สร้างห้อง (อีเมลยังไม่อยู่ในรายชื่อครู)'); void e; }
  }
  throw new HostError('resource-exhausted', 'สร้างรหัสห้องไม่สำเร็จ กรุณาลองใหม่');
}

/** โหลดคลังการ์ด/คำถามของครูจากฐานข้อมูล (มีเฉลย — ครูเท่านั้นที่อ่านได้) */
export async function loadRoomContent(db: Database): Promise<ContentBundle> {
  const s = await get(ref(db, 'content'));
  const raw = (s.val() || {}) as Partial<ContentBundle>;
  const content = sanitizeContent({ situation: raw.situation || {}, question: raw.question || {}, special: raw.special || {} }).content;
  if (!Object.keys(content.situation).length && !Object.keys(content.question).length)
    throw new HostError('failed-precondition', 'ยังไม่มีคลังการ์ดและคำถามในฐานข้อมูล — ไปที่ Teacher Dashboard → “นำเข้าชุดเริ่มต้น” ก่อนสร้างห้อง');
  return content;
}

export async function createRoom(db: Database, host: { uid: string; name: string }, name: string, settings: Partial<GameSettings>, content?: ContentBundle) {
  const [c, boardSnap] = await Promise.all([content ? Promise.resolve(content) : loadRoomContent(db), get(ref(db, 'config/board'))]);
  let board: BoardConfig = DEFAULT_BOARD;
  if (boardSnap.exists() && validateBoard(boardSnap.val() as BoardConfig).ok) board = boardSnap.val() as BoardConfig;
  const roomId = 'R' + Date.now().toString(36) + randomId(10);
  const code = await claimCode(db, roomId);
  const roomName = str(name, 60) || 'ห้องผจญภัยในโลกคลื่น';
  const doc = E.createRoomDoc({ id: roomId, code, name: roomName, hostUid: host.uid, hostName: str(host.name, 60) || 'ครู', settings: sanitizeSettings(settings), board, content: c, now: hostCtx(db).now });
  await set(ref(db, `rooms/${roomId}`), clean(doc));
  await set(ref(db, `teacherRooms/${host.uid}/${roomId}`), { name: roomName, code, createdAt: doc.public.createdAt, status: 'WAITING', players: 0 });
  return { roomId, code };
}

/** สร้างห้องใหม่ด้วยกติกาและคลังเดิม แล้วแจ้งผู้เล่นในห้องเก่า */
export async function rematch(db: Database, hostUid: string, roomId: string) {
  const s = await get(ref(db, `rooms/${roomId}`));
  if (!s.exists()) throw new HostError('not-found', 'ไม่พบห้อง');
  const old = E.normalizeDoc(s.val() as RoomDoc);
  if (old.public.hostUid !== hostUid) throw new HostError('permission-denied', 'เฉพาะครูผู้สร้างห้อง');
  const r = await createRoom(db, { uid: hostUid, name: old.public.hostName }, old.public.name, old.public.settings, sanitizeContent(old.secret.content).content);
  await set(ref(db, `rooms/${roomId}/public/rematch`), { roomId: r.roomId, code: r.code });
  return r;
}

/** คำสั่งของครูจากหน้าควบคุมเกม */
export async function hostAction(db: Database, hostUid: string, roomId: string, action: HostAction, requestId: string, extra: Record<string, unknown> = {}) {
  const m = await mutateRoom(db, roomId, requestId, (doc, ctx) => {
    if (doc.public.hostUid !== hostUid) throw new HostError('permission-denied', 'เฉพาะครูผู้สร้างห้อง');
    return applyHostAction(doc, action, extra, ctx);
  });
  return { ok: true, duplicate: m.duplicate };
}

/* =========================================================
   วงรอบของ Host: รับคำสั่งนักเรียน + ตรวจหมดเวลา
   ========================================================= */
type Inbox = Record<string, Record<string, PlayerCommand>>;
const REQ_ID = /^r[A-Za-z0-9]{8,40}$/;

export interface HostHandle { stop: () => void; idle: () => Promise<void> }

export function startHost(db: Database, roomId: string, hostUid: string, onError: (e: unknown) => void = () => {}): HostHandle {
  watchOffset(db);
  const inFlight = new Set<string>();
  let queue: Promise<void> = Promise.resolve();
  let latest: RoomDoc | null = null;
  let checking = false;
  let stopped = false;
  const enqueue = (job: () => Promise<void>) => { queue = queue.then(job).catch(onError); return queue; };

  async function processCommand(uid: string, requestId: string, cmd: PlayerCommand) {
    let reply: Record<string, unknown>;
    try {
      if (!REQ_ID.test(requestId) || !PLAYER_COMMANDS.includes(cmd?.t)) throw new HostError('invalid-argument', 'คำสั่งไม่ถูกต้อง');
      let link: StudentLink | null = null;
      if (cmd.t === 'join') {
        const ls = await get(ref(db, `studentLinks/${uid}`));
        const v = ls.val() as StudentLink | null;
        if (v && typeof v.sid === 'string' && v.sid) link = { sid: str(v.sid, 20), name: str(v.name, 60), classroom: str(v.classroom, 20) };
      }
      const m = await mutateRoom(db, roomId, requestId, (doc, ctx) => {
        if (cmd.t !== 'join' && !doc.members[uid]) throw new HostError('permission-denied', 'คุณไม่ได้อยู่ในห้องนี้');
        return applyPlayerCommand(doc, uid, cmd, ctx, link);
      });
      reply = { ok: true, duplicate: m.duplicate, ...(m.result || {}) };
    } catch (e) {
      const err = e as { code?: string; message?: string };
      const known = e instanceof E.EngineError || e instanceof HostError;
      if (!known) onError(e);
      reply = { ok: false, code: known ? err.code : 'internal', error: known ? err.message : 'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่' };
    }
    await update(ref(db), { [`replies/${roomId}/${uid}/${requestId}`]: clean({ ...reply, at: Date.now() }), [`inbox/${roomId}/${uid}/${requestId}`]: null });
  }

  const offInbox = onValue(ref(db, `inbox/${roomId}`), s => {
    const all = (s.val() || {}) as Inbox;
    const items: { uid: string; id: string; cmd: PlayerCommand; at: number }[] = [];
    Object.entries(all).forEach(([uid, reqs]) => Object.entries(reqs || {}).forEach(([id, cmd]) => {
      const key = uid + '/' + id;
      if (!inFlight.has(key)) items.push({ uid, id, cmd, at: Number(cmd?.at) || 0 });
    }));
    items.sort((a, b) => a.at - b.at).forEach(it => {
      const key = it.uid + '/' + it.id;
      inFlight.add(key);
      enqueue(() => processCommand(it.uid, it.id, it.cmd)).finally(() => inFlight.delete(key));   // inbox ถูกลบไปพร้อมคำตอบแล้ว · คำสั่งซ้ำกันด้วย requestId (markRequest)
    });
  }, onError);

  // ตรวจหมดเวลาตอบ / หมดเวลาเกม ตามเวลาเซิร์ฟเวอร์ (ตรวจทุก 1 วินาที ไม่มีการเขียนถ้ายังไม่หมดเวลา)
  const offRoom = onValue(ref(db, `rooms/${roomId}`), s => { latest = s.val() as RoomDoc | null; }, onError);
  const tick = setInterval(() => {
    if (stopped || checking || !latest || latest.public?.hostUid !== hostUid) return;
    const dl = nextDeadline(latest);
    if (dl == null || hostCtx(db).now < dl + 250) return;
    checking = true;
    enqueue(async () => { await mutateRoom(db, roomId, null, (d, ctx) => (E.timeout(d, ctx) ? true : NO_CHANGE)); }).finally(() => { checking = false; });
  }, 1000);

  return {
    stop() { stopped = true; offInbox(); offRoom(); clearInterval(tick); },
    idle: () => queue
  };
}
