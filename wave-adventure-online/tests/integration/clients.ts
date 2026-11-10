/* ผู้เล่นจำลองหลายเครื่อง: แต่ละคนเป็น Firebase app แยกกัน (เหมือน browser session แยก) */
import { initializeApp, deleteApp, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, signInAnonymously, signInWithCredential, GoogleAuthProvider, signInWithCustomToken, type Auth } from 'firebase/auth';
import { getDatabase, connectDatabaseEmulator, ref, get, set, onValue, remove, serverTimestamp, type Database } from 'firebase/database';
import { randomUUID } from 'node:crypto';
import type { PlayerCommand } from '../../shared/commands';

export const PROJECT = 'demo-wave-adventure';
export const DB_URL = `http://127.0.0.1:9000?ns=${PROJECT}-default-rtdb`;

export interface Client { name: string; app: FirebaseApp; auth: Auth; db: Database; uid: string;
  /** ส่งคำสั่งเหมือน src/services/api.ts แล้วรอคำตอบจากเครื่องครู */
  send: <T = Record<string, unknown>>(roomId: string, cmd: PlayerCommand, requestId?: string) => Promise<T>;
  read: <T = unknown>(path: string) => Promise<T>;
  write: (path: string, v: unknown) => Promise<void>; }

export class CmdError extends Error { constructor(public code: string, message: string) { super(message); } }

let n = 0;
export async function client(kind: 'anon' | { google: string } | { customToken: string }, label = 'c'): Promise<Client> {
  const app = initializeApp({ projectId: PROJECT, apiKey: 'demo-api-key', databaseURL: DB_URL }, `${label}-${++n}`);
  const auth = getAuth(app); connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  const db = getDatabase(app); connectDatabaseEmulator(db, '127.0.0.1', 9000);
  if (kind === 'anon') await signInAnonymously(auth);
  else if ('google' in kind) await signInWithCredential(auth, GoogleAuthProvider.credential(JSON.stringify({ sub: 'g-' + randomUUID().slice(0, 8), email: kind.google, email_verified: true, name: 'ครูทดสอบ' })));
  else await signInWithCustomToken(auth, kind.customToken);
  const uid = auth.currentUser!.uid;
  const c: Client = {
    name: label, app, auth, db, uid,
    send: async (roomId, cmd, requestId = rid()) => {
      const replyRef = ref(db, `replies/${roomId}/${uid}/${requestId}`);
      let off = () => {};
      const reply = new Promise<Record<string, unknown>>((resolve, reject) => {
        const t = setTimeout(() => { off(); reject(new CmdError('timeout', 'host did not reply')); }, 15000);
        off = onValue(replyRef, s => { if (s.exists()) { clearTimeout(t); off(); resolve(s.val()); } }, e => { clearTimeout(t); reject(e); });
      });
      try { await set(ref(db, `inbox/${roomId}/${uid}/${requestId}`), JSON.parse(JSON.stringify({ ...cmd, at: serverTimestamp() }))); }
      catch (e) { off(); throw e; }
      const r = await reply;
      await remove(replyRef);
      if (!r.ok) throw new CmdError(String(r.code), String(r.error));
      return r as never;
    },
    read: async (path) => (await get(ref(db, path))).val(),
    write: async (path, v) => set(ref(db, path), v)
  };
  return c;
}
export const rid = () => 'r' + randomUUID().replace(/-/g, '').slice(0, 24);
export const close = (...cs: Client[]) => Promise.all(cs.map(c => deleteApp(c.app)));
export async function denied(p: Promise<unknown>) { try { await p; return false; } catch { return true; } }
export async function errorOf(p: Promise<unknown>) { try { await p; return null; } catch (e) { return (e as { code?: string; message?: string }); } }
