/* =========================================================
   Commands — แปลง "คำสั่ง" จากผู้เล่น/ครู เป็นการเปลี่ยนสถานะเกมผ่าน Game Engine
   ใช้โดย Host Runtime (เครื่องครู) ซึ่งเป็นผู้ตัดสินเกมเพียงผู้เดียว
   นักเรียนส่งได้แค่คำสั่งของตนเอง (Security Rules บังคับ) ไม่มีสิทธิ์เขียนสถานะเกม
   ========================================================= */
import * as E from './engine';
import { AVATARS, TOKEN_COLORS, sanitizeSettings } from './rules.config';
import type { RoomDoc } from './types';

export const PLAYER_COMMANDS = ['join', 'leave', 'ready', 'roll', 'answer', 'choose'] as const;
export type PlayerCommandType = typeof PLAYER_COMMANDS[number];
export interface PlayerCommand { t: PlayerCommandType; name?: unknown; avatar?: unknown; color?: unknown; ready?: unknown; answer?: unknown; option?: unknown; at?: unknown }

export const HOST_ACTIONS = ['start', 'settings', 'pause', 'resume', 'end', 'skip', 'remove', 'adjust', 'judge'] as const;
export type HostAction = typeof HOST_ACTIONS[number];

/** ข้อมูลนักเรียนที่ยืนยันแล้วโดยระบบโรงเรียน (Apps Script เขียนลง studentLinks/{uid}) */
export interface StudentLink { sid: string; name: string; classroom: string }

export const str = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f<>]/g, '').trim().slice(0, max) : '');
const fail = (code: E.EngineError['code'], msg: string): never => { throw new E.EngineError(code, msg); };

/** RTDB เก็บ array เป็น object {0:..,1:..} → แปลงกลับ */
const asList = (v: unknown): unknown[] | unknown => (v && typeof v === 'object' && !Array.isArray(v) ? Object.keys(v as object).sort((a, b) => +a - +b).map(k => (v as Record<string, unknown>)[k]) : v);

/** คำสั่งของผู้เล่น — คืนค่าผลลัพธ์ที่ส่งกลับให้ผู้เล่น (เช่น แต้มลูกเต๋า) */
export function applyPlayerCommand(doc: RoomDoc, uid: string, cmd: PlayerCommand, ctx: E.Ctx, link: StudentLink | null = null): Record<string, unknown> {
  switch (cmd.t) {
    case 'join': {
      if (doc.public.hostUid === uid) fail('failed-precondition', 'ครูผู้สร้างห้องควบคุมเกมจากหน้า Teacher Dashboard');
      if (doc.public.settings.requireSchoolLogin && !link) fail('permission-denied', 'ห้องนี้ต้องเข้าสู่ระบบด้วยเลขประจำตัวและ PIN ก่อน');
      const name = str(cmd.name, 20);
      if (name.length < 2) fail('invalid-argument', 'ชื่อกลุ่มต้องยาว 2–20 ตัวอักษร');
      const avatar = AVATARS.some(a => a.id === cmd.avatar) ? String(cmd.avatar) : AVATARS[0].id;
      const color = TOKEN_COLORS.find(c => c.hex === cmd.color)?.hex;
      if (!color) fail('invalid-argument', 'กรุณาเลือกสีตัวเดิน');
      if (link) {
        const prev = Object.values(doc.public.players).find(p => p.sid === link.sid && !p.removed);
        if (prev && prev.id !== uid) { E.rebindPlayer(doc, prev.id, uid, ctx.now); return { rejoined: true }; }
      }
      const before = !!doc.public.players[uid];
      E.addPlayer(doc, { uid, name, avatar, color: color!, captain: link ? str(link.name, 60) : undefined, sid: link?.sid }, ctx.now);
      return { rejoined: before };
    }
    case 'leave': E.removePlayer(doc, uid, ctx); return {};
    case 'ready': E.setReady(doc, uid, cmd.ready === true); return {};
    case 'roll': {
      E.timeout(doc, ctx);
      if (doc.public.status !== 'PLAYING') fail('failed-precondition', 'เกมจบแล้ว');
      return { dice: E.roll(doc, uid, ctx) };
    }
    case 'answer': E.answer(doc, uid, asList(cmd.answer), ctx); return {};
    case 'choose': E.choose(doc, uid, cmd.option, ctx); return {};
    default: return fail('invalid-argument', 'คำสั่งไม่ถูกต้อง');
  }
}

/** คำสั่งควบคุมเกมของครู (Host) */
export function applyHostAction(doc: RoomDoc, action: HostAction, extra: Record<string, unknown>, ctx: E.Ctx): unknown {
  const target = typeof extra.playerId === 'string' ? extra.playerId : '';
  switch (action) {
    case 'start': return E.startGame(doc, ctx);
    case 'settings':
      if (doc.public.status !== 'WAITING') fail('failed-precondition', 'แก้ไขกติกาได้ก่อนเริ่มเกมเท่านั้น');
      doc.public.settings = sanitizeSettings(extra.settings); return;
    case 'pause': return E.pauseGame(doc, ctx);
    case 'resume': return E.resumeGame(doc, ctx);
    case 'end': if (doc.public.status === 'WAITING') fail('failed-precondition', 'เกมยังไม่เริ่ม'); return E.endGame(doc, 'teacher', ctx);
    case 'skip': return E.teacherSkipTurn(doc, ctx);
    case 'remove': return E.removePlayer(doc, target, ctx);
    case 'adjust': return E.adjustScore(doc, target, extra.delta, ctx);
    case 'judge': return E.teacherJudge(doc, extra.verdict, ctx);
    default: return fail('invalid-argument', 'คำสั่งไม่ถูกต้อง');
  }
}

/** เวลาที่ Host ต้องตรวจหมดเวลาครั้งถัดไป (null = ไม่มี) */
export function nextDeadline(doc: Pick<RoomDoc, 'public'>): number | null {
  const p = doc.public;
  if (p.status !== 'PLAYING') return null;
  const ds = [p.turn?.deadline, p.endsAt].filter((x): x is number => typeof x === 'number' && x > 0);
  return ds.length ? Math.min(...ds) : null;
}
