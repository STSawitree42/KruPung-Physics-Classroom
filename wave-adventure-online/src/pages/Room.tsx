/* =========================================================
   Room page — Lobby · Main Game Board · Result
   ใช้ทั้งนักเรียน (ผู้เล่น) และครู (Host: ควบคุมเกม)
   ========================================================= */
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Copy, LogOut, Play, Pause, SkipForward, Flag, Users, Check, Dice5, Gavel, RotateCcw, Download, Trophy, Minus, Plus, UserX } from 'lucide-react';
import type { PublicCard, RoomPublic, WaveType } from '@shared/types';
import { api, lastRoom } from '../services/api';
import { useAuthUser, useHostRuntime, usePresence, usePresenceList, useRoom, useServerOffset } from '../hooks/useFirebase';
import { Board, Countdown, Dice, FlipCard, LogFeed, RevealPanel, Scoreboard, WaveTypeChooser } from '../components/game';
import { Latex, Loading, Modal, QR, avatarEmoji, go, useToast } from '../components/ui';
import { sfx } from '../game/sound';
import { downloadCsv } from '../utils/csv';
import { ANIM, moveAnimationMs } from '@shared/engine';

export default function RoomPage({ roomId, asHost }: { roomId: string; asHost?: boolean }) {
  const { user, ready } = useAuthUser();
  const { room, error, loading } = useRoom(user ? roomId : null);
  const uid = user?.uid || null;
  usePresence(room ? roomId : null, uid);
  const presence = usePresenceList(room ? roomId : null);
  const isHost = !!room && room.hostUid === uid;
  // เครื่องครูเป็นผู้ตัดสินเกม (รับคำสั่งนักเรียน ทอยลูกเต๋า ตรวจคำตอบ ตรวจหมดเวลา) ตลอดที่เปิดหน้านี้
  useHostRuntime(isHost ? roomId : null, isHost ? uid : null);
  const hostOffline = !!room && !isHost && room.status !== 'FINISHED' && presence[room.hostUid]?.online !== true;

  useEffect(() => { if (room && !isHost) lastRoom.set({ roomId, code: room.code }); }, [room, isHost, roomId]);
  useEffect(() => { if (room && asHost && !isHost && uid) go(`/room/${roomId}`); }, [room, asHost, isHost, uid, roomId]);

  if (!ready || (user && loading)) return <Loading text="กำลังเชื่อมต่อห้อง..." />;
  if (!user || error === 'NO_ACCESS' || (!loading && !room)) {
    return (
      <div className="max-w-md mx-auto glass p-6 text-center page-enter">
        <h2 className="text-xl font-semibold mb-2">ยังไม่ได้อยู่ในห้องนี้</h2>
        <p className="text-soft mb-4">เข้าร่วมด้วยรหัสห้องก่อน หรือห้องนี้อาจถูกปิดไปแล้ว</p>
        <button className="btn" onClick={() => { lastRoom.clear(); go('/join'); }}>ไปหน้าเข้าร่วมห้อง</button>
      </div>
    );
  }
  if (!room) return <Loading />;
  const banner = hostOffline && <div role="status" className="glass-soft p-3 mb-3 text-sm text-gold text-center">⏳ เครื่องครูยังไม่ได้เปิดหน้าควบคุมห้องนี้ — เกมจะทำงานต่อเมื่อครูเปิดหน้าห้องค้างไว้</div>;
  if (banner && room.status !== 'WAITING') return <>{banner}<GameView room={room} uid={uid!} isHost={isHost} presence={presence} /></>;
  if (banner) return <>{banner}<Lobby room={room} uid={uid!} isHost={isHost} presence={presence} /></>;
  if (room.status === 'WAITING') return <Lobby room={room} uid={uid!} isHost={isHost} presence={presence} />;
  if (room.status === 'FINISHED') return <ResultView room={room} uid={uid!} isHost={isHost} />;
  return <GameView room={room} uid={uid!} isHost={isHost} presence={presence} />;
}

/* =========================================================
   Lobby
   ========================================================= */
function Lobby({ room, uid, isHost, presence }: { room: RoomPublic; uid: string; isHost: boolean; presence: Record<string, { online: boolean }> }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const me = room.players[uid];
  const players = Object.values(room.players).filter(p => !p.removed).sort((a, b) => a.joinedAt - b.joinedAt);
  const joinUrl = `${location.origin}${location.pathname}#/join?code=${room.code}`;
  const allReady = players.length >= 2 && players.every(p => p.ready);
  const run = async (fn: () => Promise<unknown>, ok?: string) => { setBusy(true); try { await fn(); if (ok) toast(ok, 'good'); } catch (e) { toast((e as Error).message, 'bad'); } finally { setBusy(false); } };
  const s = room.settings;
  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-4 page-enter [&>*]:min-w-0">
      <section className="glass p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="chip mb-2">GAME LOBBY</div>
            <h1 className="text-2xl font-semibold">{room.name}</h1>
            <p className="text-soft text-sm">ครูผู้ดูแล: {room.hostName} · ผู้เล่น {players.length}/{s.maxPlayers} กลุ่ม</p>
          </div>
          {!isHost && <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => run(async () => { await api.leaveRoom(room.id); lastRoom.clear(); go('/home'); })}><LogOut size={16} />ออกจากห้อง</button>}
        </div>
        <div className="divider my-4" />
        <h2 className="font-semibold mb-2 flex items-center gap-2"><Users size={18} /> ผู้เล่นในห้อง</h2>
        <ul className="grid sm:grid-cols-2 gap-2">
          {players.map(p => (
            <li key={p.id} className="glass-soft p-3 flex items-center gap-3">
              <span className="w-11 h-11 rounded-full grid place-items-center text-2xl" style={{ background: p.color + '33', border: `2px solid ${p.color}` }}>{avatarEmoji(p.avatar)}</span>
              <span className="flex-1 min-w-0"><b className="block truncate">{p.name}{p.id === uid && ' (คุณ)'}</b><span className="text-xs text-soft">{p.captain || (presence[p.id]?.online ? 'ออนไลน์' : 'ออฟไลน์')}</span></span>
              <span className={`chip ${p.ready ? '!border-good !text-good' : '!text-soft'}`}>{p.ready ? 'พร้อม' : 'ยังไม่พร้อม'}</span>
              {isHost && <button className="btn btn-danger btn-sm !px-2" title="นำออกจากห้อง" aria-label={`นำ ${p.name} ออก`} onClick={() => run(() => api.host(room.id, 'remove', { playerId: p.id }))}><UserX size={16} /></button>}
            </li>
          ))}
          {!players.length && <li className="text-soft">ยังไม่มีผู้เล่น ให้นักเรียนสแกน QR Code หรือกรอกรหัสห้อง</li>}
        </ul>
        <div className="mt-5 flex flex-wrap gap-2">
          {me && <button className={`btn btn-lg ${me.ready ? 'btn-ghost' : 'btn-good'}`} disabled={busy} onClick={() => run(() => api.setReady(room.id, !me.ready))}><Check size={20} />{me.ready ? 'ยกเลิกพร้อม' : 'พร้อมเล่น!'}</button>}
          {isHost && <button className="btn btn-lg" disabled={busy || !allReady} onClick={() => run(() => api.startGame(room.id), 'เริ่มเกมแล้ว!')}><Play size={20} />เริ่มเกม</button>}
          {isHost && !allReady && <p className="text-soft text-sm self-center">รอผู้เล่นอย่างน้อย 2 กลุ่ม และทุกกลุ่มกด “พร้อม”</p>}
          {!isHost && <p className="text-soft text-sm self-center">รอครูเริ่มเกม...</p>}
        </div>
        <div className="divider my-5" />
        <h2 className="font-semibold mb-2">กติกาของห้องนี้</h2>
        <ul className="text-sm text-soft grid sm:grid-cols-2 gap-x-6 gap-y-1">
          <li>🌊 ช่องคลื่น: {s.waveDeck === 'situation' ? 'การ์ดสถานการณ์ (เลือกประเภทคลื่น)' : s.waveDeck === 'question' ? 'คำถามฟิสิกส์ 4 ตัวเลือก' : 'การ์ดสถานการณ์ + คำถาม'}</li>
          <li>⏱ เวลาตอบ {s.answerSeconds} วินาที</li>
          <li>✅ ตอบถูก: คะแนนตามการ์ด{s.doubleForFullAnswer ? ' · ถูกทั้งหมด ×2' : ''}</li>
          <li>❌ ตอบผิด: ถอยหลัง {s.wrongMoveBack} ช่อง{s.wrongPenaltyPoints ? ` · −${s.wrongPenaltyPoints}` : ''}</li>
          <li>⚡ ช่องฟ้าผ่า: {s.specialCardsEnabled ? 'เปิดการ์ดพิเศษ' : 'ปิด'}</li>
          <li>🏁 {s.winCondition === 'highestScore' ? 'จบเมื่อกลุ่มแรกถึงเส้นชัย · คะแนนสูงสุดชนะ' : 'ถึงเส้นชัยก่อนชนะ'}</li>
          <li>🕒 เวลาเกม {s.timeLimitMinutes ? s.timeLimitMinutes + ' นาที' : 'ไม่จำกัด'}</li>
          <li>🎲 ลำดับ: {s.turnOrder === 'diceOff' ? 'ทอยลูกเต๋า แต้มสูงสุดเริ่มก่อน' : s.turnOrder === 'random' ? 'สุ่ม' : 'ตามลำดับที่เข้าห้อง'}</li>
        </ul>
      </section>
      <aside className="glass p-4 sm:p-6 text-center flex flex-col items-center gap-3">
        <div className="text-soft text-sm">รหัสห้อง</div>
        <div className="font-display text-[clamp(1.8rem,10vw,3rem)] tracking-[0.18em] sm:tracking-[0.3em] neon-text max-w-full" aria-label={`รหัสห้อง ${room.code.split('').join(' ')}`}>{room.code}</div>
        <QR value={joinUrl} size={180} />
        <button className="btn btn-ghost btn-sm" onClick={() => { navigator.clipboard?.writeText(joinUrl).then(() => toast('คัดลอกลิงก์แล้ว', 'good')).catch(() => toast(joinUrl)); }}><Copy size={16} />คัดลอกลิงก์เข้าร่วม</button>
        {navigator.share && <button className="btn btn-ghost btn-sm" onClick={() => navigator.share({ title: 'WAVE ADVENTURE ONLINE', text: `เข้าร่วมห้อง ${room.code}`, url: joinUrl }).catch(() => {})}>แชร์ลิงก์</button>}
        <p className="text-xs text-soft">สแกน QR Code หรือเปิดเว็บเกม → “เข้าร่วมห้อง” → กรอกรหัส</p>
      </aside>
    </div>
  );
}

/* =========================================================
   Main game board
   ========================================================= */
function GameView({ room, uid, isHost, presence }: { room: RoomPublic; uid: string; isHost: boolean; presence: Record<string, { online: boolean }> }) {
  const toast = useToast();
  const offset = useServerOffset();
  const [busy, setBusy] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [lastDice, setLastDice] = useState<number | null>(room.turn.move?.kind === 'dice' ? room.turn.move.dice?.[0] ?? null : null);
  const [banner, setBanner] = useState<string | null>(null);
  const [reveal, setReveal] = useState<(PublicCard & { playerId: string; seq: number }) | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const turn = room.turn;
  const current = turn.playerId ? room.players[turn.playerId] : null;
  const myTurn = !!current && current.id === uid && room.status === 'PLAYING';
  const paused = room.status === 'PAUSED';

  // ---- turn banner & sounds ----
  const prevTurn = useRef<string | null>(null);
  useEffect(() => {
    if (!current || prevTurn.current === current.id) return;
    prevTurn.current = current.id;
    setBanner(current.id === uid ? 'ถึงตาของคุณแล้ว! 🎲' : `ตาของ ${current.name}`);
    if (current.id === uid) sfx.turn();
    const t = setTimeout(() => setBanner(null), 1600); return () => clearTimeout(t);
  }, [current, uid]);
  // ---- dice animation + token walk: the card opens only after both finish ----
  const lastMoveSeq = useRef<number | null>(turn.move?.seq ?? null);
  const [moving, setMoving] = useState(false);
  const moveTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => moveTimers.current.forEach(clearTimeout), []);
  const moveSeq = turn.move?.seq ?? null;
  useEffect(() => {
    const mv = turn.move;
    if (!mv || mv.seq === lastMoveSeq.current) return;
    lastMoveSeq.current = mv.seq;
    moveTimers.current.forEach(clearTimeout); moveTimers.current = [];
    const diced = mv.kind === 'dice' || !!mv.dice?.length;
    if (mv.dice?.length) setLastDice(mv.dice[mv.dice.length - 1]);
    if (diced) { setRolling(true); sfx.dice(); moveTimers.current.push(setTimeout(() => setRolling(false), ANIM.diceMs)); }
    // ลูกเต๋าหมุน → ตัวเดินเดินทีละช่อง (ANIM.stepMs ต่อช่อง ตรงกับ Board) → พักสั้น ๆ → เปิดการ์ด
    const wait = moveAnimationMs(mv);
    setMoving(true);
    moveTimers.current.push(setTimeout(() => setMoving(false), wait));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moveSeq]);
  // ---- result of the last resolved card: full panel for the player + teacher, short notice for others ----
  const lastCardSeq = useRef<number | null>(room.lastCard?.seq ?? null);
  const lastCardKey = room.lastCard?.seq ?? null;
  useEffect(() => {
    const lc = room.lastCard;
    if (!lc || lc.seq === lastCardSeq.current) return;
    lastCardSeq.current = lc.seq;
    const v = lc.reveal?.verdict;
    if (lc.kind === 'special') sfx.special(); else if (v === 'full') sfx.correct(); else if (v === 'partial') sfx.partial(); else sfx.wrong();
    if (isHost || lc.playerId === uid) { setReveal(lc); return; }
    const name = room.players[lc.playerId]?.name || '';
    const pts = lc.reveal?.points;
    const msg = lc.kind === 'special' ? `${name} เปิดการ์ดพิเศษ: ${lc.title}` : `${name} ${v === 'full' ? 'ตอบถูกทั้งหมด' : v === 'partial' ? 'ตอบถูกบางส่วน' : 'ตอบไม่ถูก'}${pts ? ` (+${pts})` : ''}`;
    toast(msg, v === 'wrong' ? 'bad' : 'good');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastCardKey]);
  useEffect(() => { if (!reveal) return; const seq = reveal.seq; const t = setTimeout(() => setReveal(r => (r && r.seq === seq ? null : r)), 9000); return () => clearTimeout(t); }, [reveal]);
  // การหมดเวลาตอบ/หมดเวลาเกม ตรวจโดยเครื่องครู (Host Runtime) ตามเวลาเซิร์ฟเวอร์

  const run = async (fn: () => Promise<unknown>) => { if (busy) return; setBusy(true); try { await fn(); } catch (e) { toast((e as Error).message, 'bad'); } finally { setBusy(false); } };
  const doRoll = () => run(async () => { setRolling(true); sfx.dice(); try { await api.roll(room.id); } finally { setTimeout(() => setRolling(false), 400); } });

  const cardOpen = !!turn.card && !turn.card.reveal && (turn.awaiting === 'answer' || turn.awaiting === 'choice' || turn.awaiting === 'teacher');
  // หน้าการ์ดแสดงเฉพาะครูและกลุ่มที่ถึงตา · กลุ่มอื่นดูกระดาน · ครูปิดการ์ดเพื่อดูกระดานแล้วเปิดใหม่ได้
  const cardKey = cardOpen ? `${turn.seq}:${turn.card!.id}` : null;
  const [hostHidden, setHostHidden] = useState<string | null>(null);
  const canSeeCard = myTurn || isHost;
  const showCard = cardOpen && !moving && canSeeCard && !(isHost && hostHidden === cardKey);
  const fin = room.board.cells.length - 1;
  const gameLeft = room.endsAt ? Math.max(0, Math.ceil((room.endsAt - (Date.now() + offset)) / 60000)) : null;

  return (
    <div className="page-enter pb-28 lg:pb-0">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <h1 className="text-lg font-semibold mr-auto">{room.name} <span className="chip ml-1">รอบ {room.round}</span>{gameLeft != null && <span className="chip ml-1">เหลือ ~{gameLeft} นาที</span>}</h1>
        {isHost && <HostControls room={room} />}
      </div>
      {paused && <div className="glass p-3 mb-3 text-center text-gold">⏸ ครูหยุดเกมชั่วคราว</div>}
      {cardOpen && !moving && !showCard && current && (
        <div role="status" className="glass p-3 mb-3 flex flex-wrap items-center justify-center gap-3 text-center">
          <span>🃏 <b style={{ color: current.color }}>{current.name}</b> {turn.awaiting === 'teacher' ? 'รอครูตัดสิน' : turn.card?.deck === 'special' ? 'กำลังเปิดการ์ดพิเศษ' : 'กำลังตอบการ์ด'}{turn.card?.title ? `: ${turn.card.title}` : ''}</span>
          {isHost && <button className="btn btn-sm" onClick={() => setHostHidden(null)}>เปิดการ์ด</button>}
        </div>
      )}
      <div className="grid lg:grid-cols-[1fr_340px] gap-4 [&>*]:min-w-0">
        <section aria-label="กระดานเกม">
          <Board room={room} me={uid} highlight={current ? current.position : null} />
        </section>
        <aside className="flex flex-col gap-4">
          <div className="glass p-4">
            <div className="text-sm text-soft">ตาปัจจุบัน</div>
            <div className="flex items-center gap-3 mt-1">
              {current && <span className="text-3xl" aria-hidden>{avatarEmoji(current.avatar)}</span>}
              <div className="flex-1 min-w-0"><b className="block truncate text-lg" style={{ color: current?.color }}>{current?.name || '-'}</b><span className="text-xs text-soft">{current ? `ช่อง ${current.position}/${fin}` : ''}</span></div>
              <Dice value={turn.dice ?? lastDice} rolling={rolling} />
            </div>
            <div className="hidden lg:block mt-3">
              {myTurn && turn.awaiting === 'roll' && <button className="btn btn-lg w-full pulse-glow" disabled={busy || paused} onClick={doRoll}><Dice5 />ทอยลูกเต๋า</button>}
              {!myTurn && !isHost && <p className="text-soft text-sm text-center">รอ {current?.name} ...</p>}
            </div>
            {turn.deadline && <div className="mt-3"><Countdown deadline={turn.deadline} offset={offset} total={room.settings.answerSeconds} /></div>}
            {room.teamworkNext && <p className="mt-2 chip">🌀 การ์ดสถานการณ์ใบถัดไป ทุกกลุ่มช่วยกันตอบ</p>}
          </div>
          <div className="glass p-4">
            <h2 className="font-semibold mb-2">คะแนน</h2>
            <Scoreboard room={room} presence={presence} me={uid} onSelect={isHost ? setSelected : undefined} />
            {isHost && selected && room.players[selected] && <ScoreAdjust room={room} uid={selected} onClose={() => setSelected(null)} />}
          </div>
          <div className="glass p-4"><h2 className="font-semibold mb-2">ประวัติการเล่น</h2><LogFeed room={room} /></div>
        </aside>
      </div>

      {/* mobile bottom control bar */}
      <div className="lg:hidden fixed inset-x-0 bottom-0 z-40 p-3 bg-space/90 backdrop-blur border-t border-neon/25">
        {myTurn && turn.awaiting === 'roll'
          ? <button className="btn btn-lg w-full pulse-glow" disabled={busy || paused} onClick={doRoll}><Dice5 />ทอยลูกเต๋า</button>
          : <p className="text-center text-soft">{isHost ? 'โหมดครู: ควบคุมเกมจากปุ่มด้านบน' : myTurn ? (moving ? 'กำลังเดิน...' : 'ทำภารกิจในการ์ดให้เสร็จ') : cardOpen ? `${current?.name || ''} กำลังตอบการ์ด...` : `รอ ${current?.name || ''} ...`}</p>}
      </div>

      <AnimatePresence>
        {banner && (
          <motion.div initial={{ opacity: 0, scale: .8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, y: -20 }} className="fixed inset-x-0 top-24 z-50 flex justify-center pointer-events-none">
            <div className="glass px-6 py-4 text-2xl font-semibold neon-text">{banner}</div>
          </motion.div>
        )}
      </AnimatePresence>

      <Modal open={showCard} onClose={isHost ? () => setHostHidden(cardKey) : undefined} label="การ์ด">
        {turn.card && current && <ActiveCard room={room} card={turn.card} mine={myTurn} isHost={isHost} offset={offset} />}
      </Modal>
      <Modal open={!showCard && !moving && !!reveal} onClose={() => setReveal(null)} label="ผลการตอบ">
        {reveal && <RevealPanel card={reveal} playerName={room.players[reveal.playerId]?.name || ''} />}
        <div className="text-center mt-4"><button className="btn btn-sm" onClick={() => setReveal(null)}>ปิด</button></div>
      </Modal>
    </div>
  );
}

function ActiveCard({ room, card, mine, isHost, offset }: { room: RoomPublic; card: PublicCard; mine: boolean; isHost: boolean; offset: number }) {
  const toast = useToast();
  const [flipped, setFlipped] = useState(false);
  const [sel, setSel] = useState<WaveType[]>([]);
  const [choice, setChoice] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const turn = room.turn;
  const player = room.players[turn.playerId!];
  useEffect(() => { setFlipped(false); setSel([]); setChoice(null); const t = setTimeout(() => { setFlipped(true); sfx.flip(); }, 450); return () => clearTimeout(t); }, [card.id, turn.seq]);
  const run = async (fn: () => Promise<unknown>) => { if (busy) return; setBusy(true); try { await fn(); } catch (e) { toast((e as Error).message, 'bad'); } finally { setBusy(false); } };
  const waiting = turn.awaiting === 'teacher';
  return (
    <div>
      <div className="text-center mb-3">
        <div className="chip mb-1">{card.deck === 'wave' ? (card.kind === 'situation' ? '🌊 การ์ดสถานการณ์คลื่น' : '🌊 การ์ดคำถาม') : '⚡ การ์ดพิเศษ'}{card.points ? ` · ${card.points} คะแนน` : ''}</div>
        <div className="text-sm text-soft">{mine ? 'กลุ่มของคุณ' : player.name} {waiting ? 'รอครูตัดสิน' : card.deck === 'wave' ? 'กำลังตอบ' : 'กำลังเลือก'}</div>
        {card.teamwork && <div className="chip mt-1 !text-gold !border-gold">🌀 ทุกกลุ่มช่วยกันตอบ · ตอบผิดหักคะแนน 2 เท่า</div>}
      </div>
      <div className="grid sm:grid-cols-[auto_1fr] gap-4 items-start">
        <FlipCard card={card} flipped={flipped} />
        <div>
          <h3 className="text-lg font-semibold neon-text">{card.kind === 'question' ? card.title : card.title}</h3>
          <p className="mt-1 leading-relaxed"><Latex text={card.text} /></p>
          {turn.deadline && <div className="mt-3"><Countdown deadline={turn.deadline} offset={offset} total={room.settings.answerSeconds} /></div>}
        </div>
      </div>
      <div className="mt-4">
        {card.kind === 'situation' && !waiting && (<>
          <p className="text-sm text-soft mb-2">เลือก “การ์ดประเภทคลื่น” ที่ถูกต้อง (เลือกได้มากกว่า 1 ใบ · ถูกครบทุกใบได้ 2 เท่า · มีใบผิดถือว่าผิด)</p>
          <WaveTypeChooser value={sel} onChange={mine ? setSel : undefined} disabled={!mine || busy} />
          {mine && <button className="btn btn-lg w-full mt-3" disabled={!sel.length || busy} onClick={() => run(() => api.answer(room.id, sel))}>ส่งคำตอบ</button>}
        </>)}
        {card.kind === 'question' && card.choices && !waiting && (
          <div className="grid gap-2">
            {card.choices.map((c, i) => (
              <button key={i} type="button" disabled={!mine || busy} aria-pressed={choice === i} onClick={() => { sfx.click(); setChoice(i); }}
                className={`glass-soft text-left px-4 py-3 flex gap-3 items-center ${choice === i ? 'ring-2 ring-neon' : ''}`}>
                <span className="font-display text-neon w-6">{'ABCD'[i]}</span><Latex text={c} />
              </button>
            ))}
            {mine && <button className="btn btn-lg w-full mt-1" disabled={choice == null || busy} onClick={() => run(() => api.answer(room.id, choice!))}>ส่งคำตอบ</button>}
          </div>
        )}
        {card.kind === 'special' && card.options && turn.awaiting === 'choice' && (
          <div className="grid gap-2">
            {card.options.map((o, i) => <button key={i} className="btn btn-royal" disabled={!mine || busy} onClick={() => run(() => api.choose(room.id, i))}>{o}</button>)}
            {!mine && <p className="text-soft text-sm text-center">รอ {player.name} เลือก...</p>}
          </div>
        )}
        {waiting && (
          <div className="glass-soft p-3">
            <p className="text-center">⏳ รอครูตัดสินผล{card.kind === 'special' ? 'ภารกิจ' : 'คำตอบ'}</p>
            {Array.isArray(turn.pendingSelection) && <p className="text-sm text-soft text-center mt-1">คำตอบ: {(turn.pendingSelection as WaveType[]).join(', ')}</p>}
            {isHost && (
              <div className="flex flex-wrap gap-2 justify-center mt-3">
                {card.kind === 'special'
                  ? <><button className="btn btn-good" onClick={() => run(() => api.host(room.id, 'judge', { verdict: 'approve' }))}><Gavel size={16} />ยืนยันสำเร็จ</button><button className="btn btn-danger" onClick={() => run(() => api.host(room.id, 'judge', { verdict: 'reject' }))}>ไม่ผ่าน</button></>
                  : <>{turn.suggestedVerdict && <span className="chip self-center">ระบบแนะนำ: {turn.suggestedVerdict}</span>}
                      <button className="btn btn-good" onClick={() => run(() => api.host(room.id, 'judge', { verdict: 'full' }))}>ถูกทั้งหมด</button>
                      <button className="btn" onClick={() => run(() => api.host(room.id, 'judge', { verdict: 'partial' }))}>ถูกบางส่วน</button>
                      <button className="btn btn-danger" onClick={() => run(() => api.host(room.id, 'judge', { verdict: 'wrong' }))}>ไม่ถูกต้อง</button></>}
              </div>
            )}
          </div>
        )}
        {isHost && !waiting && <div className="text-center mt-3"><button className="btn btn-ghost btn-sm" onClick={() => run(() => api.host(room.id, 'skip'))}><SkipForward size={16} />ข้ามการ์ดนี้</button></div>}
        {isHost && <div className="mt-4 pt-3 border-t border-white/10 flex justify-center"><HostControls room={room} /></div>}
      </div>
    </div>
  );
}

function HostControls({ room }: { room: RoomPublic }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const run = async (fn: () => Promise<unknown>) => { setBusy(true); try { await fn(); } catch (e) { toast((e as Error).message, 'bad'); } finally { setBusy(false); } };
  return (
    <div className="flex flex-wrap gap-2">
      {room.status === 'PAUSED'
        ? <button className="btn btn-sm" disabled={busy} onClick={() => run(() => api.host(room.id, 'resume'))}><Play size={16} />เล่นต่อ</button>
        : <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => run(() => api.host(room.id, 'pause'))}><Pause size={16} />หยุดชั่วคราว</button>}
      <button className="btn btn-ghost btn-sm" disabled={busy || room.status !== 'PLAYING'} onClick={() => run(() => api.host(room.id, 'skip'))}><SkipForward size={16} />ข้ามตา</button>
      <button className="btn btn-danger btn-sm" disabled={busy} onClick={() => setConfirmEnd(true)}><Flag size={16} />จบเกม</button>
      <Modal open={confirmEnd} onClose={() => setConfirmEnd(false)} label="ยืนยันจบเกม">
        <h3 className="text-lg font-semibold">จบเกมตอนนี้?</h3>
        <p className="text-soft mt-1">ระบบจะรวมคะแนนและประกาศผู้ชนะทันที</p>
        <div className="flex gap-2 mt-4"><button className="btn btn-danger" onClick={() => { setConfirmEnd(false); run(() => api.host(room.id, 'end')); }}>จบเกม</button><button className="btn btn-ghost" onClick={() => setConfirmEnd(false)}>ยกเลิก</button></div>
      </Modal>
    </div>
  );
}

function ScoreAdjust({ room, uid, onClose }: { room: RoomPublic; uid: string; onClose: () => void }) {
  const toast = useToast();
  const p = room.players[uid];
  const adj = (d: number) => api.host(room.id, 'adjust', { playerId: uid, delta: d }).catch(e => toast((e as Error).message, 'bad'));
  return (
    <div className="glass-soft p-3 mt-3">
      <div className="flex items-center justify-between"><b>ปรับคะแนน: {p.name}</b><button className="btn btn-ghost btn-sm" onClick={onClose}>ปิด</button></div>
      <div className="flex flex-wrap gap-2 mt-2">
        {[-5, -1, 1, 5].map(d => <button key={d} className="btn btn-ghost btn-sm" onClick={() => adj(d)}>{d > 0 ? <Plus size={14} /> : <Minus size={14} />}{Math.abs(d)}</button>)}
        <button className="btn btn-danger btn-sm" onClick={() => api.host(room.id, 'remove', { playerId: uid }).then(onClose).catch(e => toast((e as Error).message, 'bad'))}><UserX size={14} />นำออกจากเกม</button>
      </div>
    </div>
  );
}

/* =========================================================
   Result
   ========================================================= */
function ResultView({ room, uid, isHost }: { room: RoomPublic; uid: string; isHost: boolean }) {
  const toast = useToast();
  const res = useMemo(() => room.results || [], [room.results]);
  const winners = res.filter(r => r.winner);
  const medal = (rank: number) => ['🥇', '🥈', '🥉'][rank - 1] || '🎖️';
  const why = { finish: 'มีกลุ่มถึงเส้นชัยแล้ว', timeLimit: 'หมดเวลาเล่น', maxRounds: 'ครบจำนวนรอบ', teacher: 'ครูจบเกม', noPlayers: 'ไม่มีผู้เล่น' }[room.endReason || 'teacher'];
  const me = res.find(r => r.playerId === uid);
  useEffect(() => { sfx.victory(); confetti(); }, []);
  // ครูกด "เล่นใหม่" → ผู้เล่นเข้าห้องใหม่อัตโนมัติด้วยชื่อ/สี/Avatar เดิม
  const joining = useRef(false);
  useEffect(() => {
    const rm = room.rematch; const meP = room.players[uid];
    if (!rm || isHost || !meP || joining.current) return;
    joining.current = true;
    api.joinRoom(rm.code, meP.name, meP.avatar, meP.color).then(r => { lastRoom.set({ roomId: r.roomId, code: rm.code }); go(`/room/${r.roomId}`); }).catch(e => { toast((e as Error).message, 'bad'); go(`/join?code=${rm.code}`); });
  }, [room.rematch, isHost, room.players, uid, toast]);
  const exportCsv = () => downloadCsv(`ผลเกม-${room.code}.csv`, [['อันดับ', 'ชื่อกลุ่ม', 'ผู้เข้าสู่ระบบ', 'คะแนน', 'ตำแหน่ง', 'ถูกทั้งหมด', 'ถูกบางส่วน', 'ผิด', 'การ์ดที่เปิด', 'ผู้ชนะ'],
    ...res.map(r => [r.rank, r.name, r.captain || '', r.score, r.position, r.correct, r.partial, r.wrong, r.cards, r.winner ? 'ใช่' : ''])]);
  const ordered = useMemo(() => [...res].sort((a, b) => a.rank - b.rank), [res]);
  return (
    <div className="max-w-3xl mx-auto page-enter">
      <div className="glass p-6 text-center">
        <Trophy className="mx-auto text-gold" size={56} />
        <div className="chip mt-2">GAME RESULT · {why}</div>
        <h1 className="title-neon text-3xl sm:text-4xl mt-2">ผู้พิชิตคลื่น!</h1>
        <p className="text-2xl mt-2">{winners.map(w => w.name).join(' · ') || '-'}</p>
        {me && <p className="text-soft mt-1">กลุ่มของคุณได้อันดับ {me.rank} · {me.score} คะแนน</p>}
        <div className="flex justify-center items-end gap-3 mt-6" aria-hidden>
          {[ordered[1], ordered[0], ordered[2]].map((r, i) => r && (
            <div key={r.playerId} className="flex flex-col items-center">
              <span className="text-3xl">{medal(r.rank)}</span>
              <div className={`w-20 sm:w-24 rounded-t-xl grid place-items-center bg-gradient-to-b from-electric/70 to-royal/30 border border-neon/40 ${i === 1 ? 'h-28' : i === 0 ? 'h-20' : 'h-14'}`}><b className="text-sm px-1 truncate max-w-full">{r.name}</b></div>
            </div>
          ))}
        </div>
      </div>
      <div className="glass p-4 mt-4 overflow-x-auto">
        <table className="w-full text-sm min-w-[520px]">
          <thead><tr className="text-soft text-left">{['อันดับ', 'กลุ่ม', 'คะแนน', 'ช่อง', '✅', '🟡', '❌'].map(h => <th key={h} className="p-2">{h}</th>)}</tr></thead>
          <tbody>{ordered.map(r => (
            <tr key={r.playerId} className={`border-t border-white/10 ${r.playerId === uid ? 'bg-neon/10' : ''}`}>
              <td className="p-2">{medal(r.rank)} {r.rank}</td><td className="p-2 font-semibold">{r.name}{r.captain ? <span className="text-soft font-normal"> · {r.captain}</span> : ''}</td>
              <td className="p-2 font-display neon-text">{r.score}</td><td className="p-2">{r.position}</td><td className="p-2">{r.correct}</td><td className="p-2">{r.partial}</td><td className="p-2">{r.wrong}</td>
            </tr>))}</tbody>
        </table>
      </div>
      <div className="flex flex-wrap gap-2 justify-center mt-4">
        {isHost && <button className="btn btn-lg" onClick={() => api.rematch(room.id).then(r => go(`/host/${r.roomId}`)).catch(e => toast((e as Error).message, 'bad'))}><RotateCcw />เล่นใหม่ (ผู้เล่นชุดเดิม)</button>}
        {isHost && <button className="btn btn-ghost" onClick={exportCsv}><Download size={18} />ดาวน์โหลด CSV</button>}
        {isHost && <button className="btn btn-ghost" onClick={() => go('/teacher')}>Teacher Dashboard</button>}
        {!isHost && <p className="text-soft self-center">ถ้าครูกด “เล่นใหม่” ระบบจะพาเข้าห้องใหม่อัตโนมัติ</p>}
        {!isHost && <button className="btn btn-ghost" onClick={() => { lastRoom.clear(); go('/home'); }}>กลับหน้าแรก</button>}
      </div>
    </div>
  );
}

function confetti() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('reduce-motion')) return;
  const cv = document.createElement('canvas');
  cv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:90';
  document.body.appendChild(cv); cv.width = innerWidth; cv.height = innerHeight;
  const x = cv.getContext('2d')!;
  const cols = ['#00E5FF', '#8DEFFF', '#FFD66B', '#34F5A4', '#008CFF', '#ffffff'];
  const ps = Array.from({ length: 160 }, () => ({ x: innerWidth / 2, y: innerHeight * .3, vx: (Math.random() - .5) * 16, vy: -Math.random() * 14 - 4, s: Math.random() * 7 + 3, c: cols[Math.floor(Math.random() * cols.length)], r: Math.random() * 6 }));
  let n = 0;
  const f = () => { x.clearRect(0, 0, cv.width, cv.height); ps.forEach(p => { p.vy += .32; p.x += p.vx; p.y += p.vy; p.r += .2; x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = p.c; x.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * .6); x.restore(); }); if (++n < 140) requestAnimationFrame(f); else cv.remove(); };
  requestAnimationFrame(f);
}
