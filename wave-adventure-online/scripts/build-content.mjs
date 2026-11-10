/* สร้างไฟล์ setup/wave-content.json (ชุดเริ่มต้นพร้อมเฉลย) จาก shared/defaults.ts
   ครูนำเข้าไฟล์นี้ที่ Teacher Dashboard ครั้งเดียว — ไฟล์นี้ไม่ถูกนำขึ้นเว็บ (ไม่อยู่ใน dist) */
import { build } from 'esbuild';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const tmp = path.join(root, 'node_modules/.cache/wave-defaults.mjs');
mkdirSync(path.dirname(tmp), { recursive: true });
await build({ entryPoints: [path.join(root, 'shared/defaults.ts')], bundle: true, format: 'esm', platform: 'node', outfile: tmp, logLevel: 'error' });
const { defaultContent } = await import(pathToFileURL(tmp).href + '?t=' + Date.now());
rmSync(tmp);
const out = path.join(root, 'setup/wave-content.json');
writeFileSync(out, JSON.stringify(defaultContent(), null, 2) + '\n');
console.log('wrote', path.relative(root, out));
