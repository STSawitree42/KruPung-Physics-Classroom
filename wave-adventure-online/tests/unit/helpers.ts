import { createRoomDoc, addPlayer, setReady, startGame, type Ctx } from '../../shared/engine';
import { DEFAULT_SETTINGS, sanitizeSettings } from '../../shared/rules.config';
import { DEFAULT_BOARD } from '../../shared/board.config';
import { defaultContent } from '../../shared/defaults';
import type { GameSettings, RoomDoc } from '../../shared/types';

/** RNG ที่คุมผลลูกเต๋าได้: ใส่ค่าแต้ม 1–6 ที่ต้องการตามลำดับ (ค่าที่ไม่ใช่แต้มใช้ 0.5) */
export function rigged(dice: number[] = []) {
  const q = [...dice];
  const ctx: Ctx & { push: (...d: number[]) => void; now: number } = {
    now: 1_000_000,
    rng: () => (q.length ? (q.shift()! - 1) / 6 + 0.01 : 0.5),
    push: (...d: number[]) => { q.push(...d); }
  };
  return ctx;
}

export function room(settings: Partial<GameSettings> = {}, players = 3): { doc: RoomDoc; ids: string[] } {
  const doc = createRoomDoc({ id: 'r1', code: 'ABC234', name: 'ห้องทดสอบ', hostUid: 'teacher', hostName: 'ครู', settings: sanitizeSettings({ ...DEFAULT_SETTINGS, turnOrder: 'join', timeLimitMinutes: 0, ...settings }), board: structuredClone(DEFAULT_BOARD), content: defaultContent(), now: 1_000_000 });
  const ids: string[] = [];
  const colors = ['#ef4444', '#facc15', '#22c55e', '#3b82f6', '#a855f7', '#06b6d4'];
  for (let i = 0; i < players; i++) {
    const uid = 'u' + (i + 1);
    addPlayer(doc, { uid, name: 'ทีม' + (i + 1), avatar: 'surfer', color: colors[i] }, 1_000_000 + i);
    setReady(doc, uid, true);
    ids.push(uid);
  }
  return { doc, ids };
}

export function started(settings: Partial<GameSettings> = {}, players = 3) {
  const r = room(settings, players);
  const ctx = rigged();
  startGame(r.doc, ctx);
  return { ...r, ctx };
}

/** วางผู้เล่นไว้ที่ช่องเป้าหมาย - d เพื่อให้ทอยแต้ม d แล้วไปหยุดที่ target */
export const placeFor = (doc: RoomDoc, uid: string, target: number, d: number) => { doc.public.players[uid].position = target - d; };
export const firstOf = (doc: RoomDoc, type: string) => doc.public.board.cells.findIndex(c => c.type === type);
