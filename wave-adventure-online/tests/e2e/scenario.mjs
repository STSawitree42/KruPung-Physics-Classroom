/* =========================================================
   E2E (Playwright) — เปิดเว็บแอปจริงกับ Firebase Emulator
   ครู 1 คน + นักเรียน 3 กลุ่ม (1 กลุ่มใช้จอมือถือ) จาก browser context แยกกัน
   รันด้วย: npm run test:e2e
   ========================================================= */
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const BASE = 'http://127.0.0.1:5173';
const OUT = process.env.E2E_OUT || 'test-results/e2e';
mkdirSync(OUT, { recursive: true });
const results = [];
const check = (name, ok, extra = '') => { results.push({ name, ok }); console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${extra ? ' — ' + extra : ''}`); };
const sleep = ms => new Promise(r => setTimeout(r, ms));

const vite = spawn('npx', ['vite', '--mode', 'emulator', '--port', '5173', '--strictPort'], { stdio: 'pipe' });
for (let i = 0; i < 60; i++) { try { if ((await fetch(BASE)).ok) break; } catch { /* waiting */ } await sleep(500); }

const browser = await chromium.launch();
const errors = [];
const mk = async (label, viewport, mobile = false) => {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push(`${label}: ${e.message}`));
  page.on('console', m => { if (m.type() === 'error' && !/favicon|Failed to load resource/.test(m.text())) errors.push(`${label}: ${m.text()}`); });
  page.label = label;
  return page;
};
const noOverflow = async (page, w) => {
  const r = await page.evaluate(() => {
    const W = document.documentElement.clientWidth;
    const bad = [...document.querySelectorAll('body *')].filter(e => { const b = e.getBoundingClientRect(); return b.right > W + 1 && b.width > 0 && getComputedStyle(e).position !== 'fixed'; })
      .slice(0, 3).map(e => `${e.tagName.toLowerCase()}.${String(e.className).slice(0, 40)} "${(e.textContent || '').trim().slice(0, 30)}" right=${Math.round(e.getBoundingClientRect().right)}`);
    return { sw: document.documentElement.scrollWidth, bad };
  });
  if (r.sw > w + 1) console.log(`  overflow at ${w}px (scrollWidth ${r.sw}):`, r.bad.join(' | '));
  return r.sw <= w + 1;
};

try {
  /* ---------- teacher creates a room ---------- */
  const teacher = await mk('teacher', { width: 1366, height: 900 });
  await teacher.goto(`${BASE}/#/create`);
  await teacher.getByText('สำหรับครูเท่านั้น').waitFor();
  await teacher.getByRole('button', { name: 'เข้าสู่ระบบ (ทดสอบ)' }).click();
  await teacher.locator('#roomName').waitFor({ timeout: 20000 });
  await teacher.locator('#roomName').fill('ม.5/1 ทดสอบ E2E');
  await teacher.getByRole('button', { name: /สร้างห้องและรับรหัส/ }).click();
  await teacher.waitForURL(/#\/host\//, { timeout: 20000 });
  const codeEl = teacher.locator('[aria-label^="รหัสห้อง"]');
  await codeEl.waitFor();
  const code = (await codeEl.textContent()).trim();
  check('TEST 1 (E2E): teacher creates a room and sees code + QR', /^[A-Z2-9]{6}$/.test(code) && await teacher.locator('img[alt^="QR Code"]').isVisible(), code);
  await teacher.screenshot({ path: `${OUT}/01-lobby-teacher.png` });

  /* ---------- 3 students join (one on a phone) ---------- */
  const students = [await mk('s1', { width: 1280, height: 860 }), await mk('s2', { width: 1024, height: 768 }), await mk('s3-mobile', { width: 375, height: 812 }, true)];
  const teams = [['ทีมคลื่นยักษ์', 'แดง'], ['ทีมเสียงก้อง', 'เหลือง'], ['ทีมแสงเลเซอร์', 'เขียว']];
  for (let i = 0; i < 3; i++) {
    const p = students[i];
    await p.goto(`${BASE}/#/join?code=${code}`);
    await p.locator('#nick').fill(teams[i][0]);
    await p.locator(`button[title="${teams[i][1]}"]`).click();
    await p.getByRole('button', { name: 'เข้าร่วมห้อง', exact: true }).click();
    await p.getByRole('button', { name: /พร้อมเล่น!/ }).waitFor({ timeout: 20000 });
  }
  await students[2].screenshot({ path: `${OUT}/02-lobby-mobile.png`, fullPage: true });
  check('TEST 17: lobby fits a 375px phone (no horizontal scroll)', await noOverflow(students[2], 375));
  await students[2].setViewportSize({ width: 360, height: 780 }); await sleep(300);
  check('TEST 17: lobby fits a 360px phone', await noOverflow(students[2], 360));
  await students[2].setViewportSize({ width: 375, height: 812 });
  await teacher.getByText('ทีมแสงเลเซอร์').waitFor();
  const names = await Promise.all(students.map(p => p.locator('ul li b').allTextContents()));
  check('TEST 3 (E2E): every browser shows the same player list', names.every(n => n.map(x => x.replace(' (คุณ)', '')).sort().join() === names[0].map(x => x.replace(' (คุณ)', '')).sort().join()) && names[0].length === 3);

  /* ---------- host-only start ---------- */
  check('TEST 4 (E2E): students do not see a start button', (await students[0].getByRole('button', { name: 'เริ่มเกม' }).count()) === 0);
  for (const p of students) await p.getByRole('button', { name: /พร้อมเล่น!/ }).click();
  await teacher.getByRole('button', { name: 'เริ่มเกม' }).click();
  for (const p of students) await p.locator('[aria-label="กระดานเกม"]').waitFor({ timeout: 20000 });
  check('game started on all devices', true);

  /* ---------- play turns ---------- */
  const closeReveal = async p => { const d = p.getByRole('dialog', { name: 'ผลการตอบ' }); if (await d.isVisible().catch(() => false)) await d.getByRole('button', { name: 'ปิด', exact: true }).last().click().catch(() => {}); };
  let shots = { card: false, special: false, board: false, mobileBoard: false }, rolls = 0, answered = 0, specials = 0;
  for (let turn = 0; turn < 30; turn++) {
    await sleep(700);
    try {
    for (const p of [...students, teacher]) await closeReveal(p);
    const who = [];
    for (const p of students) { const b = p.locator('button:has-text("ทอยลูกเต๋า"):visible'); if (await b.count() && await b.first().isEnabled()) who.push(p); }
    const dialogs = await Promise.all(students.map(p => p.getByRole('dialog', { name: 'การ์ด' }).isVisible().catch(() => false)));
    if (dialogs.some(Boolean)) {
      // someone has a card open: the owner answers
      for (const p of students) {
        const d = p.getByRole('dialog', { name: 'การ์ด' });
        if (!(await d.isVisible().catch(() => false))) continue;
        const submit = d.getByRole('button', { name: 'ส่งคำตอบ' });
        const opts = d.locator('.btn-royal');
        if (await submit.count()) {
          await sleep(500);
          if (!shots.card) { await p.screenshot({ path: `${OUT}/04-card-${p.label}.png` }); shots.card = true; }
          const typeBtn = d.locator('[aria-label^="เลือกการ์ดประเภทคลื่น"] button');
          if (await typeBtn.count()) await typeBtn.nth(answered % 4).click({ timeout: 4000 }); else await d.locator('button[aria-pressed]').first().click({ timeout: 4000 });
          await submit.click({ timeout: 4000 }); answered++; break;
        }
        if (await opts.count() && await opts.first().isEnabled()) {
          if (!shots.special) { await sleep(500); await p.screenshot({ path: `${OUT}/05-special-${p.label}.png` }); shots.special = true; }
          await opts.first().click({ timeout: 4000 }); specials++; break;
        }
      }
      continue;
    }
    if (who.length > 1) check('TEST 5 (E2E): only one device can roll at a time', false, who.map(p => p.label).join());
    if (who.length === 1) {
      const p = who[0];
      await p.locator('button:has-text("ทอยลูกเต๋า"):visible').first().click({ timeout: 4000 }); rolls++;
      await sleep(2200);
      if (!shots.board && p.label === 's1') { await p.screenshot({ path: `${OUT}/03-board-desktop.png` }); shots.board = true; }
      if (!shots.mobileBoard && p.label === 's3-mobile') { await p.screenshot({ path: `${OUT}/06-board-mobile.png` }); shots.mobileBoard = true; }
    }
    const over = await students[0].getByText('ผู้พิชิตคลื่น!').isVisible().catch(() => false);
    if (over) break;
    } catch (e) { console.log('  (retrying turn: ' + e.message.split('\n')[0] + ')'); }
  }
  check('dice rolled through the UI', rolls >= 5, `${rolls} rolls, ${answered} answers, ${specials} special choices`);
  check('TEST 8 (E2E): wave cards were answered through the UI', answered >= 1);

  /* ---------- clean board screenshots (no dialogs) ---------- */
  await sleep(1200);
  for (const p of [...students, teacher]) await closeReveal(p);
  if (!(await students[0].getByRole('dialog').count())) await students[0].screenshot({ path: `${OUT}/03b-board-clean-desktop.png` });
  if (!(await students[2].getByRole('dialog').count())) await students[2].screenshot({ path: `${OUT}/06b-board-clean-mobile.png`, fullPage: true });
  if (!(await teacher.getByRole('dialog').count())) await teacher.screenshot({ path: `${OUT}/03c-host-view.png` });

  /* ---------- scores in sync ---------- */
  await sleep(800);
  const boards = await Promise.all(students.map(p => p.locator('[aria-label="คะแนนผู้เล่น"] .font-display').allTextContents().catch(() => [])));
  const sum = b => b.map(Number).reduce((a, c) => a + c, 0);
  check('TEST 6 (E2E): all devices show identical scores', boards.every(b => sum(b) === sum(boards[0])), boards.map(sum).join('/'));
  check('TEST 17: game board fits a 375px phone', await noOverflow(students[2], 375));
  for (const w of [360, 430, 768]) { await students[2].setViewportSize({ width: w, height: 800 }); await sleep(300); check(`TEST 17: game board fits ${w}px`, await noOverflow(students[2], w)); }
  await students[2].setViewportSize({ width: 375, height: 812 });

  /* ---------- teacher ends the game ---------- */
  if (!(await students[0].getByText('ผู้พิชิตคลื่น!').isVisible().catch(() => false))) {
    await closeReveal(teacher);
    // ครูจบเกมได้แม้มีการ์ดเปิดอยู่ (ปุ่มควบคุมอยู่ในหน้าต่างการ์ดด้วย)
    const cardDlg = teacher.getByRole('dialog', { name: 'การ์ด' });
    const scope = (await cardDlg.isVisible().catch(() => false)) ? cardDlg : teacher;
    await scope.getByRole('button', { name: 'จบเกม' }).first().click({ timeout: 8000 });
    await teacher.getByRole('dialog', { name: 'ยืนยันจบเกม' }).getByRole('button', { name: 'จบเกม' }).click({ timeout: 8000 });
  }
  for (const p of students) await p.getByText('ผู้พิชิตคลื่น!').waitFor({ timeout: 20000 });
  check('TEST 15 (E2E): result page shown on every device', true);
  await sleep(1500);
  await students[0].screenshot({ path: `${OUT}/07-result.png`, fullPage: true });
  await students[2].screenshot({ path: `${OUT}/08-result-mobile.png`, fullPage: true });
  check('TEST 17: result page fits a 375px phone', await noOverflow(students[2], 375));

  /* ---------- teacher dashboard ---------- */
  await teacher.goto(`${BASE}/#/teacher`);
  await teacher.getByText('ม.5/1 ทดสอบ E2E').first().waitFor({ timeout: 20000 });
  check('TEST 16 (E2E): teacher dashboard lists the room', true);
  await teacher.getByRole('button', { name: /รายงาน/ }).first().click();
  await teacher.getByText(/รายงาน: ม.5\/1/).waitFor({ timeout: 15000 });
  await teacher.screenshot({ path: `${OUT}/09-teacher-report.png` });
  await teacher.keyboard.press('Escape');
  await teacher.getByRole('tab', { name: 'คลังคำถาม' }).click();
  await teacher.getByText('q50').waitFor({ timeout: 20000 });
  await teacher.screenshot({ path: `${OUT}/10-teacher-questions.png` });
  check('teacher question bank loads 50 default questions', true);
  await teacher.goto(`${BASE}/#/editor`);
  await teacher.getByText('พร้อมใช้งาน 36 ช่อง').waitFor({ timeout: 15000 });
  await sleep(1500);
  const editorVisible = await teacher.locator('img[alt="ภาพกระดาน"]').isVisible();
  await teacher.screenshot({ path: `${OUT}/11-board-editor.png` });
  check('board editor renders the board image with cell markers', editorVisible && (await teacher.locator('button[aria-label^="ช่อง "]').count()) === 38);
  check('board editor validates the 36-cell original board', true);

  /* ---------- public pages ---------- */
  const visitor = await mk('visitor', { width: 390, height: 844 }, true);
  for (const [path, file] of [['/', '12-splash'], ['/home', '13-home'], ['/how', '14-how']]) {
    await visitor.goto(`${BASE}/#${path}`); await sleep(600);
    await visitor.screenshot({ path: `${OUT}/${file}-mobile.png`, fullPage: true });
    check(`TEST 17: ${path} fits a 390px phone`, await noOverflow(visitor, 390));
  }
} catch (e) {
  check('scenario completed without exceptions', false, e.message.split('\n')[0]);
} finally {
  check('no JavaScript errors in any browser', errors.length === 0, errors.slice(0, 3).join(' | '));
  await browser.close();
  vite.kill();
  const failed = results.filter(r => !r.ok).length;
  console.log(`\nE2E: ${results.length - failed}/${results.length} checks passed`);
  process.exit(failed ? 1 : 0);
}
