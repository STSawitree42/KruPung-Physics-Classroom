/* =========================================================
   Backend API — Frontend ส่ง "คำสั่ง" ผ่าน Cloud Functions เท่านั้น
   ทุกคำสั่งที่เปลี่ยนสถานะเกมมี requestId (idempotency key) ป้องกันการกดซ้ำ
   ========================================================= */
import { httpsCallable } from 'firebase/functions';
import { signInAnonymously, signInWithPopup, signInWithCredential, GoogleAuthProvider, signOut as fbSignOut, type User } from 'firebase/auth';
import { fb, USE_EMULATORS } from '../config/firebase';
import type { GameSettings, WaveType } from '@shared/types';

export const newRequestId = () => 'r' + (crypto.randomUUID ? crypto.randomUUID().replace(/-/g, '') : Math.random().toString(36).slice(2) + Date.now().toString(36)).slice(0, 30);

async function call<T>(name: string, data: Record<string, unknown> = {}): Promise<T> {
  const fn = httpsCallable<Record<string, unknown>, T>(fb().fns, name);
  try { return (await fn(data)).data; }
  catch (e) {
    const err = e as { code?: string; message?: string };
    const msg = err.code === 'functions/unavailable' || err.code === 'functions/internal' && /fetch|network/i.test(err.message || '')
      ? 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ต' : (err.message || 'เกิดข้อผิดพลาด');
    throw Object.assign(new Error(msg), { code: err.code });
  }
}

/* ---------------- Auth ---------------- */
export async function ensureUser(): Promise<User> {
  const { auth } = fb();
  await auth.authStateReady();
  if (auth.currentUser) return auth.currentUser;
  return (await signInAnonymously(auth)).user;
}
export async function teacherSignIn(): Promise<{ teacher: boolean }> {
  const { auth } = fb();
  await signInWithPopup(auth, new GoogleAuthProvider());
  const r = await call<{ teacher: boolean }>('claimTeacher');
  await auth.currentUser?.getIdToken(true);
  return r;
}
/** ใช้ได้เฉพาะตอนทดสอบกับ Firebase Emulator (Auth Emulator ยอมรับ Google token จำลอง) */
export async function teacherSignInEmulator(email: string) {
  if (!USE_EMULATORS) throw new Error('ใช้ได้เฉพาะโหมด Emulator');
  const { auth } = fb();
  await signInWithCredential(auth, GoogleAuthProvider.credential(JSON.stringify({ sub: 'emu-' + email, email, email_verified: true, name: 'ครู (Emulator)' })));
  const r = await call<{ teacher: boolean }>('claimTeacher');
  await auth.currentUser?.getIdToken(true);
  return r;
}
export async function isTeacher(): Promise<boolean> {
  const u = fb().auth.currentUser;
  if (!u || u.isAnonymous) return false;
  return (await u.getIdTokenResult()).claims.teacher === true;
}
export async function signOut() { await fbSignOut(fb().auth); }
export async function schoolLogin(studentId: string, pin: string) {
  await ensureUser();
  const r = await call<{ student: { studentId: string; name: string; classroom: string } }>('schoolLogin', { studentId, pin });
  await fb().auth.currentUser?.getIdToken(true);
  return r.student;
}

/* ---------------- Rooms ---------------- */
export const api = {
  createRoom: (name: string, settings: Partial<GameSettings>) => call<{ roomId: string; code: string }>('createRoom', { name, settings }),
  joinRoom: (code: string, name: string, avatar: string, color: string) => call<{ roomId: string; rejoined?: boolean }>('joinRoom', { code, name, avatar, color }),
  leaveRoom: (roomId: string) => call('leaveRoom', { roomId }),
  setReady: (roomId: string, ready: boolean) => call('setReady', { roomId, ready }),
  updateSettings: (roomId: string, settings: Partial<GameSettings>) => call('updateRoomSettings', { roomId, settings }),
  startGame: (roomId: string) => call('startGame', { roomId, requestId: newRequestId() }),
  roll: (roomId: string) => call<{ dice: number | null; duplicate: boolean }>('rollDice', { roomId, requestId: newRequestId() }),
  answer: (roomId: string, answer: WaveType[] | number) => call('submitAnswer', { roomId, requestId: newRequestId(), answer }),
  choose: (roomId: string, option: number) => call('chooseOption', { roomId, requestId: newRequestId(), option }),
  checkTimeout: (roomId: string) => call<{ changed: boolean }>('checkTimeout', { roomId }),
  host: (roomId: string, action: 'pause' | 'resume' | 'end' | 'skip' | 'remove' | 'adjust' | 'judge', extra: Record<string, unknown> = {}) =>
    call('hostAction', { roomId, action, requestId: newRequestId(), ...extra }),
  rematch: (roomId: string) => call<{ roomId: string; code: string }>('rematch', { roomId })
};

/* ---------------- Local memory (reconnect) ---------------- */
const LAST = 'wao.lastRoom';
export const lastRoom = {
  get(): { roomId: string; code: string } | null { try { return JSON.parse(localStorage.getItem(LAST) || 'null'); } catch { return null; } },
  set(v: { roomId: string; code: string }) { try { localStorage.setItem(LAST, JSON.stringify(v)); } catch { /* private mode */ } },
  clear() { try { localStorage.removeItem(LAST); } catch { /* ignore */ } }
};
