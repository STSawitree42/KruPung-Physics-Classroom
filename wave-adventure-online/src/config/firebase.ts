/* Firebase initialisation — ค่าทั้งหมดมาจากตัวแปร VITE_* (ดู .env.example) */
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, browserLocalPersistence, setPersistence, type Auth } from 'firebase/auth';
import { getDatabase, connectDatabaseEmulator, type Database } from 'firebase/database';

const env = import.meta.env;
export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  databaseURL: env.VITE_FIREBASE_DATABASE_URL as string | undefined,
  appId: env.VITE_FIREBASE_APP_ID as string | undefined
};
export const USE_EMULATORS = env.VITE_USE_EMULATORS === 'true';
/** URL /exec ของ Apps Script ระบบห้องเรียนออนไลน์ (ไม่บังคับ — ใช้เข้าสู่ระบบด้วยเลขประจำตัว + PIN) */
export const SCHOOL_API_URL = (env.VITE_SCHOOL_API_URL as string | undefined) || '';
export const isConfigured = !!(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.databaseURL);

let app: FirebaseApp | null = null, auth: Auth | null = null, db: Database | null = null;

export function fb() {
  if (!isConfigured) throw new Error('FIREBASE_NOT_CONFIGURED');
  if (!app) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getDatabase(app);
    if (USE_EMULATORS) {
      connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
      connectDatabaseEmulator(db, '127.0.0.1', 9000);
    }
    setPersistence(auth, browserLocalPersistence).catch(() => {});
  }
  return { app: app!, auth: auth!, db: db! };
}
