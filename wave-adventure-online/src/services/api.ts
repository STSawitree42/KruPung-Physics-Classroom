/* =========================================================
   Game API (Firebase แพ็กเกจฟรี Spark — ไม่ใช้ Cloud Functions)
   • นักเรียน: ส่ง "คำสั่ง" ลง inbox แล้วรอคำตอบจากเครื่องครู (Host Runtime)
   • ครู: ประมวลผลเกมบนเครื่องตัวเองผ่าน Host Runtime
   ทุกคำสั่งมี requestId (idempotency key) ป้องกันการกดซ้ำ
   ========================================================= */
import { get, onValue, ref, remove, serverTimestamp, set } from 'firebase/database';
import { signInAnonymously, signInWithPopup, signInWithCredential, GoogleAuthProvider, signOut as fbSignOut, type User } from 'firebase/auth';
import { fb, USE_EMULATORS, SCHOOL_API_URL } from '../config/firebase';
import * as H from '../host/hostRuntime';
import type { HostAction, PlayerCommand } from '@shared/commands';
import type { GameSettings, WaveType } from '@shared/types';

export const newRequestId = () => 'r' + (crypto.randomUUID ? crypto.randomUUID().replace(/-/g, '') : Math.random().toString(36).slice(2) + Date.now().toString(36)).slice(0, 30);
const REPLY_TIMEOUT = 15_000;

function uidOrThrow() {
  const u = fb().auth.currentUser;
  if (!u) throw new Error('กรุณาเข้าสู่ระบบก่อน');
  return u.uid;
}
const friendly = (e: unknown) => {
  const err = e as { code?: string; message?: string };
  const msg = /permission|PERMISSION_DENIED/i.test(err.message || '') ? 'ไม่มีสิทธิ์ทำรายการนี้' : (err.message || 'เกิดข้อผิดพลาด');
  return Object.assign(new Error(msg), { code: err.code });
};

/** ส่งคำสั่งของผู้เล่นไปยังเครื่องครู แล้วรอผล */
async function send<T = Record<string, unknown>>(roomId: string, cmd: PlayerCommand): Promise<T> {
  const { db } = fb();
  const uid = uidOrThrow();
  const requestId = newRequestId();
  const replyRef = ref(db, `replies/${roomId}/${uid}/${requestId}`);
  let off = () => {};
  const reply = new Promise<Record<string, unknown>>((resolve, reject) => {
    const t = setTimeout(() => { off(); reject(new Error('เครื่องครูไม่ตอบสนอง — ครูต้องเปิดหน้าควบคุมห้องนี้ค้างไว้ระหว่างเล่น')); }, REPLY_TIMEOUT);
    off = onValue(replyRef, s => { if (s.exists()) { clearTimeout(t); off(); resolve(s.val()); } }, e => { clearTimeout(t); reject(friendly(e)); });
  });
  try { await set(ref(db, `inbox/${roomId}/${uid}/${requestId}`), JSON.parse(JSON.stringify({ ...cmd, at: serverTimestamp() }))); }
  catch (e) { off(); throw /permission/i.test(String((e as Error).message)) ? new Error('ไม่พบห้องนี้ หรือห้องปิดแล้ว') : friendly(e); }
  const r = await reply;
  remove(replyRef).catch(() => {});
  if (!r.ok) throw Object.assign(new Error(String(r.error || 'เกิดข้อผิดพลาด')), { code: r.code });
  return r as T;
}

/* ---------------- Auth ---------------- */
export async function ensureUser(): Promise<User> {
  const { auth } = fb();
  await auth.authStateReady();
  if (auth.currentUser) return auth.currentUser;
  return (await signInAnonymously(auth)).user;
}
/** key ของอีเมลใน config/teacherEmails (RTDB ห้ามใช้ '.' ในชื่อ key) */
export const emailKey = (email: string) => email.trim().toLowerCase().replace(/\./g, ',');

/** ตรวจสิทธิ์ครู: อีเมล Google (ยืนยันแล้ว) ต้องอยู่ใน config/teacherEmails ที่ครูเพิ่มเองใน Firebase Console */
export async function checkTeacher(u: User | null = fb().auth.currentUser): Promise<boolean> {
  if (!u || u.isAnonymous || !u.email || !u.emailVerified) return false;
  try { return (await get(ref(fb().db, `config/teacherEmails/${emailKey(u.email)}`))).val() === true; } catch { return false; }
}
export async function teacherSignIn(): Promise<{ teacher: boolean; email: string }> {
  const { auth } = fb();
  const r = await signInWithPopup(auth, new GoogleAuthProvider());
  return { teacher: await checkTeacher(r.user), email: r.user.email || '' };
}
/** ใช้ได้เฉพาะตอนทดสอบกับ Firebase Emulator (Auth Emulator ยอมรับ Google token จำลอง) */
export async function teacherSignInEmulator(email: string) {
  if (!USE_EMULATORS) throw new Error('ใช้ได้เฉพาะโหมด Emulator');
  const { auth } = fb();
  const r = await signInWithCredential(auth, GoogleAuthProvider.credential(JSON.stringify({ sub: 'emu-' + email, email, email_verified: true, name: 'ครู (Emulator)' })));
  return { teacher: await checkTeacher(r.user), email: r.user.email || '' };
}
export const isTeacher = () => checkTeacher();
export async function signOut() { await fbSignOut(fb().auth); }

/** ข้อมูลนักเรียนที่ผูกกับบัญชีนี้แล้ว (Apps Script เป็นผู้เขียน) */
export async function myStudentLink(): Promise<{ sid: string; name: string; classroom: string } | null> {
  const u = fb().auth.currentUser;
  if (!u) return null;
  try { return (await get(ref(fb().db, `studentLinks/${u.uid}`))).val(); } catch { return null; }
}

/** เข้าสู่ระบบด้วยเลขประจำตัว + PIN ผ่าน Apps Script ของระบบห้องเรียนออนไลน์ */
export async function schoolLogin(studentId: string, pin: string) {
  if (!SCHOOL_API_URL) throw new Error('ระบบนี้ยังไม่ได้เชื่อมต่อระบบห้องเรียนออนไลน์');
  const u = await ensureUser();
  const idToken = await u.getIdToken();
  let data: { ok?: boolean; error?: string; student?: { studentId: string; name: string; classroom: string } };
  try {
    const r = await fetch(SCHOOL_API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'waveLink', studentId: studentId.trim(), pin: pin.trim(), idToken }), redirect: 'follow' });
    data = await r.json();
  } catch { throw new Error('เชื่อมต่อระบบห้องเรียนออนไลน์ไม่ได้ กรุณาลองใหม่'); }
  if (!data.ok || !data.student) throw new Error(data.error || 'เลขประจำตัวหรือรหัส PIN ไม่ถูกต้อง');
  return data.student;
}

/* ---------------- Rooms ---------------- */
async function findRoom(code: string) {
  const c = code.trim().toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(c)) throw new Error('รหัสห้องต้องมี 6 ตัวอักษร');
  const s = await get(ref(fb().db, `roomCodes/${c}`)).catch(e => { throw friendly(e); });
  if (!s.exists()) throw new Error('ไม่พบห้องที่ใช้รหัสนี้');
  return s.val() as string;
}
const host = () => { const u = fb().auth.currentUser; if (!u) throw new Error('กรุณาเข้าสู่ระบบก่อน'); return u; };
const wrap = async <T,>(p: Promise<T>) => { try { return await p; } catch (e) { throw friendly(e); } };

export const api = {
  /* ครู (ทำงานบนเครื่องครู) */
  createRoom: (name: string, settings: Partial<GameSettings>) => wrap(H.createRoom(fb().db, { uid: host().uid, name: host().displayName || 'ครู' }, name, settings)),
  host: (roomId: string, action: Exclude<HostAction, 'start' | 'settings'>, extra: Record<string, unknown> = {}) => wrap(H.hostAction(fb().db, host().uid, roomId, action, newRequestId(), extra)),
  startGame: (roomId: string) => wrap(H.hostAction(fb().db, host().uid, roomId, 'start', newRequestId())),
  updateSettings: (roomId: string, settings: Partial<GameSettings>) => wrap(H.hostAction(fb().db, host().uid, roomId, 'settings', newRequestId(), { settings })),
  rematch: (roomId: string) => wrap(H.rematch(fb().db, host().uid, roomId)),

  /* นักเรียน (ส่งคำสั่งไปเครื่องครู) */
  joinRoom: async (code: string, name: string, avatar: string, color: string) => {
    await ensureUser();
    const roomId = await findRoom(code);
    const r = await send<{ rejoined?: boolean }>(roomId, { t: 'join', name, avatar, color });
    return { roomId, rejoined: r.rejoined };
  },
  leaveRoom: (roomId: string) => send(roomId, { t: 'leave' }),
  setReady: (roomId: string, ready: boolean) => send(roomId, { t: 'ready', ready }),
  roll: (roomId: string) => send<{ dice: number | null; duplicate: boolean }>(roomId, { t: 'roll' }),
  answer: (roomId: string, answer: WaveType[] | number) => send(roomId, { t: 'answer', answer }),
  choose: (roomId: string, option: number) => send(roomId, { t: 'choose', option })
};

/* ---------------- Local memory (reconnect) ---------------- */
const LAST = 'wao.lastRoom';
export const lastRoom = {
  get(): { roomId: string; code: string } | null { try { return JSON.parse(localStorage.getItem(LAST) || 'null'); } catch { return null; } },
  set(v: { roomId: string; code: string }) { try { localStorage.setItem(LAST, JSON.stringify(v)); } catch { /* private mode */ } },
  clear() { try { localStorage.removeItem(LAST); } catch { /* ignore */ } }
};
