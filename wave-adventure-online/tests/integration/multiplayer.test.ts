/* =========================================================
   Integration tests — Cloud Functions + Realtime Database + Auth (Firebase Emulator)
   ครู 1 คน + นักเรียน 4 กลุ่ม จาก 5 sessions แยกกัน
   ครอบคลุม Acceptance Tests 1–16 และ 19
   ========================================================= */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { initializeApp as adminInit, getApps } from 'firebase-admin/app';
import { getDatabase as adminDb } from 'firebase-admin/database';
import { getAuth as adminAuth } from 'firebase-admin/auth';
import http from 'node:http';
import { client, close, denied, errorOf, rid, PROJECT, type Client } from './clients';
import type { RoomPublic, RoomSecret, WaveType } from '../../shared/types';
import { gradeSituation } from '../../shared/content';

if (!getApps().length) adminInit({ projectId: PROJECT, databaseURL: `http://127.0.0.1:9000?ns=${PROJECT}-default-rtdb` });
const admin = () => adminDb();

let teacher: Client; const S: Client[] = [];
let roomId = ''; let code = '';
const pub = (c: Client) => c.read<RoomPublic>(`rooms/${roomId}/public`);
const secret = async () => (await admin().ref(`rooms/${roomId}/secret`).get()).val() as RoomSecret;
const byUid = (uid: string) => S.find(s => s.uid === uid)!;

/** Mock ของ Apps Script (action: verify) สำหรับทดสอบการเข้าสู่ระบบด้วยเลขประจำตัว + PIN */
let gas: http.Server;
const ROSTER: Record<string, { pin: string; name: string; classroom: string }> = {
  '01997': { pin: '123456', name: 'ด.ญ.ทดลอง', classroom: 'ม.5/1' },
  '20003': { pin: '654321', name: 'ด.ช.ม.สี่', classroom: 'ม.4/1' }
};

beforeAll(async () => {
  gas = http.createServer((req, res) => {
    let body = ''; req.on('data', c => (body += c)); req.on('end', () => {
      const r = JSON.parse(body || '{}');
      const key = Object.keys(ROSTER).find(k => k.replace(/^0+/, '') === String(r.studentId || '').replace(/^0+/, ''));
      const s = key ? ROSTER[key] : undefined;
      let out: unknown;
      if (r.action !== 'verify' || !s || s.pin !== r.pin) out = { ok: false, error: 'เลขประจำตัวหรือรหัส PIN ไม่ถูกต้อง' };
      else if (!s.classroom.startsWith('ม.5')) out = { ok: false, error: 'เกมนี้เปิดให้เฉพาะนักเรียน ม.5' };
      else out = { ok: true, student: { studentId: key, name: s.name, classroom: s.classroom } };
      res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(out));
    });
  }).listen(8787);
  teacher = await client('teacher', 'teacher');
  for (let i = 0; i < 4; i++) S.push(await client('anon', 'student' + (i + 1)));
});
afterAll(async () => { await close(teacher, ...S); gas.close(); });

describe('roles', () => {
  it('a student cannot create rooms; a teacher must claim the teacher role first', async () => {
    expect(await denied(S[0].call('createRoom', { name: 'x' }))).toBe(true);
    expect(await denied(teacher.call('createRoom', { name: 'x' }))).toBe(true);   // no claim yet
    expect(await denied(S[0].call('claimTeacher'))).toBe(true);                    // anonymous → no email
    await teacher.call('claimTeacher');
    await teacher.auth.currentUser!.getIdToken(true);
  });
});

describe('TEST 1–3: create & join', () => {
  it('TEST 1: teacher creates a room and receives a 6-character code', async () => {
    const r = await teacher.call<{ roomId: string; code: string }>('createRoom', { name: 'ม.5/1 คาบ 3', settings: { answerSeconds: 30, timeLimitMinutes: 0 } });
    roomId = r.roomId; code = r.code;
    expect(code).toMatch(/^[A-Z2-9]{6}$/);
    expect((await pub(teacher)).status).toBe('WAITING');
  });
  it('TEST 2: four students join from four separate sessions', async () => {
    const colors = ['#ef4444', '#facc15', '#22c55e', '#3b82f6'];
    for (let i = 0; i < 4; i++) {
      const r = await S[i].call<{ roomId: string }>('joinRoom', { code, name: 'กลุ่ม' + (i + 1), avatar: 'surfer', color: colors[i] });
      expect(r.roomId).toBe(roomId);
    }
    expect(await errorOf(S[0].call('joinRoom', { code: 'ZZZZZZ', name: 'x1', avatar: 'surfer', color: '#06b6d4' }))).toMatchObject({ code: 'functions/not-found' });
  });
  it('TEST 3: every device sees the same player list', async () => {
    const lists = await Promise.all([teacher, ...S].map(async c => Object.values((await pub(c)).players).map(p => p.name).sort().join(',')));
    expect(new Set(lists).size).toBe(1);
    expect(lists[0]).toBe('กลุ่ม1,กลุ่ม2,กลุ่ม3,กลุ่ม4');
  });
});

describe('TEST 4: only the host starts the game', () => {
  it('students cannot start; the host can once everyone is ready', async () => {
    for (const s of S) await s.call('setReady', { roomId, ready: true });
    expect(await errorOf(S[0].call('startGame', { roomId, requestId: rid() }))).toMatchObject({ code: 'functions/permission-denied' });
    await teacher.call('startGame', { roomId, requestId: rid() });
    const p = await pub(S[2]);
    expect(p.status).toBe('PLAYING');
    expect(p.order).toHaveLength(4);
  });
});

describe('TEST 5–7, 9: turns, server dice, movement, anti-cheat', () => {
  it('TEST 5: only the current player can roll', async () => {
    const p = await pub(teacher);
    const notMe = S.find(s => s.uid !== p.turn.playerId)!;
    expect(await errorOf(notMe.call('rollDice', { roomId, requestId: rid() }))).toMatchObject({ code: 'functions/permission-denied' });
  });
  it('TEST 6 & 7: the backend rolls; all devices see the same result and the token moves by that many cells', async () => {
    const before = await pub(teacher);
    const me = byUid(before.turn.playerId!);
    const from = before.players[me.uid].position;
    const r = await me.call<{ dice: number }>('rollDice', { roomId, requestId: rid() });
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
  });
});

/** เล่นต่อไปเรื่อย ๆ จนเกิดเหตุการณ์ที่ต้องการ (ลูกเต๋าสุ่มจริงจาก Backend) */
async function playUntil(cond: (p: RoomPublic) => boolean, max = 60) {
  for (let i = 0; i < max; i++) {
    const p = await pub(teacher);
    if (cond(p)) return p;
    if (p.status !== 'PLAYING') throw new Error('game ended early');
    const me = byUid(p.turn.playerId!);
    if (p.turn.awaiting === 'roll') await me.call('rollDice', { roomId, requestId: rid() });
    else if (p.turn.awaiting === 'answer') await me.call('submitAnswer', { roomId, requestId: rid(), answer: p.turn.card?.kind === 'question' ? 0 : ['mechanical'] });
    else if (p.turn.awaiting === 'choice') await me.call('chooseOption', { roomId, requestId: rid(), option: 0 });
    else if (p.turn.awaiting === 'teacher') await teacher.call('hostAction', { roomId, requestId: rid(), action: 'judge', verdict: 'approve' });
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
    await me.call('submitAnswer', { roomId, requestId, answer: right });
    const dup = await me.call<{ duplicate: boolean }>('submitAnswer', { roomId, requestId, answer: right });
    expect(dup.duplicate).toBe(true);
    expect(await denied(me.call('submitAnswer', { roomId, requestId: rid(), answer: right }))).toBe(true);
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
    expect((await again.call<{ roomId: string; rejoined: boolean }>('joinRoom', { code, name: 'อื่น ๆ', avatar: 'surfer', color: '#06b6d4' })).roomId).toBe(roomId);
    await close(again);
  });
  it('school login (student ID + PIN) works through the Apps Script bridge and is limited to ม.5', async () => {
    const st = await client('anon', 'school');
    expect(await errorOf(st.call('schoolLogin', { studentId: '01997', pin: '000000' }))).toMatchObject({ code: 'functions/permission-denied' });
    expect((await errorOf(st.call('schoolLogin', { studentId: '20003', pin: '654321' })))?.message).toContain('ม.5');
    const r = await st.call<{ student: { name: string } }>('schoolLogin', { studentId: '1997', pin: '123456' });
    expect(r.student.name).toBe('ด.ญ.ทดลอง');
    await st.auth.currentUser!.getIdToken(true);
    const claims = (await st.auth.currentUser!.getIdTokenResult()).claims;
    expect(claims.sid).toBe('01997');
    await close(st);
  });
});

describe('TEST 14–16: finish, results, teacher dashboard data', () => {
  it('TEST 14 & 15: reaching FINISH ends the game and the result ranks by score', async () => {
    let p = await playUntil(x => x.turn.awaiting === 'roll');
    const me = byUid(p.turn.playerId!);
    const fin = p.board.cells.length - 1;
    await admin().ref(`rooms/${roomId}/public/players/${me.uid}/position`).set(fin - 1);   // วางไว้หน้าเส้นชัย (เฉพาะในชุดทดสอบ)
    await me.call('rollDice', { roomId, requestId: rid() });
    p = await pub(S[1]);
    expect(p.status).toBe('FINISHED');
    expect(p.endReason).toBe('finish');
    expect(p.players[me.uid].position).toBe(fin);
    const res = p.results!;
    const top = Math.max(...Object.values(p.players).map(x => x.score));
    expect(res[0].score).toBe(top);
    expect(res.filter(r => r.winner).every(r => r.score === top)).toBe(true);
    expect(res.map(r => r.score)).toEqual([...res.map(r => r.score)].sort((a, b) => b - a));
    expect(await denied(me.call('rollDice', { roomId, requestId: rid() }))).toBe(true);
  });
  it('TEST 16: the teacher can read results and per-answer records; students cannot', async () => {
    const r = await teacher.read<{ results: unknown[] }>(`results/${roomId}`);
    expect(r.results.length).toBe(4);
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
    expect(await denied(S[0].write(`rateLimits/${S[0].uid}/roll`, { start: 0, count: 0 }))).toBe(true);
    await close(outsider);
  });
  it('a room code is only a lookup key: knowing it does not grant access without joining', async () => {
    const r = await teacher.call<{ roomId: string; code: string }>('createRoom', { name: 'อีกห้อง' });
    expect(await denied(S[3].read(`rooms/${r.roomId}/public`))).toBe(true);
  });
});
