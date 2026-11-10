/* เตรียมข้อมูลใน Emulator ก่อน E2E: สิทธิ์ครู + คลังการ์ดเริ่มต้น (เหมือนที่ครูทำใน Firebase Console / Dashboard) */
import { initializeApp } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import { readFileSync } from 'node:fs';
const PROJECT = 'demo-wave-adventure';
initializeApp({ projectId: PROJECT, databaseURL: `http://127.0.0.1:9000?ns=${PROJECT}-default-rtdb` });
const content = JSON.parse(readFileSync(new URL('../../setup/wave-content.json', import.meta.url), 'utf8'));
await getDatabase().ref().update({ 'config/teacherEmails/teacher@school,test': true, content });
console.log('seeded teacher allowlist + content');
process.exit(0);
