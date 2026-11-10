/* =========================================================
   WAVE ADVENTURE ONLINE — Cloud Functions (server-authoritative)
   ---------------------------------------------------------
   ทุกการตัดสินใจของเกม (ลูกเต๋า ตำแหน่ง การ์ด คะแนน เปลี่ยนตา ผู้ชนะ) เกิดที่นี่
   ภายใน Realtime Database transaction เพื่อป้องกัน race condition
   Client ส่งได้เฉพาะ "คำสั่ง" + requestId (กันการกดซ้ำ) และไม่มีสิทธิ์เขียนสถานะเกม
   ========================================================= */
import { onCall, HttpsError, type CallableRequest } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2';
import { defineString } from 'firebase-functions/params';
import { initializeApp } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import { getAuth } from 'firebase-admin/auth';
import { randomInt, randomUUID } from 'node:crypto';

import * as E from '../../shared/engine';
import { DEFAULT_BOARD, validateBoard } from '../../shared/board.config';
import { defaultContent, sanitizeContent } from '../../shared/content';
import { sanitizeSettings, AVATARS, TOKEN_COLORS, CODE_ALPHABET } from '../../shared/rules.config';
import type { BoardConfig, ContentBundle, RoomDoc, AnswerRecord } from '../../shared/types';

// ใน Emulator ให้ใช้ instance ชื่อเดียวกับ production (<project>-default-rtdb) เพื่อให้ Security Rules มีผล
initializeApp(process.env.FUNCTIONS_EMULATOR === 'true' ? { databaseURL: `https://${process.env.GCLOUD_PROJECT}-default-rtdb.firebaseio.com` } : undefined);
setGlobalOptions({ region: 'asia-southeast1', maxInstances: 20 });

/** อีเมลครูที่มีสิทธิ์ (คั่นด้วยจุลภาค) — ตั้งค่าตอน deploy */
const TEACHER_EMAILS = defineString('TEACHER_EMAILS', { default: '', description: 'อีเมลครูที่มีสิทธิ์สร้างห้องและจัดการคลัง คั่นด้วยจุลภาค' });
/** URL เว็บแอป Apps Script ของระบบห้องเรียนออนไลน์ (ใช้ตรวจเลขประจำตัว + PIN) */
const SCHOOL_API_URL = defineString('SCHOOL_API_URL', { default: '', description: 'URL /exec ของ Apps Script (เว้นว่าง = ไม่ใช้การเข้าสู่ระบบด้วยเลขประจำตัว)' });

const db = () => getDatabase();
const ctx = (): E.Ctx => ({ now: Date.now(), rng: () => randomInt(0, 0x100000000) / 0x100000000 });
const clean = <T>(v: T): T => JSON.parse(JSON.stringify(v));
const ROOM_ID = /^[A-Za-z0-9_-]{6,40}$/;
const REQ_ID = /^[A-Za-z0-9_-]{8,64}$/;

/* ---------------- helpers ---------------- */
type Req = CallableRequest<Record<string, unknown>>;
const httpsCode = { 'failed-precondition': 'failed-precondition', 'permission-denied': 'permission-denied', 'invalid-argument': 'invalid-argument', 'not-found': 'not-found', 'resource-exhausted': 'resource-exhausted' } as const;

function callable<T>(fn: (req: Req, uid: string) => Promise<T>) {
  return onCall({ cors: true }, async (req: Req) => {
    if (!req.auth) throw new HttpsError('unauthenticated', 'กรุณาเข้าสู่ระบบก่อน');
    try { return await fn(req, req.auth.uid); }
    catch (e) {
      if (e instanceof HttpsError) throw e;
      if (e instanceof E.EngineError) throw new HttpsError(httpsCode[e.code], e.message);
      console.error(e);
      throw new HttpsError('internal', 'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่');
    }
  });
}

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f<>]/g, '').trim().slice(0, max) : '');
const isTeacher = (req: Req) => req.auth?.token?.teacher === true;
function requireTeacher(req: Req) { if (!isTeacher(req)) throw new HttpsError('permission-denied', 'เฉพาะครูเท่านั้น'); }
function roomIdOf(req: Req) { const r = req.data?.roomId; if (typeof r !== 'string' || !ROOM_ID.test(r)) throw new HttpsError('invalid-argument', 'roomId ไม่ถูกต้อง'); return r; }
function requestIdOf(req: Req) { const r = req.data?.requestId; if (typeof r !== 'string' || !REQ_ID.test(r)) throw new HttpsError('invalid-argument', 'ต้องมี requestId'); return r; }

/** จำกัดความถี่การเรียก (ต่อผู้ใช้ ต่อคำสั่ง) */
async function rateLimit(uid: string, action: string, max: number, windowMs: number) {
  const now = Date.now();
  let blocked = false;
  await db().ref(`rateLimits/${uid}/${action}`).transaction((cur: { start: number; count: number } | null) => {
    if (!cur || now - cur.start > windowMs) { blocked = false; return { start: now, count: 1 }; }
    if (cur.count >= max) { blocked = true; return; }
    blocked = false;
    return { start: cur.start, count: cur.count + 1 };
  });
  if (blocked) throw new HttpsError('resource-exhausted', 'ทำรายการถี่เกินไป กรุณารอสักครู่');
}

interface Mutation<R> { result: R; duplicate: boolean; doc: RoomDoc | null; newHistory: AnswerRecord[]; finishedNow: boolean; }

/** แก้ไขห้องแบบ atomic: อ่าน → ประมวลผลด้วย Game Engine → เขียนกลับ (retry อัตโนมัติเมื่อชนกัน) */
async function mutateRoom<R>(roomId: string, requestId: string | null, fn: (doc: RoomDoc) => R): Promise<Mutation<R>> {
  let out: Mutation<R> = { result: undefined as R, duplicate: false, doc: null, newHistory: [], finishedNow: false };
  let error: unknown = null;
  const tx = await db().ref(`rooms/${roomId}`).transaction((raw: RoomDoc | null) => {
    if (raw === null) return raw;                         // cache miss → RTDB จะเรียกซ้ำด้วยข้อมูลจริง
    error = null;
    const doc = E.normalizeDoc(raw);
    const histLen = doc.secret.history.length;
    const wasFinished = doc.public.status === 'FINISHED';
    try {
      if (requestId && !E.markRequest(doc, requestId, Date.now())) { out = { ...out, duplicate: true, doc }; return; }
      const result = fn(doc);
      out = { result, duplicate: false, doc, newHistory: doc.secret.history.slice(histLen), finishedNow: !wasFinished && doc.public.status === 'FINISHED' };
      return clean(doc);
    } catch (e) { error = e; return; }
  }, undefined, false);
  if (error) throw error;
  if (!tx.snapshot.exists()) throw new HttpsError('not-found', 'ไม่พบห้องนี้');
  if (tx.committed && out.doc) await afterCommit(roomId, out);
  return out;
}

/** งานต่อเนื่องหลังบันทึกสำเร็จ: บันทึกคำตอบรายข้อ และผลการแข่งขันสำหรับครู */
async function afterCommit<R>(roomId: string, m: Mutation<R>) {
  const doc = m.doc!;
  const updates: Record<string, unknown> = {};
  m.newHistory.forEach(h => { updates[`roomAnswers/${roomId}/${db().ref().push().key}`] = clean(h); });
  updates[`teacherRooms/${doc.public.hostUid}/${roomId}/status`] = doc.public.status;
  updates[`teacherRooms/${doc.public.hostUid}/${roomId}/players`] = Object.values(doc.public.players).filter(p => !p.removed).length;
  if (m.finishedNow) {
    updates[`results/${roomId}`] = clean({ roomId, code: doc.public.code, name: doc.public.name, hostUid: doc.public.hostUid, startedAt: doc.public.startedAt, finishedAt: doc.public.finishedAt, endReason: doc.public.endReason, results: doc.public.results });
  }
  await db().ref().update(updates);
}

async function loadRoomHost(roomId: string) {
  const s = await db().ref(`rooms/${roomId}/public/hostUid`).get();
  if (!s.exists()) throw new HttpsError('not-found', 'ไม่พบห้องนี้');
  return s.val() as string;
}

/* =========================================================
   Auth & roles
   ========================================================= */
/** ครูยืนยันสิทธิ์ (อีเมลต้องอยู่ใน TEACHER_EMAILS และยืนยันแล้ว) → custom claim teacher=true */
export const claimTeacher = callable(async (req, uid) => {
  const email = String(req.auth?.token?.email || '').toLowerCase();
  const allowed = TEACHER_EMAILS.value().split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  if (!email || req.auth?.token?.email_verified !== true || !allowed.includes(email)) throw new HttpsError('permission-denied', 'อีเมลนี้ยังไม่ได้รับสิทธิ์ครู (ติดต่อผู้ดูแลให้เพิ่มใน TEACHER_EMAILS)');
  const user = await getAuth().getUser(uid);
  await getAuth().setCustomUserClaims(uid, { ...(user.customClaims || {}), teacher: true });
  await db().ref(`teachers/${uid}`).set({ email, name: str(req.auth?.token?.name, 60) || email, at: Date.now() });
  return { teacher: true };
});

/** นักเรียนเข้าสู่ระบบด้วยเลขประจำตัว + PIN ของระบบห้องเรียนออนไลน์ (ตรวจฝั่งเซิร์ฟเวอร์) */
export const schoolLogin = callable(async (req, uid) => {
  await rateLimit(uid, 'schoolLogin', 8, 10 * 60_000);
  const url = SCHOOL_API_URL.value();
  if (!url) throw new HttpsError('failed-precondition', 'ระบบนี้ยังไม่ได้เชื่อมต่อระบบห้องเรียนออนไลน์');
  const studentId = str(req.data?.studentId, 20), pin = str(req.data?.pin, 12);
  if (!studentId || !pin) throw new HttpsError('invalid-argument', 'กรุณากรอกเลขประจำตัวและรหัส PIN');
  let data: { ok?: boolean; error?: string; student?: { studentId: string; name: string; classroom: string } };
  try {
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'verify', studentId, pin }), redirect: 'follow' });
    data = (await r.json()) as typeof data;
  } catch { throw new HttpsError('unavailable', 'เชื่อมต่อระบบห้องเรียนออนไลน์ไม่ได้'); }
  if (!data.ok || !data.student) throw new HttpsError('permission-denied', data.error || 'เลขประจำตัวหรือรหัส PIN ไม่ถูกต้อง');
  const user = await getAuth().getUser(uid);
  await getAuth().setCustomUserClaims(uid, { ...(user.customClaims || {}), sid: data.student.studentId, sname: str(data.student.name, 60), sroom: str(data.student.classroom, 20) });
  return { student: { studentId: data.student.studentId, name: data.student.name, classroom: data.student.classroom } };
});

/* =========================================================
   Rooms
   ========================================================= */
async function newCode(): Promise<string> {
  for (let i = 0; i < 20; i++) {
    let c = '';
    for (let k = 0; k < 6; k++) c += CODE_ALPHABET[randomInt(0, CODE_ALPHABET.length)];
    const r = await db().ref(`roomCodes/${c}`).transaction(cur => (cur === null ? '__reserved__' : undefined));
    if (r.committed) return c;
  }
  throw new HttpsError('resource-exhausted', 'สร้างรหัสห้องไม่สำเร็จ กรุณาลองใหม่');
}

export const createRoom = callable(async (req, uid) => {
  requireTeacher(req);
  await rateLimit(uid, 'createRoom', 20, 60 * 60_000);
  const name = str(req.data?.name, 60) || 'ห้องผจญภัยในโลกคลื่น';
  const settings = sanitizeSettings(req.data?.settings);
  const [contentSnap, boardSnap] = await Promise.all([db().ref('content').get(), db().ref('config/board').get()]);
  let content: ContentBundle = defaultContent();
  if (contentSnap.exists()) {
    const raw = contentSnap.val() as Partial<ContentBundle>;
    const merged = { situation: raw.situation || content.situation, question: raw.question || content.question, special: raw.special || content.special };
    content = sanitizeContent(merged).content;
  }
  let board: BoardConfig = DEFAULT_BOARD;
  if (boardSnap.exists()) {
    const b = boardSnap.val() as BoardConfig;
    if (validateBoard(b).ok) board = b;
  }
  const code = await newCode();
  const roomId = 'R' + Date.now().toString(36) + randomUUID().replace(/-/g, '').slice(0, 10);
  const doc = E.createRoomDoc({ id: roomId, code, name, hostUid: uid, hostName: str(req.auth?.token?.name, 60) || 'ครู', settings, board, content, now: Date.now() });
  await db().ref().update({
    [`rooms/${roomId}`]: clean(doc),
    [`roomCodes/${code}`]: roomId,
    [`teacherRooms/${uid}/${roomId}`]: { name, code, createdAt: doc.public.createdAt, status: 'WAITING', players: 0 }
  });
  return { roomId, code };
});

export const joinRoom = callable(async (req, uid) => {
  await rateLimit(uid, 'joinRoom', 30, 10 * 60_000);
  const code = str(req.data?.code, 8).toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(code)) throw new HttpsError('invalid-argument', 'รหัสห้องต้องมี 6 ตัวอักษร');
  const rs = await db().ref(`roomCodes/${code}`).get();
  if (!rs.exists() || rs.val() === '__reserved__') throw new HttpsError('not-found', 'ไม่พบห้องที่ใช้รหัสนี้');
  const roomId = rs.val() as string;
  const name = str(req.data?.name, 20);
  if (name.length < 2) throw new HttpsError('invalid-argument', 'ชื่อกลุ่มต้องยาว 2–20 ตัวอักษร');
  const avatar = AVATARS.some(a => a.id === req.data?.avatar) ? String(req.data?.avatar) : AVATARS[0].id;
  const color = TOKEN_COLORS.find(c => c.hex === req.data?.color)?.hex;
  if (!color) throw new HttpsError('invalid-argument', 'กรุณาเลือกสีตัวเดิน');
  const token = req.auth!.token as Record<string, unknown>;
  const sid = typeof token.sid === 'string' ? token.sid : undefined;
  const captain = typeof token.sname === 'string' ? token.sname : undefined;
  const m = await mutateRoom(roomId, null, doc => {
    if (doc.public.hostUid === uid) throw new HttpsError('failed-precondition', 'ครูผู้สร้างห้องควบคุมเกมจากหน้า Teacher Dashboard');
    if (doc.public.settings.requireSchoolLogin && !sid) throw new HttpsError('permission-denied', 'ห้องนี้ต้องเข้าสู่ระบบด้วยเลขประจำตัวและ PIN ก่อน');
    if (sid) {
      const prev = Object.values(doc.public.players).find(p => p.sid === sid && !p.removed);
      if (prev && prev.id !== uid) { E.rebindPlayer(doc, prev.id, uid, Date.now()); return { rejoined: true }; }
    }
    const before = !!doc.public.players[uid];
    E.addPlayer(doc, { uid, name, avatar, color, captain, sid }, Date.now());
    return { rejoined: before };
  });
  return { roomId, ...(m.result || {}) };
});

export const leaveRoom = callable(async (req, uid) => {
  const roomId = roomIdOf(req);
  await mutateRoom(roomId, null, doc => E.removePlayer(doc, uid, ctx()));
  return { ok: true };
});

export const setReady = callable(async (req, uid) => {
  const roomId = roomIdOf(req);
  await mutateRoom(roomId, null, doc => E.setReady(doc, uid, req.data?.ready === true));
  return { ok: true };
});

export const updateRoomSettings = callable(async (req, uid) => {
  const roomId = roomIdOf(req);
  await mutateRoom(roomId, null, doc => {
    if (doc.public.hostUid !== uid) throw new HttpsError('permission-denied', 'เฉพาะครูผู้สร้างห้อง');
    if (doc.public.status !== 'WAITING') throw new HttpsError('failed-precondition', 'แก้ไขกติกาได้ก่อนเริ่มเกมเท่านั้น');
    doc.public.settings = sanitizeSettings(req.data?.settings);
  });
  return { ok: true };
});

/* =========================================================
   Gameplay (server-authoritative)
   ========================================================= */
export const startGame = callable(async (req, uid) => {
  const roomId = roomIdOf(req), requestId = requestIdOf(req);
  const m = await mutateRoom(roomId, requestId, doc => {
    if (doc.public.hostUid !== uid) throw new HttpsError('permission-denied', 'เฉพาะครูผู้สร้างห้อง (Host) เริ่มเกมได้');
    E.startGame(doc, ctx());
  });
  return { ok: true, duplicate: m.duplicate };
});

export const rollDice = callable(async (req, uid) => {
  const roomId = roomIdOf(req), requestId = requestIdOf(req);
  await rateLimit(uid, 'roll', 30, 60_000);
  const m = await mutateRoom(roomId, requestId, doc => { E.timeout(doc, ctx()); if (doc.public.status !== 'PLAYING') throw new HttpsError('failed-precondition', 'เกมจบแล้ว'); return E.roll(doc, uid, ctx()); });
  return { ok: true, duplicate: m.duplicate, dice: m.result ?? null };
});

export const submitAnswer = callable(async (req, uid) => {
  const roomId = roomIdOf(req), requestId = requestIdOf(req);
  const m = await mutateRoom(roomId, requestId, doc => E.answer(doc, uid, req.data?.answer, ctx()));
  return { ok: true, duplicate: m.duplicate };
});

export const chooseOption = callable(async (req, uid) => {
  const roomId = roomIdOf(req), requestId = requestIdOf(req);
  const m = await mutateRoom(roomId, requestId, doc => E.choose(doc, uid, req.data?.option, ctx()));
  return { ok: true, duplicate: m.duplicate };
});

/** ใครก็ได้ในห้องเรียกเมื่อเวลานับถอยหลังหมด — Backend ตรวจเวลาเองก่อนตัดสิน */
export const checkTimeout = callable(async (req, uid) => {
  const roomId = roomIdOf(req);
  await rateLimit(uid, 'timeout', 60, 60_000);
  const [mem, host] = await Promise.all([db().ref(`rooms/${roomId}/members/${uid}`).get(), loadRoomHost(roomId)]);
  if (!mem.exists() && host !== uid) throw new HttpsError('permission-denied', 'คุณไม่ได้อยู่ในห้องนี้');
  const m = await mutateRoom(roomId, null, doc => E.timeout(doc, ctx()));
  return { ok: true, changed: !!m.result };
});

/** คำสั่งควบคุมเกมของครู (Host) */
export const hostAction = callable(async (req, uid) => {
  const roomId = roomIdOf(req), requestId = requestIdOf(req);
  const action = String(req.data?.action || '');
  const target = typeof req.data?.playerId === 'string' ? req.data.playerId : '';
  const m = await mutateRoom(roomId, requestId, doc => {
    if (doc.public.hostUid !== uid) throw new HttpsError('permission-denied', 'เฉพาะครูผู้สร้างห้อง');
    const c = ctx();
    switch (action) {
      case 'pause': return E.pauseGame(doc, c);
      case 'resume': return E.resumeGame(doc, c);
      case 'end': if (doc.public.status === 'WAITING') throw new HttpsError('failed-precondition', 'เกมยังไม่เริ่ม'); return E.endGame(doc, 'teacher', c);
      case 'skip': return E.teacherSkipTurn(doc, c);
      case 'remove': return E.removePlayer(doc, target, c);
      case 'adjust': return E.adjustScore(doc, target, req.data?.delta, c);
      case 'judge': return E.teacherJudge(doc, req.data?.verdict, c);
      default: throw new HttpsError('invalid-argument', 'คำสั่งไม่ถูกต้อง');
    }
  });
  return { ok: true, duplicate: m.duplicate };
});

/** สร้างห้องใหม่ด้วยผู้เล่นชุดเดิม (เล่นใหม่) */
export const rematch = callable(async (req, uid) => {
  requireTeacher(req);
  const roomId = roomIdOf(req);
  const snap = await db().ref(`rooms/${roomId}/public`).get();
  if (!snap.exists()) throw new HttpsError('not-found', 'ไม่พบห้อง');
  const pub = snap.val() as RoomDoc['public'];
  if (pub.hostUid !== uid) throw new HttpsError('permission-denied', 'เฉพาะครูผู้สร้างห้อง');
  const code = await newCode();
  const newId = 'R' + Date.now().toString(36) + randomUUID().replace(/-/g, '').slice(0, 10);
  const secret = (await db().ref(`rooms/${roomId}/secret/content`).get()).val() as ContentBundle;
  const doc = E.createRoomDoc({ id: newId, code, name: pub.name, hostUid: uid, hostName: pub.hostName, settings: sanitizeSettings(pub.settings), board: pub.board, content: sanitizeContent(secret || defaultContent()).content, now: Date.now() });
  await db().ref().update({
    [`rooms/${newId}`]: clean(doc), [`roomCodes/${code}`]: newId,
    [`teacherRooms/${uid}/${newId}`]: { name: pub.name, code, createdAt: doc.public.createdAt, status: 'WAITING', players: 0 },
    [`rooms/${roomId}/public/rematch`]: { roomId: newId, code }
  });
  return { roomId: newId, code };
});
