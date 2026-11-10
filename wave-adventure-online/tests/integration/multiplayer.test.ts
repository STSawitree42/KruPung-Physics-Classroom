/* =========================================================
   Integration tests — Firebase Emulator (Auth + Realtime Database) แพ็กเกจฟรี Spark
   ครู 1 คน (เครื่องครูรัน Host Runtime) + นักเรียน 4 คน จาก 5 sessions แยกกัน
   ครอบคลุม Acceptance Tests 1–16 และ 19
   ========================================================= */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { initializeApp as adminInit, getApps } from 'firebase-admin/app';
import { getDatabase as adminDb } from 'firebase-admin/database';
import { getAuth as adminAuth } from 'firebase-admin/auth';
import { readFileSync } from 'node:fs';
import { ref, update } from 'firebase/database';
import { client, close, denied, errorOf, rid, PROJECT, type Client } from './clients';
import * as H from '../../src/host/hostRuntime';
import type { RoomPublic, RoomSecret, WaveType } from '../../shared/types';
import { gradeSituation } from '../../shared/content';

if (!getApps().length) adminInit({ projectId: PROJECT, databaseURL: `http://127.0.0.1:9000?ns=${PROJECT}-default-rtdb` });
const admin = () => adminDb();

let teacher: Client; const S: Client[] = [];
let roomId = ''; let code = '';
let hostLoop: H.HostHandle | null = null;
const pub = (c: Client) => c.read<RoomPublic>(`rooms/${roomId}/public`);
const secret = async () => (await admin().ref(`rooms/${roomId}/secret`).get()).val() as RoomSecret;
const byUid = (uid: string) => S.find(s => s.uid === uid)!;
const hostAct = (action: Parameters<typeof H.hostAction>[3], extra: Record<string, unknown> = {}) => H.hostAction(teacher.db, teacher.uid, roomId, action, rid(), extra);
const CONTENT = JSON.parse(readFileSync(new URL('../../setup/wave-content.json', import.meta.url), 'utf8'));

beforeAll(async () => {
  teacher = await client({ google: 'teacher@school.test' }, 'teacher');
  for (let i = 0; i < 4; i++) S.push(await client('anon', 'student' + (i + 1)));
});
afterAll(async () => { hostLoop?.stop(); await close(teacher, ...S); });

describe('roles', () => {
  it('only an allow-listed Google account is a teacher; content must be imported before creating rooms', async () => {
    expect(await denied(H.createRoom(S[0].db, { uid: S[0].uid, name: 'x' }, 'x', {}, CONTENT))).toBe(true);
    expect(await denied(H.createRoom(teacher.db, { uid: teacher.uid, name: 'x' }, 'x', {}, CONTENT))).toBe(true);   // ยังไม่อยู่ใน allowlist
    expect(await denied(teacher.write('config/teacherEmails/teacher@school,test', true))).toBe(true);              // เพิ่มสิทธิ์ตัวเองไม่ได้
    await admin().ref('config/teacherEmails/teacher@school,test').set(true);                                         // ครูเพิ่มใน Firebase Console
    expect(await teacher.read('config/teacherEmails/teacher@school,test')).toBe(true);
    expect(await denied(S[0].read('config/teacherEmails/teacher@school,test'))).toBe(true);
    expect((await errorOf(H.createRoom(teacher.db, { uid: teacher.uid, name: 'ครู' }, 'x', {})))?.message).toContain('นำเข้าชุดเริ่มต้น');
    const up: Record<string, unknown> = {};                                                                           // นำเข้าไฟล์ setup/wave-content.json (ทีละรายการ เหมือนปุ่มใน Dashboard)
    for (const k of ['situation', 'question', 'special']) for (const [id, c] of Object.entries(CONTENT[k])) up[`content/${k}/${id}`] = c;
    expect(await denied(teacher.write('content', CONTENT))).toBe(true);                                             // เขียนทับทั้งก้อนไม่ได้
    await update(ref(teacher.db), up);
    expect(Object.keys(await teacher.read<object>('content/question'))).toHaveLength(50);
  });
});

describe('TEST 1–3: create & join', () => {
  it('TEST 1: teacher creates a room and receives a 6-character code', async () => {
    const r = await H.createRoom(teacher.db, { uid: teacher.uid, name: 'ครูทดสอบ' }, 'ม.5/1 คาบ 3', { answerSeconds: 30, timeLimitMinutes: 0 });
    roomId = r.roomId; code = r.code;
    hostLoop = H.startHost(teacher.db, roomId, teacher.uid, e => console.error('host', e));
    expect(code).toMatch(/^[A-Z2-9]{6}$/);
    expect((await pub(teacher)).status).toBe('WAITING');
  });
  it('TEST 2: four students join from four separate sessions', async () => {
    const colors = ['#ef4444', '#facc15', '#22c55e', '#3b82f6'];
    for (let i = 0; i < 4; i++) {
      expect(await S[i].read(`roomCodes/${code}`)).toBe(roomId);
      await S[i].send(roomId, { t: 'join', name: 'กลุ่ม' + (i + 1), avatar: 'surfer', color: colors[i] });
    }
    expect(await S[0].read('roomCodes/ZZZZZZ')).toBeNull();
  });
  it('TEST 3: every device sees the same player list', async () => {
    const lists = await Promise.all([teacher, ...S].map(async c => Object.values((await pub(c)).players).map(p => p.name).sort().join(',')));
    expect(new Set(lists).size).toBe(1);
    expect(lists[0]).toBe('กลุ่ม1,กลุ่ม2,กลุ่ม3,กลุ่ม4');
  });
});

describe('TEST 4: only the host starts the game', () => {
  it('students cannot start; the host can once everyone is ready', async () => {
    for (const s of S) await s.send(roomId, { t: 'ready', ready: true });
    expect(await denied(H.hostAction(S[0].db, S[0].uid, roomId, 'start', rid()))).toBe(true);                     // อ่าน/เขียนห้องไม่ได้
    expect(await denied(S[0].send(roomId, { t: 'start' } as never))).toBe(true);                                  // ไม่มีคำสั่ง start สำหรับนักเรียน
    await hostAct('start');
    const p = await pub(S[2]);
    expect(p.status).toBe('PLAYING');
    expect(p.order).toHaveLength(4);
  });
});

describe('TEST 5–7, 9: turns, server dice, movement, anti-cheat', () => {
  it('TEST 5: only the current player can roll', async () => {
    const p = await pub(teacher);
    const notMe = S.find(s => s.uid !== p.turn.playerId)!;
    expect(await errorOf(notMe.send(roomId, { t: 'roll' }))).toMatchObject({ code: 'permission-denied' });
  });
  it('TEST 6 & 7: the backend rolls; all devices see the same result and the token moves by that many cells', async () => {
    const before = await pub(teacher);
    const me = byUid(before.turn.playerId!);
    const from = before.players[me.uid].position;
    const r = await me.send<{ dice: number }>(roomId, { t: 'roll' });
    expect(r.dice).toBeGreaterThanOrEqual(1); expect(r.dice).toBeLessThanOrEqual(6);
    const views = await Promise.all([teacher, ...S].map(pub));
    views.forEach(v => { expect(v.turn.move?.dice?.[0] ?? v.turn.dice).toBeDefined(); });
    const moves = views.map(v => JSON.stringify(v.log && Object.values(v.log).filter(l => l.type === 'roll').pop()?.text));
    expect(new Set(moves).size).toBe(1);
    const firstMove = views[0];
    const dicePath = Object.values(firstMove.log).find(l => l.type === 'roll' && l.playerId === me.uid)!;
    expect(dicePath.text).toContain(String(r.dice));
    const pos = firstMove.players[me.uid].position;
    // position = from + dice (unless a card/penalty already moved it this turn)
    const moved = firstMove.turn.move!;
    if (moved.kind === 'dice') expect(pos).toBe(Math.min(from + r.dice, firstMove.board.cells.length - 1));
  });
  it('TEST 9: clients cannot write scores, positions or dice directly', async () => {
    const s = S[0];
    expect(await denied(s.write(`rooms/${roomId}/public/players/${s.uid}/score`, 999))).toBe(true);
    expect(await denied(s.write(`rooms/${roomId}/public/players/${s.uid}/position`, 36))).toBe(true);
    expect(await denied(s.write(`rooms/${roomId}/public/turn/dice`, 6))).toBe(true);
    expect(await denied(s.read(`rooms/${roomId}/secret`))).toBe(true);
    expect(await denied(s.read(`rooms/${roomId}`))).toBe(true);
    expect(await denied(s.write(`rooms/${roomId}/members/${s.uid}`, true))).toBe(true);
    // คำสั่งปลอมในนามคนอื่น / ช่องข้อมูลแปลก / อ่าน inbox คนอื่น ถูกปฏิเสธ
    expect(await denied(s.write(`inbox/${roomId}/${S[1].uid}/${rid()}`, { t: 'roll', at: { '.sv': 'timestamp' } }))).toBe(true);
    expect(await denied(s.write(`inbox/${roomId}/${s.uid}/${rid()}`, { t: 'roll', at: { '.sv': 'timestamp' }, score: 99 }))).toBe(true);
    expect(await denied(s.write(`inbox/${roomId}/${s.uid}/${rid()}`, { t: 'adjust', at: { '.sv': 'timestamp' } }))).toBe(true);
    expect(await denied(s.read(`inbox/${roomId}`))).toBe(true);
    expect(await denied(s.read(`replies/${roomId}/${S[1].uid}`))).toBe(true);
    expect(await denied(s.write(`studentLinks/${s.uid}`, { sid: '01997', name: 'ปลอม', classroom: 'ม.5/1' }))).toBe(true);
  });
});

/** เล่นต่อไปเรื่อย ๆ จนเกิดเหตุการณ์ที่ต้องการ (ลูกเต๋าสุ่มจริงจาก Backend) */
async function playUntil(cond: (p: RoomPublic) => boolean, max = 60) {
  for (let i = 0; i < max; i++) {
    const p = await pub(teacher);
    if (cond(p)) return p;
    if (p.status !== 'PLAYING') throw new Error('game ended early');
    const me = byUid(p.turn.playerId!);
    if (p.turn.awaiting === 'roll') await me.send(roomId, { t: 'roll' });
    else if (p.turn.awaiting === 'answer') await me.send(roomId, { t: 'answer', answer: p.turn.card?.kind === 'question' ? 0 : ['mechanical'] });
    else if (p.turn.awaiting === 'choice') await me.send(roomId, { t: 'choose', option: 0 });
    else if (p.turn.awaiting === 'teacher') await hostAct('judge', { verdict: 'approve' });
  }
  throw new Error('condition not reached');
}

describe('TEST 8, 10, 11: wave cards & scoring', () => {
  it('TEST 8: landing on a WAVE cell opens a situation card without the answer', async () => {
    const p = await playUntil(x => x.turn.awaiting === 'answer');
    const card = p.turn.card!;
    expect(p.board.cells[p.players[p.turn.playerId!].position].type).toBe('WAVE');
    expect(card.kind).toBe('situation');
    expect(JSON.stringify(card)).not.toMatch(/"answers"|"explanation"/);
    expect(card.reveal).toBeUndefined();
  });
  it('TEST 10 & 11: a correct answer scores per the rules; a repeated submit does not score twice', async () => {
    const p = await pub(teacher);
    const me = byUid(p.turn.playerId!);
    const sec = await secret();
    const card = sec.content.situation[sec.current!.cardId.split(':')[1]];
    const right = card.answers[0] as WaveType[];
    expect(gradeSituation(right, card.answers)).toBe('full');
    const before = p.players[me.uid].score;
    const requestId = rid();
    await me.send(roomId, { t: 'answer', answer: right }, requestId);
    const dup = await me.send<{ duplicate: boolean }>(roomId, { t: 'answer', answer: right }, requestId);
    expect(dup.duplicate).toBe(true);
    expect(await denied(me.send(roomId, { t: 'answer', answer: right }))).toBe(true);
    const after = await pub(S[0]);
    expect(after.players[me.uid].score).toBe(before + card.points * 2);
    expect(after.lastCard?.reveal?.verdict).toBe('full');
    expect(after.lastCard?.reveal?.answers).toBeDefined();
    const answers = await teacher.read<Record<string, { cardId: string; verdict: string }>>(`roomAnswers/${roomId}`);
    expect(Object.values(answers).some(a => a.cardId === card.id && a.verdict === 'full')).toBe(true);
  });
});

describe('TEST 12: lightning cells', () => {
  it('opens a special card from the original deck', async () => {
    const p = await playUntil(x => !!x.lastCard && x.lastCard.deck === 'special' || x.turn.card?.deck === 'special', 120);
    const card = p.turn.card?.deck === 'special' ? p.turn.card : p.lastCard!;
    expect(card.kind).toBe('special');
    expect(card.title.length).toBeGreaterThan(2);
  });
});

describe('TEST 13: reconnect', () => {
  it('a player who loses the connection can reload and keep playing with the same account', async () => {
    const p = await pub(teacher);
    const old = S[0];
    const token = await adminAuth().createCustomToken(old.uid);
    const again = await client({ customToken: token }, 'reconnected');
    expect(again.uid).toBe(old.uid);
    const view = await pub(again);
    expect(view.players[old.uid].name).toBe(p.players[old.uid].name);
    expect((await again.send<{ rejoined: boolean }>(roomId, { t: 'join', name: 'อื่น ๆ', avatar: 'surfer', color: '#06b6d4' })).rejoined).toBe(true);
    await close(again);
  });
  it('school login: a verified student (Apps Script → studentLinks) can continue from another device', async () => {
    const r2 = await H.createRoom(teacher.db, { uid: teacher.uid, name: 'ครู' }, 'ห้องเข้าสู่ระบบโรงเรียน', { requireSchoolLogin: true });
    const loop2 = H.startHost(teacher.db, r2.roomId, teacher.uid);
    const pub2 = (c: Client) => c.read<RoomPublic>(`rooms/${r2.roomId}/public`);
    const dev1 = await client('anon', 'school-dev1');
    expect((await errorOf(dev1.send(r2.roomId, { t: 'join', name: 'กลุ่มห้า', avatar: 'surfer', color: '#a855f7' })))?.message).toContain('เลขประจำตัว');
    await admin().ref(`studentLinks/${dev1.uid}`).set({ sid: '01997', name: 'ด.ญ.ทดลอง', classroom: 'ม.5/1', at: Date.now() });  // เขียนโดย Apps Script (waveLink)
    expect((await dev1.read<{ sid: string }>(`studentLinks/${dev1.uid}`)).sid).toBe('01997');
    await dev1.send(r2.roomId, { t: 'join', name: 'กลุ่มห้า', avatar: 'surfer', color: '#a855f7' });
    let p = await pub2(teacher);
    expect(p.players[dev1.uid].sid).toBe('01997');
    expect(p.players[dev1.uid].captain).toBe('ด.ญ.ทดลอง');
    const dev2 = await client('anon', 'school-dev2');                       // เครื่องใหม่ เข้าสู่ระบบด้วยเลขประจำตัวเดิม
    await admin().ref(`studentLinks/${dev2.uid}`).set({ sid: '01997', name: 'ด.ญ.ทดลอง', classroom: 'ม.5/1', at: Date.now() });
    const r = await dev2.send<{ rejoined: boolean }>(r2.roomId, { t: 'join', name: 'ชื่อใหม่', avatar: 'surfer', color: '#a855f7' });
    expect(r.rejoined).toBe(true);
    p = await pub2(dev2);
    expect(p.players[dev2.uid].name).toBe('กลุ่มห้า');
    expect(p.players[dev1.uid]).toBeUndefined();
    expect(await denied(pub2(dev1))).toBe(true);                             // เครื่องเดิมถูกย้ายสิทธิ์ออกแล้ว
    loop2.stop();
    await close(dev1, dev2);
  });
  it('turn timeouts are resolved by the host runtime (no student action needed)', async () => {
    const p0 = await playUntil(x => x.turn.awaiting === 'answer');
    const pid = p0.turn.playerId!;
    await admin().ref(`rooms/${roomId}/public/turn/deadline`).set(Date.now() - 1000);    // เร่งเวลา (เฉพาะในชุดทดสอบ)
    let p = p0;
    for (let i = 0; i < 20 && p.turn.awaiting === 'answer' && p.turn.playerId === pid; i++) { await new Promise(r => setTimeout(r, 300)); p = await pub(teacher); }
    expect(p.turn.awaiting === 'answer' && p.turn.playerId === pid).toBe(false);
    expect(p.lastCard?.reveal?.verdict).toBe('wrong');
  });
});

describe('TEST 14–16: finish, results, teacher dashboard data', () => {
  it('TEST 14 & 15: reaching FINISH ends the game and the result ranks by score', async () => {
    let p = await playUntil(x => x.turn.awaiting === 'roll');
    const me = byUid(p.turn.playerId!);
    const fin = p.board.cells.length - 1;
    await admin().ref(`rooms/${roomId}/public/players/${me.uid}/position`).set(fin - 1);   // วางไว้หน้าเส้นชัย (เฉพาะในชุดทดสอบ)
    await me.send(roomId, { t: 'roll' });
    p = await pub(S[1]);
    expect(p.status).toBe('FINISHED');
    expect(p.endReason).toBe('finish');
    expect(p.players[me.uid].position).toBe(fin);
    const res = p.results!;
    const top = Math.max(...Object.values(p.players).map(x => x.score));
    expect(res[0].score).toBe(top);
    expect(res.filter(r => r.winner).every(r => r.score === top)).toBe(true);
    expect(res.map(r => r.score)).toEqual([...res.map(r => r.score)].sort((a, b) => b - a));
    expect(await denied(me.send(roomId, { t: 'roll' }))).toBe(true);
  });
  it('TEST 16: the teacher can read results and per-answer records; students cannot', async () => {
    const r = await teacher.read<{ results: unknown[] }>(`results/${roomId}`);
    expect(r.results.length).toBeGreaterThanOrEqual(4);
    expect(Object.keys(await teacher.read<object>(`teacherRooms/${teacher.uid}`))).toContain(roomId);
    expect(await denied(S[0].read(`results/${roomId}`))).toBe(true);
    expect(await denied(S[0].read(`roomAnswers/${roomId}`))).toBe(true);
  });
});

describe('TEST 19: security rules', () => {
  it('blocks unauthorized reads and writes', async () => {
    const outsider = await client('anon', 'outsider');
    expect(await denied(outsider.read(`rooms/${roomId}/public`))).toBe(true);
    expect(await denied(outsider.write(`rooms/${roomId}/members/${outsider.uid}`, true))).toBe(true);
    expect(await denied(outsider.write(`roomCodes/AAAAAA`, roomId))).toBe(true);
    expect(await denied(outsider.write(`presence/${roomId}/${outsider.uid}`, { online: true, t: 1 }))).toBe(true);
    expect(await denied(S[0].write(`presence/${roomId}/${S[1].uid}`, { online: true, t: 1 }))).toBe(true);
    expect(await denied(S[0].write(`presence/${roomId}/${S[0].uid}`, { online: true, t: 1 }))).toBe(false);
    expect(await denied(S[0].read('content'))).toBe(true);
    expect(await denied(S[0].write('content/question/hack', { id: 'hack', text: 'x', choices: ['a', 'b', 'c', 'd'], answer: 0, points: 1 }))).toBe(true);
    expect(await denied(S[0].write('config/board/name', 'hack'))).toBe(true);
    expect(await denied(teacher.write('content/question/t1', { id: 't1', text: 'โจทย์', choices: ['a', 'b', 'c', 'd'], answer: 1, points: 3, category: 'x', difficulty: 'easy', explanation: '', enabled: true }))).toBe(false);
    expect(await denied(teacher.write('content/question/t2', { id: 't2', text: 'x', choices: ['a', 'b', 'c', 'd'], answer: 9, points: 3 }))).toBe(true);
    expect(await denied(S[0].write(`rooms/Rfake123456`, { public: { id: 'Rfake123456', hostUid: S[0].uid } }))).toBe(true);
    expect(await denied(S[0].write(`results/${roomId}`, { hostUid: S[0].uid }))).toBe(true);
    expect(await denied(S[0].write(`teacherRooms/${S[0].uid}/x`, { name: 'x' }))).toBe(true);
    // ครูอีกคน (ไม่ใช่เจ้าของห้อง) แก้ห้องนี้ไม่ได้
    await admin().ref('config/teacherEmails/other@school,test').set(true);
    const other = await client({ google: 'other@school.test' }, 'other-teacher');
    expect(await denied(H.hostAction(other.db, other.uid, roomId, 'end', rid()))).toBe(true);
    expect(await denied(other.write(`rooms/${roomId}/public/hostUid`, other.uid))).toBe(true);
    await close(other);
    await close(outsider);
  });
  it('a room code is only a lookup key: knowing it does not grant access without joining', async () => {
    const r = await H.createRoom(teacher.db, { uid: teacher.uid, name: 'ครู' }, 'อีกห้อง', {});
    expect(await denied(S[3].read(`rooms/${r.roomId}/public`))).toBe(true);
  });
});
