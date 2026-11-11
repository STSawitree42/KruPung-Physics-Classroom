import { describe, it, expect } from 'vitest';
import { addPlayer, answer, choose, markRequest, pauseGame, resumeGame, removePlayer, roll, setReady, startGame, teacherJudge, timeout, adjustScore, applyEffect, EngineError, createRoomDoc, moveAnimationMs } from '../../shared/engine';
import { room, started, rigged, placeFor, firstOf } from './helpers';
import { sanitizeSettings } from '../../shared/rules.config';
import { DEFAULT_BOARD } from '../../shared/board.config';
import { defaultContent } from '../../shared/defaults';
import type { RoomDoc } from '../../shared/types';

const errCode = (fn: () => unknown) => { try { fn(); } catch (e) { return (e as EngineError).code; } return null; };
const cur = (doc: RoomDoc) => doc.public.turn.playerId!;
const WAVE = () => firstOf(structuredDoc(), 'WAVE');
function structuredDoc() { return room().doc; }

describe('lobby', () => {
  it('enforces capacity, unique names/colors and ready state', () => {
    const { doc } = room({ maxPlayers: 2 }, 2);
    expect(errCode(() => addPlayer(doc, { uid: 'u9', name: 'x', avatar: 'a', color: '#000' }, 1))).toBe('resource-exhausted');
    const r = room({}, 1);
    expect(errCode(() => addPlayer(r.doc, { uid: 'u9', name: 'ทีม1', avatar: 'a', color: '#000' }, 1))).toBe('invalid-argument');
    expect(errCode(() => addPlayer(r.doc, { uid: 'u9', name: 'ใหม่', avatar: 'a', color: '#ef4444' }, 1))).toBe('invalid-argument');
    addPlayer(r.doc, { uid: 'u2', name: 'ใหม่', avatar: 'a', color: '#000' }, 1);
    expect(r.doc.public.phase).toBe('WAITING');
    expect(errCode(() => startGame(r.doc, rigged()))).toBe('failed-precondition');   // u2 not ready
    setReady(r.doc, 'u2', true);
    expect(r.doc.public.phase).toBe('READY');
    startGame(r.doc, rigged());
    expect(r.doc.public.status).toBe('PLAYING');
    expect(errCode(() => addPlayer(r.doc, { uid: 'u3', name: 'สาย', avatar: 'a', color: '#111' }, 1))).toBe('failed-precondition');
  });
  it('rejoining with the same uid returns the existing player', () => {
    const { doc } = started();
    const before = doc.public.players.u1;
    expect(addPlayer(doc, { uid: 'u1', name: 'อื่น', avatar: 'a', color: '#123' }, 5)).toBe(before);
  });
  it('dice-off orders players by highest roll', () => {
    const { doc } = room({ turnOrder: 'diceOff' }, 3);
    startGame(doc, rigged([2, 6, 4]));
    expect(doc.public.order).toEqual(['u2', 'u3', 'u1']);
    expect(doc.public.turn.playerId).toBe('u2');
  });
});

describe('turns, dice and movement', () => {
  it('only the current player can roll, and only once per turn', () => {
    const { doc, ids } = started();
    const ctx = rigged([1]);
    expect(errCode(() => roll(doc, ids[1], ctx))).toBe('permission-denied');
    placeFor(doc, ids[0], 2, 1);                  // cell 2 is NORMAL
    roll(doc, ids[0], ctx);
    expect(doc.public.players[ids[0]].position).toBe(2);
    expect(doc.public.turn.move).toMatchObject({ from: 1, to: 2, path: [2], kind: 'dice' });
    expect(cur(doc)).toBe(ids[1]);
    expect(errCode(() => roll(doc, ids[0], rigged([1])))).toBe('permission-denied');
  });
  it('lands on a WAVE cell and waits for an answer with a deadline', () => {
    const { doc, ids } = started();
    const w = WAVE();
    placeFor(doc, ids[0], w, 3);
    roll(doc, ids[0], rigged([3]));
    expect(doc.public.phase).toBe('ANSWERING');
    expect(doc.public.turn.awaiting).toBe('answer');
    expect(doc.public.turn.card?.kind).toBe('situation');
    expect((doc.public.turn.card as unknown as Record<string, unknown>).answers).toBeUndefined();
    // เวลาตอบ 60 วินาที + เวลาแอนิเมชันลูกเต๋า/เดิน (การ์ดเปิดหลังเดินเสร็จ)
    expect(doc.public.turn.deadline).toBe(1_000_000 + 60_000 + moveAnimationMs(doc.public.turn.move));
  });
  it('clamps backwards movement at START and forward movement at FINISH (overshoot allowed)', () => {
    const { doc, ids } = started();
    const fin = doc.public.board.cells.length - 1;
    placeFor(doc, ids[0], fin + 3, 6);           // position fin-3, roll 6 → overshoot
    roll(doc, ids[0], rigged([6]));
    expect(doc.public.players[ids[0]].position).toBe(fin);
    expect(doc.public.status).toBe('FINISHED');
    expect(doc.public.endReason).toBe('finish');
  });
  it('exact-finish mode keeps the token in place when the roll is too high', () => {
    const { doc, ids } = started({ exactFinish: true });
    const fin = doc.public.board.cells.length - 1;
    doc.public.players[ids[0]].position = fin - 2;
    roll(doc, ids[0], rigged([5]));
    expect(doc.public.players[ids[0]].position).toBe(fin - 2);
    expect(doc.public.status).toBe('PLAYING');
  });
});

function toWave(doc: RoomDoc, uid: string, cardRef: string) {
  const w = firstOf(doc, 'WAVE');
  placeFor(doc, uid, w, 2);
  doc.secret.decks.wave = [cardRef];
  roll(doc, uid, rigged([2]));
}

describe('situation cards (original rules)', () => {
  it('all correct = double card points and the player stays', () => {
    const { doc, ids } = started();
    toWave(doc, ids[0], 'S:s03');              // rope: transverse + mechanical, 2 pts
    const pos = doc.public.players[ids[0]].position;
    answer(doc, ids[0], ['transverse', 'mechanical'], rigged());
    expect(doc.public.players[ids[0]].score).toBe(4);
    expect(doc.public.players[ids[0]].position).toBe(pos);
    expect(doc.public.lastCard?.reveal?.verdict).toBe('full');
    expect(cur(doc)).toBe(ids[1]);
  });
  it('partially correct = card points', () => {
    const { doc, ids } = started();
    toWave(doc, ids[0], 'S:s03');
    answer(doc, ids[0], ['mechanical'], rigged());
    expect(doc.public.players[ids[0]].score).toBe(2);
  });
  it('wrong = 0 points and move back 2 cells', () => {
    const { doc, ids } = started();
    toWave(doc, ids[0], 'S:s03');
    const pos = doc.public.players[ids[0]].position;
    answer(doc, ids[0], ['electromagnetic'], rigged());
    expect(doc.public.players[ids[0]].score).toBe(0);
    expect(doc.public.players[ids[0]].position).toBe(pos - 2);
    expect(doc.public.turn.move?.kind).toBe('penalty');
  });
  it('a second answer for the same card is rejected', () => {
    const { doc, ids } = started();
    toWave(doc, ids[0], 'S:s03');
    answer(doc, ids[0], ['transverse', 'mechanical'], rigged());
    expect(errCode(() => answer(doc, ids[0], ['transverse', 'mechanical'], rigged()))).toBe('permission-denied');
    expect(doc.public.players[ids[0]].score).toBe(4);
  });
  it('time out counts as wrong', () => {
    const { doc, ids } = started();
    toWave(doc, ids[0], 'S:s03');
    const ctx = rigged(); ctx.now += 61_000 + moveAnimationMs(doc.public.turn.move);
    expect(timeout(doc, ctx)).toBe(true);
    expect(doc.public.lastCard?.reveal?.timeout).toBe(true);
    expect(doc.public.players[ids[0]].stats.wrong).toBe(1);
    expect(cur(doc)).toBe(ids[1]);
  });
  it('question mode uses the 4-choice question bank', () => {
    const { doc, ids } = started({ waveDeck: 'question' });
    toWave(doc, ids[0], 'Q:q02');                // answer index 2, easy = 2 pts
    expect(doc.public.turn.card?.choices).toHaveLength(4);
    answer(doc, ids[0], 2, rigged());
    expect(doc.public.players[ids[0]].score).toBe(2);
  });
  it('teacher-confirm mode waits for the teacher verdict', () => {
    const { doc, ids } = started({ teacherConfirm: true });
    toWave(doc, ids[0], 'S:s03');
    answer(doc, ids[0], ['transverse'], rigged());
    expect(doc.public.phase).toBe('RESOLVING');
    expect(doc.public.turn.suggestedVerdict).toBe('partial');
    expect(doc.public.players[ids[0]].score).toBe(0);
    teacherJudge(doc, 'full', rigged());
    expect(doc.public.players[ids[0]].score).toBe(4);
  });
});

function toSpecial(doc: RoomDoc, uid: string, cardId: string, dice = 2) {
  const l = firstOf(doc, 'LIGHTNING');
  placeFor(doc, uid, l, dice);
  doc.secret.decks.special = [cardId];
  roll(doc, uid, rigged([dice]));
}

describe('special cards (original deck)', () => {
  it('ความรู้ใหม่: choose +10 points or +3 cells', () => {
    const { doc, ids } = started();
    toSpecial(doc, ids[0], 'sp-new-knowledge');
    expect(doc.public.phase).toBe('CARD_PENDING');
    expect(doc.public.turn.card?.options).toHaveLength(2);
    expect(errCode(() => choose(doc, ids[1], 0, rigged()))).toBe('permission-denied');
    choose(doc, ids[0], 0, rigged());
    expect(doc.public.players[ids[0]].score).toBe(10);
    expect(cur(doc)).toBe(ids[1]);
  });
  it('คลื่นตัวกลางขาดหาย: skip-turn option skips the next turn', () => {
    const { doc, ids } = started();
    toSpecial(doc, ids[0], 'sp-medium-missing');
    choose(doc, ids[0], 1, rigged());
    expect(doc.public.players[ids[0]].skipTurns).toBe(1);
    // u2 and u3 play a normal cell each → turn should skip u1 and go back to u2
    for (const u of [ids[1], ids[2]]) { placeFor(doc, u, 2, 1); roll(doc, u, rigged([1])); }
    expect(cur(doc)).toBe(ids[1]);
    expect(doc.public.players[ids[0]].skipTurns).toBe(0);
  });
  it('คลื่นนิ่ง: +5 and skip a turn', () => {
    const { doc, ids } = started();
    toSpecial(doc, ids[0], 'sp-standing');
    expect(doc.public.players[ids[0]].score).toBe(5);
    expect(doc.public.players[ids[0]].skipTurns).toBe(1);
  });
  it('การดูดกลืนคลื่น: gives 5 points to the next player (never below 0)', () => {
    const { doc, ids } = started();
    doc.public.players[ids[0]].score = 3;
    toSpecial(doc, ids[0], 'sp-absorption');
    expect(doc.public.players[ids[0]].score).toBe(0);
    expect(doc.public.players[ids[1]].score).toBe(3);
  });
  it('คลื่นแทรกสอด: the next team’s next answer is counted wrong', () => {
    const { doc, ids } = started();
    toSpecial(doc, ids[0], 'sp-interference');
    choose(doc, ids[0], 0, rigged());
    expect(doc.public.players[ids[1]].forcedWrong).toBe(true);
    toWave(doc, ids[1], 'S:s03');
    answer(doc, ids[1], ['transverse', 'mechanical'], rigged());
    expect(doc.public.players[ids[1]].score).toBe(0);
    expect(doc.public.players[ids[1]].forcedWrong).toBe(false);
  });
  it('คลื่นพลังงานสูง: doubles the next correct answer', () => {
    const { doc, ids } = started();
    toSpecial(doc, ids[0], 'sp-high-energy');
    doc.public.turnIndex = 2; // make u1 next after u3
    doc.public.turn.playerId = ids[2]; doc.public.phase = 'ROLLING'; doc.public.turn.awaiting = 'roll';
    placeFor(doc, ids[2], 2, 1); roll(doc, ids[2], rigged([1]));
    toWave(doc, ids[0], 'S:s03');
    answer(doc, ids[0], ['transverse', 'mechanical'], rigged());
    expect(doc.public.players[ids[0]].score).toBe(8);   // 2 × 2 (all correct) × 2 (high energy)
  });
  it('แหล่งกำเนิดคลื่น: next situation card is teamwork; wrong = minus double points', () => {
    const { doc, ids } = started();
    doc.public.players[ids[1]].score = 10;
    toSpecial(doc, ids[0], 'sp-source');
    expect(doc.public.teamworkNext).toBeTruthy();
    toWave(doc, ids[1], 'S:s03');
    expect(doc.public.turn.card?.teamwork).toBe(true);
    answer(doc, ids[1], ['electromagnetic'], rigged());
    expect(doc.public.players[ids[1]].score).toBe(6);    // 10 − 2×2
    expect(doc.public.teamworkNext).toBeNull();
  });
  it('คลื่นสะท้อน: odd roll moves back, even roll moves forward', () => {
    const { doc, ids } = started();
    const l = firstOf(doc, 'LIGHTNING');
    toSpecial(doc, ids[0], 'sp-reflection');                 // rng queue empty → 0.5 → die 4 (even)
    expect(doc.public.players[ids[0]].position).toBe(l + 4);
    const b = started();
    placeFor(b.doc, b.ids[0], l, 2); b.doc.secret.decks.special = ['sp-reflection'];
    roll(b.doc, b.ids[0], rigged([2, 3]));
    expect(b.doc.public.players[b.ids[0]].position).toBe(l - 3);
  });
  it('คลื่นหักเห: offers a move to the next cell of the same colour', () => {
    const { doc, ids } = started();
    toSpecial(doc, ids[0], 'sp-refraction');
    const pos = doc.public.players[ids[0]].position;
    const color = doc.public.board.cells[pos].color;
    const target = doc.public.board.cells.findIndex((c, i) => i > pos && c.color === color);
    expect(doc.public.turn.card?.options?.[0]).toContain(`ช่อง ${target}`);
    choose(doc, ids[0], 0, rigged());
    expect(doc.public.players[ids[0]].position).toBe(target);
  });
  it('คลื่นเสียงก้อง: rolls back then forward', () => {
    const { doc, ids } = started();
    const l = firstOf(doc, 'LIGHTNING');
    placeFor(doc, ids[0], l, 2); doc.secret.decks.special = ['sp-echo'];
    roll(doc, ids[0], rigged([2, 1, 5]));
    expect(doc.public.players[ids[0]].position).toBe(l - 1 + 5);
    expect(doc.public.turn.move?.dice).toEqual([1, 5]);
  });
  it('choice timeout applies the first option', () => {
    const { doc, ids } = started();
    toSpecial(doc, ids[0], 'sp-new-knowledge');
    const ctx = rigged(); ctx.now += 61_000 + moveAnimationMs(doc.public.turn.move);
    timeout(doc, ctx);
    expect(doc.public.players[ids[0]].score).toBe(10);
  });
  it('good-deed cards wait for teacher approval', () => {
    const { doc, ids } = started({ goodDeedCardsEnabled: true });
    toSpecial(doc, ids[0], 'gd-explain');
    expect(doc.public.phase).toBe('RESOLVING');
    expect(doc.public.turn.awaiting).toBe('teacher');
    teacherJudge(doc, 'approve', rigged());
    expect(doc.public.players[ids[0]].score).toBe(5);
    expect(cur(doc)).toBe(ids[1]);
  });
  it('card effects never move a token outside 0…FINISH', () => {
    const { doc, ids } = started();
    doc.public.players[ids[0]].position = 1;
    applyEffect(doc, ids[0], { op: 'move', steps: -10 }, rigged());
    expect(doc.public.players[ids[0]].position).toBe(0);
  });
});

describe('game end & teacher controls', () => {
  it('highest score wins when the first team reaches FINISH', () => {
    const { doc, ids } = started();
    doc.public.players[ids[1]].score = 30;
    const fin = doc.public.board.cells.length - 1;
    doc.public.players[ids[0]].position = fin - 1;
    roll(doc, ids[0], rigged([1]));
    expect(doc.public.status).toBe('FINISHED');
    const res = doc.public.results!;
    expect(res[0].playerId).toBe(ids[1]);
    expect(res[0].winner).toBe(true);
    expect(res.find(r => r.playerId === ids[0])!.winner).toBe(false);
  });
  it('first-to-finish mode makes the finisher the winner', () => {
    const { doc, ids } = started({ winCondition: 'firstToFinish' });
    doc.public.players[ids[1]].score = 30;
    doc.public.players[ids[0]].position = doc.public.board.cells.length - 2;
    roll(doc, ids[0], rigged([1]));
    expect(doc.public.results![0].playerId).toBe(ids[0]);
    expect(doc.public.results![0].winner).toBe(true);
  });
  it('time limit ends the game', () => {
    const { doc } = started({ timeLimitMinutes: 30 });
    const ctx = rigged(); ctx.now += 31 * 60_000;
    expect(timeout(doc, ctx)).toBe(true);
    expect(doc.public.endReason).toBe('timeLimit');
  });
  it('pause blocks actions; resume extends deadlines', () => {
    const { doc, ids } = started({ timeLimitMinutes: 30 });
    toWave(doc, ids[0], 'S:s03');
    const dl = doc.public.turn.deadline!, ends = doc.public.endsAt!;
    pauseGame(doc, rigged());
    expect(errCode(() => answer(doc, ids[0], ['transverse'], rigged()))).toBe('failed-precondition');
    const ctx = rigged(); ctx.now += 10_000;
    resumeGame(doc, ctx);
    expect(doc.public.turn.deadline).toBe(dl + 10_000);
    expect(doc.public.endsAt).toBe(ends + 10_000);
  });
  it('removing the current player passes the turn on', () => {
    const { doc, ids } = started();
    removePlayer(doc, ids[0], rigged());
    expect(cur(doc)).toBe(ids[1]);
    expect(doc.public.order).toEqual([ids[1], ids[2]]);
    expect(doc.members[ids[0]]).toBeUndefined();
  });
  it('teacher score adjustment is bounded', () => {
    const { doc, ids } = started();
    adjustScore(doc, ids[0], 5, rigged());
    expect(doc.public.players[ids[0]].score).toBe(5);
    expect(errCode(() => adjustScore(doc, ids[0], 1000, rigged()))).toBe('invalid-argument');
  });
  it('idempotency keys reject duplicates', () => {
    const { doc } = started();
    expect(markRequest(doc, 'req-12345678', 1)).toBe(true);
    expect(markRequest(doc, 'req-12345678', 2)).toBe(false);
    expect(errCode(() => markRequest(doc, 'x', 3))).toBe('invalid-argument');
  });
});

describe('room creation', () => {
  it('starts in WAITING with an empty secret deck', () => {
    const d = createRoomDoc({ id: 'r', code: 'C', name: 'n', hostUid: 'h', hostName: 'h', settings: sanitizeSettings({}), board: DEFAULT_BOARD, content: defaultContent(), now: 1 });
    expect(d.public.status).toBe('WAITING');
    expect(d.secret.decks.wave).toEqual([]);
  });
});
