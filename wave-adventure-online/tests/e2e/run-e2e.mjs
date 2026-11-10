/* รัน E2E: เปิด Firebase Emulator (Auth + Realtime Database) → เตรียมข้อมูล → รัน scenario.mjs */
import { execSync } from 'node:child_process';
execSync('npx firebase emulators:exec --project demo-wave-adventure --only auth,database "node tests/e2e/seed.mjs && node tests/e2e/scenario.mjs"', { stdio: 'inherit' });
