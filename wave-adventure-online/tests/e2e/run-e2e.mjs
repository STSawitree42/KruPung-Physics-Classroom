/* รัน E2E: build functions → เปิด Firebase Emulator → รัน scenario.mjs */
import { execSync } from 'node:child_process';
execSync('npm --prefix functions run build', { stdio: 'inherit' });
execSync('npx firebase emulators:exec --project demo-wave-adventure --only auth,database,functions "node tests/e2e/scenario.mjs"', { stdio: 'inherit' });
