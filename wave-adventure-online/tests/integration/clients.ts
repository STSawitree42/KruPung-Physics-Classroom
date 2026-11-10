/* ผู้เล่นจำลองหลายเครื่อง: แต่ละคนเป็น Firebase app แยกกัน (เหมือน browser session แยก) */
import { initializeApp, deleteApp, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, signInAnonymously, signInWithCredential, GoogleAuthProvider, signInWithCustomToken, type Auth } from 'firebase/auth';
import { getDatabase, connectDatabaseEmulator, ref, get, set, type Database } from 'firebase/database';
import { getFunctions, connectFunctionsEmulator, httpsCallable, type Functions } from 'firebase/functions';
import { randomUUID } from 'node:crypto';

export const PROJECT = 'demo-wave-adventure';
export const DB_URL = `http://127.0.0.1:9000?ns=${PROJECT}-default-rtdb`;

export interface Client { name: string; app: FirebaseApp; auth: Auth; db: Database; fns: Functions; uid: string;
  call: <T = Record<string, unknown>>(fn: string, data?: Record<string, unknown>) => Promise<T>;
  read: <T = unknown>(path: string) => Promise<T>;
  write: (path: string, v: unknown) => Promise<void>; }

let n = 0;
export async function client(kind: 'anon' | 'teacher' | { customToken: string }, label = 'c'): Promise<Client> {
  const app = initializeApp({ projectId: PROJECT, apiKey: 'demo-api-key', databaseURL: DB_URL }, `${label}-${++n}`);
  const auth = getAuth(app); connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  const db = getDatabase(app); connectDatabaseEmulator(db, '127.0.0.1', 9000);
  const fns = getFunctions(app, 'asia-southeast1'); connectFunctionsEmulator(fns, '127.0.0.1', 5001);
  if (kind === 'anon') await signInAnonymously(auth);
  else if (kind === 'teacher') await signInWithCredential(auth, GoogleAuthProvider.credential(JSON.stringify({ sub: 'teacher-' + randomUUID().slice(0, 6), email: 'teacher@school.test', email_verified: true, name: 'ครูทดสอบ' })));
  else await signInWithCustomToken(auth, kind.customToken);
  const c: Client = {
    name: label, app, auth, db, fns, uid: auth.currentUser!.uid,
    call: async (fn, data = {}) => (await httpsCallable(fns, fn)(data)).data as never,
    read: async (path) => (await get(ref(db, path))).val(),
    write: async (path, v) => set(ref(db, path), v)
  };
  return c;
}
export const rid = () => 'req-' + randomUUID().replace(/-/g, '').slice(0, 20);
export const close = (...cs: Client[]) => Promise.all(cs.map(c => deleteApp(c.app)));
export async function denied(p: Promise<unknown>) { try { await p; return false; } catch { return true; } }
export async function errorOf(p: Promise<unknown>) { try { await p; return null; } catch (e) { return (e as { code?: string; message?: string }); } }
