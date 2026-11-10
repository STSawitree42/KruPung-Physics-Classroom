/* Game components: dice, interactive board, cards, scoreboard, log */
import { useEffect, useMemo, useRef, useState } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Crosshair, Clock, Crown, Wifi, WifiOff } from 'lucide-react';
import type { PlayerState, PublicCard, RoomPublic, WaveType } from '@shared/types';
import { WAVE_TYPE_LABEL, WAVE_TYPES } from '@shared/waveTypes';
import { Latex, Pawn, avatarEmoji } from './ui';
import { sfx } from '../game/sound';

/* =========================================================
   Dice (3D)
   ========================================================= */
const FACE_ROT: Record<number, string> = { 1: 'rotateX(0deg) rotateY(0deg)', 2: 'rotateX(-90deg) rotateY(0deg)', 3: 'rotateY(-90deg)', 4: 'rotateY(90deg)', 5: 'rotateX(90deg)', 6: 'rotateY(180deg)' };
const PIPS: Record<number, number[]> = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
const FACE_POS: Record<number, string> = { 1: 'translateZ(36px)', 6: 'rotateY(180deg) translateZ(36px)', 2: 'rotateX(90deg) translateZ(36px)', 5: 'rotateX(-90deg) translateZ(36px)', 3: 'rotateY(90deg) translateZ(36px)', 4: 'rotateY(-90deg) translateZ(36px)' };
export function Dice({ value, rolling }: { value: number | null; rolling: boolean }) {
  return (
    <div className="dice-scene w-[72px] h-[72px]" aria-label={rolling ? 'กำลังทอยลูกเต๋า' : value ? `ลูกเต๋าแต้ม ${value}` : 'ลูกเต๋า'} role="img">
      <div className={`dice ${rolling ? 'rolling' : ''}`} style={{ transform: rolling ? undefined : FACE_ROT[value || 1] }}>
        {[1, 2, 3, 4, 5, 6].map(f => (
          <div key={f} className="dice-face" style={{ transform: FACE_POS[f] }}>
            {Array.from({ length: 9 }, (_, i) => PIPS[f].includes(i) ? <i key={i} style={f === 1 ? { background: '#E11D48', width: 16, height: 16 } : undefined} /> : <span key={i} />)}
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   Board with animated tokens
   ========================================================= */
export function useAnimatedPositions(room: RoomPublic | null) {
  const [pos, setPos] = useState<Record<string, number>>({});
  const lastSeq = useRef<number | null>(null);
  const animating = useRef<string | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => {
    if (!room) return;
    const actual: Record<string, number> = {};
    Object.values(room.players).forEach(p => { actual[p.id] = p.position; });
    const mv = room.turn?.move;
    if (lastSeq.current === null) { lastSeq.current = mv?.seq ?? 0; setPos(actual); return; }
    if (mv && mv.seq !== lastSeq.current) {
      // การเคลื่อนที่ใหม่จาก Backend → เดินทีละช่องตามเส้นทางจริงบนกระดาน
      lastSeq.current = mv.seq;
      timers.current.forEach(clearTimeout); timers.current = [];
      animating.current = mv.path.length ? mv.playerId : null;
      setPos({ ...actual, [mv.playerId]: mv.path.length ? mv.from : mv.to });
      mv.path.forEach((cell, i) => timers.current.push(setTimeout(() => {
        setPos(p => ({ ...p, [mv.playerId]: cell })); sfx.step();
        if (i === mv.path.length - 1) animating.current = null;
      }, 320 * (i + 1))));
      return;
    }
    setPos(p => { const out = { ...actual }; if (animating.current) out[animating.current] = p[animating.current]; return out; });
  }, [room]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  return pos;
}

export function Board({ room, me, highlight }: { room: RoomPublic; me?: string | null; highlight?: number | null }) {
  const pos = useAnimatedPositions(room);
  const [zoom, setZoom] = useState(1);
  const wrap = useRef<HTMLDivElement>(null);
  const b = room.board;
  const players = Object.values(room.players).filter(p => !p.removed);
  const byCell = useMemo(() => {
    const m: Record<number, PlayerState[]> = {};
    players.forEach(p => { const c = pos[p.id] ?? p.position; (m[c] = m[c] || []).push(p); });
    return m;
  }, [players, pos]);
  const focus = (cell: number) => {
    const el = wrap.current; const c = b.cells[cell]; if (!el || !c || c.x == null || c.y == null) return;
    el.scrollTo({ left: c.x * el.scrollWidth - el.clientWidth / 2, top: c.y * el.scrollHeight - el.clientHeight / 2, behavior: 'smooth' });
  };
  const current = room.turn?.playerId;
  const currentCell = current ? (pos[current] ?? room.players[current]?.position ?? 0) : null;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (zoom > 1 && currentCell != null) focus(currentCell); }, [zoom, currentCell]);
  return (
    <div className="relative">
      <div ref={wrap} className="overflow-auto scroll-thin rounded-2xl border border-neon/25 shadow-[0_0_40px_rgba(0,229,255,.12)] touch-pan-x touch-pan-y" style={{ maxHeight: '72dvh' }}>
        <div className="relative select-none" style={{ width: `${zoom * 100}%`, aspectRatio: String(b.aspect) }}>
          <img src={b.image} alt="กระดานเกม การผจญภัยในโลกคลื่น" className="absolute inset-0 w-full h-full object-cover" draggable={false} />
          {highlight != null && b.cells[highlight]?.x != null && (
            <div className="absolute rounded-full border-4 border-gold pulse-glow pointer-events-none" style={{ left: `${b.cells[highlight].x! * 100}%`, top: `${b.cells[highlight].y! * 100}%`, width: '7%', aspectRatio: '1', transform: 'translate(-50%,-50%)' }} />
          )}
          {Object.entries(byCell).map(([cell, list]) => list.map((p, i) => {
            const c = b.cells[Number(cell)]; if (!c || c.x == null || c.y == null) return null;
            const n = list.length, ang = (i / n) * Math.PI * 2, off = n > 1 ? 1.6 : 0;
            return (
              <div key={p.id} className={`token ${p.id === current ? 'active' : ''}`} style={{ left: `calc(${c.x * 100}% + ${Math.cos(ang) * off}%)`, top: `calc(${c.y * 100}% + ${Math.sin(ang) * off * b.aspect}%)` }} title={p.name}>
                <div className="relative flex flex-col items-center">
                  <span className="absolute -top-5 text-lg" aria-hidden>{avatarEmoji(p.avatar)}</span>
                  <Pawn color={p.color} size={zoom > 1.4 ? 34 : 24} />
                  {p.id === me && <span className="absolute -bottom-4 text-[10px] font-bold neon-text">คุณ</span>}
                </div>
              </div>
            );
          }))}
        </div>
      </div>
      <div className="absolute right-2 top-2 flex flex-col gap-1">
        <button className="btn btn-ghost btn-sm !px-2 bg-space/80" onClick={() => setZoom(z => Math.min(3, +(z + 0.5).toFixed(1)))} aria-label="ซูมเข้า"><ZoomIn size={18} /></button>
        <button className="btn btn-ghost btn-sm !px-2 bg-space/80" onClick={() => setZoom(z => Math.max(1, +(z - 0.5).toFixed(1)))} aria-label="ซูมออก"><ZoomOut size={18} /></button>
        <button className="btn btn-ghost btn-sm !px-2 bg-space/80" onClick={() => setZoom(1)} aria-label="ดูทั้งกระดาน"><Maximize2 size={18} /></button>
        {current && <button className="btn btn-ghost btn-sm !px-2 bg-space/80" onClick={() => { if (zoom === 1) setZoom(2); else focus(pos[current] ?? 0); }} aria-label="ไปยังตัวเดินของผู้เล่นปัจจุบัน"><Crosshair size={18} /></button>}
      </div>
    </div>
  );
}

/* =========================================================
   Countdown
   ========================================================= */
export function Countdown({ deadline, offset, total }: { deadline: number | null | undefined; offset: number; total: number }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 250); return () => clearInterval(t); }, []);
  if (!deadline) return null;
  const left = Math.max(0, Math.ceil((deadline - (now + offset)) / 1000));
  const pct = Math.max(0, Math.min(100, (left / total) * 100));
  return (
    <div className="flex items-center gap-2" aria-live="off">
      <Clock size={16} className={left <= 10 ? 'text-bad' : 'text-ice'} />
      <div className="flex-1 h-2.5 rounded-full bg-white/10 overflow-hidden"><div className={`h-full transition-all ${left <= 10 ? 'bg-bad' : 'bg-neon'}`} style={{ width: `${pct}%` }} /></div>
      <span className={`font-display text-sm w-10 text-right ${left <= 10 ? 'text-bad' : 'neon-text'}`}>{left}s</span>
    </div>
  );
}

/* =========================================================
   Card views
   ========================================================= */
const BACK: Record<string, string> = { wave: '/assets/cards/backs/wave-back.webp', special: '/assets/cards/backs/special-back.webp' };

export function FlipCard({ card, flipped }: { card: PublicCard; flipped: boolean }) {
  return (
    <div className={`flip w-[150px] sm:w-[190px] mx-auto ${flipped ? 'flipped' : ''}`}>
      <div className="flip-inner">
        <img src={BACK[card.deck]} alt="หลังการ์ด" className="flip-face w-full rounded-xl shadow-2xl" />
        <div className="flip-back flip-face">
          {card.image ? <img src={card.image} alt={card.title} className="w-full rounded-xl shadow-2xl" />
            : <div className="w-full h-full rounded-xl bg-gradient-to-b from-royal to-navy border border-neon/50 grid place-items-center p-3 text-center font-semibold">{card.title}</div>}
        </div>
      </div>
    </div>
  );
}

export function WaveTypeChooser({ value, onChange, disabled, correct }: { value: WaveType[]; onChange?: (v: WaveType[]) => void; disabled?: boolean; correct?: WaveType[][] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" role="group" aria-label="เลือกการ์ดประเภทคลื่น (เลือกได้มากกว่า 1 ใบ)">
      {WAVE_TYPES.map(t => {
        const on = value.includes(t);
        const ok = correct?.some(a => a.includes(t));
        return (
          <button key={t} type="button" disabled={disabled} aria-pressed={on} onClick={() => { sfx.click(); onChange?.(on ? value.filter(v => v !== t) : [...value, t]); }}
            className={`relative rounded-xl overflow-hidden border-2 transition text-left ${on ? 'border-neon shadow-[0_0_20px_rgba(0,229,255,.55)] -translate-y-1' : 'border-white/10'} ${disabled && !on ? 'opacity-60' : ''}`}>
            <img src={WAVE_TYPE_LABEL[t].image} alt="" className="w-full aspect-[3/4] object-cover object-top" />
            <div className="absolute inset-x-0 bottom-0 bg-space/85 px-2 py-1 text-center text-sm font-semibold">{WAVE_TYPE_LABEL[t].th}</div>
            {on && <div className="absolute top-1 right-1 w-7 h-7 rounded-full bg-neon text-space grid place-items-center font-bold">✓</div>}
            {correct && ok && <div className="absolute top-1 left-1 chip !bg-good/90 !text-space !border-good">เฉลย</div>}
          </button>
        );
      })}
    </div>
  );
}

const VERDICT: Record<string, { t: string; c: string }> = { full: { t: '✅ ถูกทั้งหมด!', c: 'text-good' }, partial: { t: '🟡 ถูกบางส่วน', c: 'text-gold' }, wrong: { t: '❌ ไม่ถูกต้อง', c: 'text-bad' } };
const answerText = (sets: WaveType[][]) => sets.map(s => s.map(t => WAVE_TYPE_LABEL[t].th).join(' + ')).join('  หรือ  ');

export function RevealPanel({ card, playerName }: { card: PublicCard; playerName: string }) {
  const r = card.reveal; if (!r) return null;
  if (card.kind === 'special') return (
    <div className="text-center">
      <div className="text-sm text-soft">{playerName} เปิดการ์ดพิเศษ</div>
      <h3 className="text-xl font-semibold neon-text">{card.title}</h3>
      <p className="mt-1">{card.text}</p>
      {typeof r.selection === 'string' && r.selection && <p className="mt-2 chip mx-auto">เลือก: {r.selection}</p>}
    </div>
  );
  const v = r.verdict ? VERDICT[r.verdict] : null;
  return (
    <div>
      <div className="text-center">
        <div className="text-sm text-soft">{playerName}</div>
        {v && <div className={`text-2xl font-bold ${v.c}`}>{r.timeout ? '⏰ หมดเวลา' : v.t} <span className="font-display">{(r.points ?? 0) >= 0 ? '+' : ''}{r.points ?? 0}</span></div>}
      </div>
      {card.kind === 'situation' && r.answers && <>
        {Array.isArray(r.selection) && <p className="mt-2 text-sm">คำตอบที่เลือก: <b>{(r.selection as WaveType[]).map(t => WAVE_TYPE_LABEL[t].th).join(' + ') || '-'}</b></p>}
        <p className="mt-1 text-sm">เฉลย: <b className="text-good">{answerText(r.answers)}</b></p>
      </>}
      {card.kind === 'question' && card.choices && r.answer != null && <p className="mt-2 text-sm">เฉลย: <b className="text-good"><Latex text={card.choices[r.answer]} /></b></p>}
      {r.explanation && <p className="mt-2 text-sm text-soft leading-relaxed">📖 <Latex text={r.explanation} /></p>}
    </div>
  );
}

/* =========================================================
   Scoreboard & log
   ========================================================= */
export function Scoreboard({ room, presence, me, onSelect }: { room: RoomPublic; presence?: Record<string, { online: boolean }>; me?: string | null; onSelect?: (uid: string) => void }) {
  const fin = room.board.cells.length - 1;
  const list = (room.order.length ? room.order.map(u => room.players[u]).filter(Boolean) : Object.values(room.players)).filter(p => !p.removed);
  const top = Math.max(0, ...list.map(p => p.score));
  return (
    <div className="flex flex-col gap-2" aria-label="คะแนนผู้เล่น">
      {list.map(p => {
        const online = presence ? !!presence[p.id]?.online : true;
        const turn = room.turn?.playerId === p.id && room.status !== 'FINISHED';
        return (
          <button key={p.id} type="button" onClick={() => onSelect?.(p.id)} disabled={!onSelect}
            className={`glass-soft text-left px-3 py-2 flex items-center gap-3 transition ${turn ? 'ring-2 ring-neon shadow-[0_0_18px_rgba(0,229,255,.35)]' : ''}`}>
            <span className="w-9 h-9 rounded-full grid place-items-center text-xl shrink-0" style={{ background: p.color + '33', border: `2px solid ${p.color}` }} aria-hidden>{avatarEmoji(p.avatar)}</span>
            <span className="flex-1 min-w-0">
              <span className="flex items-center gap-1 font-semibold truncate">{p.name}{p.id === me && <span className="chip !py-0">คุณ</span>}{p.score === top && top > 0 && <Crown size={14} className="text-gold shrink-0" />}</span>
              <span className="block text-xs text-soft truncate">ช่อง {p.position}/{fin} · ✅{p.stats.correct} 🟡{p.stats.partial} ❌{p.stats.wrong}{p.skipTurns ? ` · พัก ${p.skipTurns} ตา` : ''}{p.captain ? ` · ${p.captain}` : ''}</span>
              <span className="block h-1.5 mt-1 rounded-full bg-white/10 overflow-hidden"><span className="block h-full bg-gradient-to-r from-electric to-neon" style={{ width: `${(p.position / fin) * 100}%` }} /></span>
            </span>
            <span className="font-display text-xl neon-text w-12 text-right">{p.score}</span>
            {presence && (online ? <Wifi size={14} className="text-good shrink-0" aria-label="ออนไลน์" /> : <WifiOff size={14} className="text-bad shrink-0" aria-label="ออฟไลน์" />)}
          </button>
        );
      })}
    </div>
  );
}

export function LogFeed({ room, max = 12 }: { room: RoomPublic; max?: number }) {
  const entries = Object.values(room.log || {}).sort((a, b) => b.seq - a.seq).slice(0, max);
  return (
    <ol className="flex flex-col gap-1 text-sm max-h-64 overflow-y-auto scroll-thin pr-1" aria-label="ประวัติการเล่น">
      {entries.map(e => <li key={e.seq} className="text-soft leading-snug"><span className="text-white/90">{e.text}</span></li>)}
    </ol>
  );
}
