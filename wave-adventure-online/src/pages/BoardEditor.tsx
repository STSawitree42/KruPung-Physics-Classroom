/* =========================================================
   Board Coordinate Editor — กำหนดพิกัดช่องบนภาพกระดานต้นฉบับ
   พิกัดเก็บแบบ normalized (0–1) จึงใช้ได้ทุกขนาดหน้าจอ
   ========================================================= */
import { useEffect, useRef, useState } from 'react';
import { Save, Download, Upload, RotateCcw, Play, MousePointerClick } from 'lucide-react';
import { DEFAULT_BOARD, emptyBoard, validateBoard } from '@shared/board.config';
import type { BoardCell, BoardConfig, CellType } from '@shared/types';
import * as C from '../services/content';
import { useAuthUser } from '../hooks/useFirebase';
import { isConfigured } from '../config/firebase';
import { Pawn, useToast } from '../components/ui';
import { TeacherGate } from './Home';

const TYPE_STYLE: Record<CellType, { bg: string; label: string }> = {
  START: { bg: '#34F5A4', label: 'START' }, FINISH: { bg: '#FFD66B', label: 'FINISH' },
  WAVE: { bg: '#00E5FF', label: '🌊 คลื่น' }, LIGHTNING: { bg: '#FFB020', label: '⚡ ฟ้าผ่า' }, NORMAL: { bg: '#B8C8DC', label: 'ปกติ' }
};

export default function BoardEditor() {
  const toast = useToast();
  const { teacher, ready } = useAuthUser();
  const [board, setBoard] = useState<BoardConfig>(structuredClone(DEFAULT_BOARD));
  const [sel, setSel] = useState(0);
  const [placing, setPlacing] = useState(false);
  const [walker, setWalker] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const area = useRef<HTMLDivElement>(null);
  const drag = useRef<number | null>(null);
  useEffect(() => { if (isConfigured && teacher) C.loadBoard().then(b => b && setBoard({ ...b, cells: (b.cells || []).map((c, i) => ({ index: i, x: c.x ?? null, y: c.y ?? null, type: c.type, color: c.color ?? null })) })).catch(() => {}); }, [teacher]);
  if (isConfigured && ready && !teacher) return <TeacherGate />;

  const v = validateBoard(board);
  const missing = board.cells.filter(c => c.x == null || c.y == null).length;
  const setCell = (i: number, patch: Partial<BoardCell>) => setBoard(b => ({ ...b, cells: b.cells.map(c => (c.index === i ? { ...c, ...patch } : c)) }));
  const pointTo = (e: React.PointerEvent) => { const r = area.current!.getBoundingClientRect(); return { x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)) }; };
  const onAreaDown = (e: React.PointerEvent) => {
    if (!placing || drag.current != null) return;
    const p = pointTo(e); setCell(sel, { x: +p.x.toFixed(4), y: +p.y.toFixed(4) });
    setSel(s => Math.min(board.cells.length - 1, s + 1));
  };
  const onMove = (e: React.PointerEvent) => { if (drag.current == null) return; const p = pointTo(e); setCell(drag.current, { x: +p.x.toFixed(4), y: +p.y.toFixed(4) }); };
  const resize = (n: number) => {
    if (!confirm(`สร้างกระดานใหม่ ${n} ช่อง (ไม่รวม START/FINISH)? พิกัดเดิมจะถูกล้าง`)) return;
    setBoard(emptyBoard(n, board.image, board.aspect)); setSel(0); setPlacing(true);
  };
  const walk = () => { let i = 0; setWalker(0); const t = setInterval(() => { i++; if (i >= board.cells.length) { clearInterval(t); setTimeout(() => setWalker(null), 600); return; } setWalker(i); }, 220); };
  const save = async () => { if (!v.ok) return toast('ยังบันทึกไม่ได้: ' + v.errors[0], 'bad'); try { await C.saveBoard(board); toast('บันทึกกระดานแล้ว ห้องที่สร้างใหม่จะใช้กระดานนี้', 'good'); } catch (e) { toast((e as Error).message, 'bad'); } };
  const exportJson = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(board, null, 2)], { type: 'application/json' })); a.download = 'board.config.json'; a.click(); };
  const importJson = async (f: File) => { try { const b = JSON.parse(await f.text()) as BoardConfig; if (!Array.isArray(b.cells)) throw new Error('ไม่มี cells'); setBoard(b); toast('นำเข้าแล้ว ตรวจสอบก่อนบันทึก', 'good'); } catch (e) { toast('ไฟล์ไม่ถูกต้อง: ' + (e as Error).message, 'bad'); } };
  const onImage = (f: File) => { const url = URL.createObjectURL(f); const img = new Image(); img.onload = () => { setBoard(b => ({ ...b, aspect: +(img.width / img.height).toFixed(4) })); setPreviewUrl(url); toast('แสดงตัวอย่างภาพแล้ว — นำไฟล์ไปไว้ที่ public/assets/board/ แล้วใส่ path ในช่อง “ที่อยู่ภาพ”'); }; img.src = url; };

  return (
    <div className="page-enter">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="mr-auto"><div className="chip">BOARD COORDINATE EDITOR</div><h1 className="text-2xl font-semibold mt-1">กำหนดพิกัดช่องบนกระดาน</h1></div>
        <span className={`chip ${v.ok ? '!text-good !border-good' : '!text-bad !border-bad'}`}>{v.ok ? `✓ พร้อมใช้งาน ${board.cells.length - 2} ช่อง` : `ยังไม่พร้อม: ขาดพิกัด ${missing} ช่อง`}</span>
      </div>
      <div className="grid xl:grid-cols-[1fr_380px] gap-4">
        <div className="glass p-2">
          <div ref={area} className={`relative select-none touch-none ${placing ? 'cursor-crosshair' : ''}`} style={{ aspectRatio: String(board.aspect) }}
            onPointerDown={onAreaDown} onPointerMove={onMove} onPointerUp={() => { drag.current = null; }} onPointerLeave={() => { drag.current = null; }}>
            <img src={previewUrl || board.image} alt="ภาพกระดาน" className="absolute inset-0 w-full h-full object-cover rounded-xl" draggable={false} />
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden>
              <polyline fill="none" stroke="rgba(0,229,255,.75)" strokeWidth="3" strokeDasharray="10 8" points={board.cells.filter(c => c.x != null).map(c => `${c.x! * 1000},${c.y! * 1000}`).join(' ')} />
            </svg>
            {board.cells.map(c => c.x != null && c.y != null && (
              <button key={c.index} type="button" aria-label={`ช่อง ${c.index}`} onPointerDown={e => { e.stopPropagation(); setSel(c.index); drag.current = c.index; (e.target as HTMLElement).setPointerCapture?.(e.pointerId); }}
                className={`absolute grid place-items-center rounded-full text-[11px] font-bold text-space border-2 ${sel === c.index ? 'border-white scale-125 z-10' : 'border-space/60'}`}
                style={{ left: `${c.x * 100}%`, top: `${c.y * 100}%`, width: 26, height: 26, transform: 'translate(-50%,-50%)', background: TYPE_STYLE[c.type].bg, boxShadow: sel === c.index ? '0 0 16px #fff' : undefined }}>
                {c.type === 'START' ? 'S' : c.type === 'FINISH' ? 'F' : c.index}
              </button>
            ))}
            {walker != null && board.cells[walker]?.x != null && <div className="token" style={{ left: `${board.cells[walker].x! * 100}%`, top: `${board.cells[walker].y! * 100}%` }}><Pawn color="#00E5FF" size={28} /></div>}
          </div>
          <p className="text-soft text-sm mt-2 px-1">{placing ? `🎯 โหมดวางจุด: คลิกบนภาพเพื่อกำหนดตำแหน่ง “ช่อง ${sel}” (ระบบเลื่อนไปช่องถัดไปอัตโนมัติ)` : 'ลากจุดเพื่อย้ายตำแหน่ง · กด “โหมดวางจุด” เพื่อคลิกกำหนดทีละช่อง'}</p>
        </div>
        <div className="glass p-4 flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <button className={`btn btn-sm ${placing ? '' : 'btn-ghost'}`} onClick={() => setPlacing(p => !p)}><MousePointerClick size={16} />{placing ? 'กำลังวางจุด' : 'โหมดวางจุด'}</button>
            <button className="btn btn-ghost btn-sm" disabled={!v.ok} onClick={walk}><Play size={16} />Preview การเดิน</button>
          </div>
          <label className="block"><span className="label">ที่อยู่ภาพกระดาน</span><input className="field" value={board.image} onChange={e => setBoard(b => ({ ...b, image: e.target.value }))} /></label>
          <label className="btn btn-ghost btn-sm cursor-pointer"><Upload size={14} />เลือกภาพกระดานจากเครื่อง (ดูตัวอย่าง)<input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && onImage(e.target.files[0])} /></label>
          <div className="flex gap-2 items-end">
            <label className="block flex-1"><span className="label">จำนวนช่องเล่น (ไม่รวม START/FINISH)</span><input id="ncells" type="number" min={3} max={118} defaultValue={board.cells.length - 2} className="field" /></label>
            <button className="btn btn-ghost btn-sm" onClick={() => resize(Math.max(3, Math.min(118, Number((document.getElementById('ncells') as HTMLInputElement).value) || 36)))}>สร้างใหม่</button>
          </div>
          <div className="divider" />
          <div className="flex items-center gap-2"><b>ช่องที่เลือก: {sel}</b>
            <button className="btn btn-ghost btn-sm !min-h-8" onClick={() => setSel(s => Math.max(0, s - 1))}>◀</button><button className="btn btn-ghost btn-sm !min-h-8" onClick={() => setSel(s => Math.min(board.cells.length - 1, s + 1))}>▶</button></div>
          {board.cells[sel] && (
            <div className="grid grid-cols-2 gap-2">
              <label className="block"><span className="label">ประเภทช่อง</span>
                <select className="field" value={board.cells[sel].type} disabled={sel === 0 || sel === board.cells.length - 1} onChange={e => setCell(sel, { type: e.target.value as CellType })}>
                  {(['NORMAL', 'WAVE', 'LIGHTNING', 'START', 'FINISH'] as CellType[]).map(t => <option key={t} value={t} className="bg-navy">{TYPE_STYLE[t].label}</option>)}
                </select></label>
              <label className="block"><span className="label">สีช่อง (การ์ดคลื่นหักเห)</span>
                <select className="field" value={board.cells[sel].color || ''} onChange={e => setCell(sel, { color: (e.target.value || null) as BoardCell['color'] })}>
                  <option value="" className="bg-navy">ไม่มี</option><option value="blue" className="bg-navy">ฟ้า</option><option value="purple" className="bg-navy">ม่วง</option>
                </select></label>
              <p className="col-span-2 text-xs text-soft">พิกัด: {board.cells[sel].x ?? '—'}, {board.cells[sel].y ?? '—'}</p>
            </div>
          )}
          <div className="divider" />
          {!v.ok && <ul className="text-xs text-bad max-h-28 overflow-y-auto scroll-thin">{v.errors.slice(0, 8).map(e => <li key={e}>• {e}</li>)}</ul>}
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-sm" disabled={!v.ok || !isConfigured} onClick={save}><Save size={16} />บันทึกกระดาน</button>
            <button className="btn btn-ghost btn-sm" onClick={exportJson}><Download size={16} />บันทึก JSON</button>
            <label className="btn btn-ghost btn-sm cursor-pointer"><Upload size={16} />นำเข้า JSON<input type="file" accept=".json" className="hidden" onChange={e => e.target.files?.[0] && importJson(e.target.files[0])} /></label>
            <button className="btn btn-danger btn-sm" onClick={async () => { if (!confirm('คืนค่ากระดานต้นฉบับ 36 ช่อง?')) return; setBoard(structuredClone(DEFAULT_BOARD)); if (isConfigured) await C.resetBoard().catch(() => {}); }}><RotateCcw size={16} />คืนค่าต้นฉบับ</button>
          </div>
          <p className="text-xs text-soft">ห้องที่สร้างแล้วใช้กระดานเดิมต่อจนจบเกม · ห้องที่สร้างใหม่จะใช้กระดานที่บันทึก ระบบไม่ยอมให้บันทึกถ้าพิกัดยังไม่ครบทุกช่อง</p>
        </div>
      </div>
    </div>
  );
}
