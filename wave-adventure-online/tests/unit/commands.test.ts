import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { applyHostAction, applyPlayerCommand, nextDeadline } from '../../shared/commands';
import { defaultContent } from '../../shared/defaults';
import { EngineError } from '../../shared/engine';
import { room, started, rigged } from './helpers';

const ctx = rigged();
const join = (name = 'ทีมใหม่', color = '#06b6d4') => ({ t: 'join' as const, name, avatar: 'surfer', color });

describe('player commands (host runtime)', () => {
  it('join validates name/color and blocks the host from joining as a player', () => {
    const { doc } = room({}, 1);
    expect(() => applyPlayerCommand(doc, 'n1', join('x'), ctx)).toThrow(EngineError);
    expect(() => applyPlayerCommand(doc, 'n1', join('ทีม', '#123456'), ctx)).toThrow(/สี/);
    expect(() => applyPlayerCommand(doc, 'teacher', join(), ctx)).toThrow(/ครู/);
    expect(applyPlayerCommand(doc, 'n1', join('<b>ทีม</b>'), ctx)).toEqual({ rejoined: false });
    expect(doc.public.players.n1.name).toBe('bทีม/b');
    expect(doc.members.n1).toBe(true);
  });
  it('requireSchoolLogin needs a verified student link; the same student on a new device takes over the seat', () => {
    const { doc } = room({ requireSchoolLogin: true }, 0);
    expect(() => applyPlayerCommand(doc, 'a', join(), ctx)).toThrow(/เลขประจำตัว/);
    const link = { sid: '01997', name: 'ด.ญ.ทดลอง', classroom: 'ม.5/1' };
    applyPlayerCommand(doc, 'a', join(), ctx, link);
    expect(doc.public.players.a.sid).toBe('01997');
    expect(applyPlayerCommand(doc, 'b', join('อื่น'), ctx, link)).toEqual({ rejoined: true });
    expect(doc.public.players.b.name).toBe('ทีมใหม่');
    expect(doc.public.players.a).toBeUndefined();
    expect(doc.members.a).toBeUndefined();
  });
  it('roll returns the dice and only works on your own turn; unknown commands are rejected', () => {
    const { doc, ids } = started();
    const cur = doc.public.turn.playerId!;
    const other = ids.find(i => i !== cur)!;
    expect(() => applyPlayerCommand(doc, other, { t: 'roll' }, ctx)).toThrow(/ตา/);
    const r = applyPlayerCommand(doc, cur, { t: 'roll' }, ctx);
    expect(r.dice).toBeGreaterThanOrEqual(1);
    expect(() => applyPlayerCommand(doc, cur, { t: 'adjust' } as never, ctx)).toThrow(EngineError);
  });
  it('answers stored by RTDB as objects ({0:..}) are converted back to arrays', () => {
    const { doc } = started();
    let guard = 0;
    while (doc.public.turn.awaiting !== 'answer' && guard++ < 200) {
      const p = doc.public.turn.playerId!;
      if (doc.public.turn.awaiting === 'roll') applyPlayerCommand(doc, p, { t: 'roll' }, ctx);
      else if (doc.public.turn.awaiting === 'choice') applyPlayerCommand(doc, p, { t: 'choose', option: 0 }, ctx);
      else applyHostAction(doc, 'skip', {}, ctx);
    }
    expect(doc.public.turn.awaiting).toBe('answer');
    const p = doc.public.turn.playerId!;
    const ans = doc.public.turn.card?.kind === 'question' ? 0 : { 0: 'mechanical', 1: 'transverse' };
    expect(() => applyPlayerCommand(doc, p, { t: 'answer', answer: ans }, ctx)).not.toThrow();
    expect(doc.public.turn.awaiting).not.toBe('answer');
  });
});

describe('host actions & deadlines', () => {
  it('settings can only change before the game starts', () => {
    const { doc } = room();
    applyHostAction(doc, 'settings', { settings: { answerSeconds: 45 } }, ctx);
    expect(doc.public.settings.answerSeconds).toBe(45);
    applyHostAction(doc, 'start', {}, ctx);
    expect(() => applyHostAction(doc, 'settings', { settings: {} }, ctx)).toThrow(/ก่อนเริ่มเกม/);
  });
  it('nextDeadline picks the earliest of the answer deadline and the game time limit', () => {
    const { doc } = started({ timeLimitMinutes: 35 });
    doc.public.turn.deadline = 5000; doc.public.endsAt = 9000;
    expect(nextDeadline(doc)).toBe(5000);
    doc.public.turn.deadline = null;
    expect(nextDeadline(doc)).toBe(9000);
    doc.public.status = 'PAUSED';
    expect(nextDeadline(doc)).toBeNull();
  });
});

describe('setup/wave-content.json', () => {
  it('matches shared/defaults.ts (run `npm run content` after editing the default cards)', () => {
    const file = JSON.parse(readFileSync(new URL('../../setup/wave-content.json', import.meta.url), 'utf8'));
    expect(file).toEqual(JSON.parse(JSON.stringify(defaultContent())));
  });
});
