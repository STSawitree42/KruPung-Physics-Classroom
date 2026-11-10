/* Shared UI primitives: router, toasts, modal, background, LaTeX, QR, pickers */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import QRCode from 'qrcode';
import { X } from 'lucide-react';
import { AVATARS, TOKEN_COLORS } from '@shared/rules.config';
import { getPrefs } from '../game/sound';

/* ---------------- hash router ---------------- */
export function useHashRoute() {
  const parse = () => {
    const raw = location.hash.replace(/^#/, '') || '/';
    const [path, query = ''] = raw.split('?');
    return { path, params: new URLSearchParams(query) };
  };
  const [route, setRoute] = useState(parse);
  useEffect(() => { const f = () => setRoute(parse()); window.addEventListener('hashchange', f); return () => window.removeEventListener('hashchange', f); }, []);
  return route;
}
export const go = (path: string) => { location.hash = path; window.scrollTo({ top: 0 }); };

/* ---------------- toasts ---------------- */
type Toast = { id: number; text: string; kind: 'info' | 'good' | 'bad' };
const ToastCtx = createContext<(text: string, kind?: Toast['kind']) => void>(() => {});
export function ToastProvider({ children }: { children: ReactNode }) {
  const [list, setList] = useState<Toast[]>([]);
  const push = useCallback((text: string, kind: Toast['kind'] = 'info') => {
    const id = Date.now() + Math.random();
    setList(l => [...l.slice(-3), { id, text, kind }]);
    setTimeout(() => setList(l => l.filter(t => t.id !== id)), 4200);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed z-[80] bottom-4 right-4 left-4 sm:left-auto flex flex-col gap-2 sm:max-w-sm" aria-live="polite">
        {list.map(t => (
          <div key={t.id} className={`glass px-4 py-3 text-sm page-enter ${t.kind === 'bad' ? 'border-bad/60' : t.kind === 'good' ? 'border-good/60' : ''}`}>{t.text}</div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
export const useToast = () => useContext(ToastCtx);

/* ---------------- modal ---------------- */
export function Modal({ open, onClose, children, wide, label }: { open: boolean; onClose?: () => void; children: ReactNode; wide?: boolean; label?: string }) {
  useEffect(() => {
    if (!open || !onClose) return;
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] bg-[#020815]/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-2 sm:p-4" role="dialog" aria-modal="true" aria-label={label} onClick={e => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className={`glass w-full ${wide ? 'max-w-4xl' : 'max-w-xl'} max-h-[92dvh] overflow-y-auto scroll-thin p-4 sm:p-6 page-enter relative`}>
        {onClose && <button className="btn btn-ghost btn-sm absolute right-3 top-3 !min-h-9 !px-2" onClick={onClose} aria-label="ปิด"><X size={18} /></button>}
        {children}
      </div>
    </div>
  );
}

/* ---------------- animated background: sine waves + particles ---------------- */
export function WaveBackground() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current!; const x = cv.getContext('2d')!;
    let raf = 0, w = 0, h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const parts = Array.from({ length: 40 }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 1.6 + .4, v: Math.random() * .0004 + .0001 }));
    const size = () => { w = innerWidth; h = innerHeight; cv.width = w * dpr; cv.height = h * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0); };
    size(); window.addEventListener('resize', size);
    const draw = (t: number) => {
      x.clearRect(0, 0, w, h);
      [{ a: 26, k: 1.6, s: .0004, c: 'rgba(0,229,255,.16)', y: .78 }, { a: 18, k: 2.4, s: -.0003, c: 'rgba(0,140,255,.14)', y: .84 }, { a: 12, k: 3.6, s: .0006, c: 'rgba(141,239,255,.10)', y: .9 }].forEach(L => {
        x.beginPath(); x.strokeStyle = L.c; x.lineWidth = 2;
        for (let px = 0; px <= w; px += 6) { const y = h * L.y + L.a * Math.sin((px / w) * Math.PI * 2 * L.k + t * L.s); if (px) x.lineTo(px, y); else x.moveTo(px, y); }
        x.stroke();
      });
      parts.forEach(p => { p.y -= p.v; if (p.y < -0.02) p.y = 1.02; x.beginPath(); x.fillStyle = 'rgba(141,239,255,.55)'; x.arc(p.x * w, p.y * h, p.r, 0, Math.PI * 2); x.fill(); });
      if (!getPrefs().reduceMotion && !matchMedia('(prefers-reduced-motion: reduce)').matches) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', size); };
  }, []);
  return (<><div className="lab-grid" aria-hidden /><canvas ref={ref} className="fixed inset-0 w-full h-full pointer-events-none z-0" aria-hidden /></>);
}

/* ---------------- LaTeX (text with $...$) ---------------- */
export function Latex({ text, className }: { text: string; className?: string }) {
  const parts = useMemo(() => {
    const out: { math: boolean; s: string }[] = [];
    const re = /\$([^$]+)\$/g; let last = 0; let m: RegExpExecArray | null;
    while ((m = re.exec(text))) { if (m.index > last) out.push({ math: false, s: text.slice(last, m.index) }); out.push({ math: true, s: m[1] }); last = m.index + m[0].length; }
    if (last < text.length) out.push({ math: false, s: text.slice(last) });
    return out;
  }, [text]);
  return (
    <span className={className}>
      {parts.map((p, i) => p.math
        ? <span key={i} dangerouslySetInnerHTML={{ __html: katex.renderToString(p.s, { throwOnError: false, trust: false, strict: 'ignore' }) }} />
        : <span key={i}>{p.s}</span>)}
    </span>
  );
}

/* ---------------- QR code ---------------- */
export function QR({ value, size = 160 }: { value: string; size?: number }) {
  const [src, setSrc] = useState('');
  useEffect(() => { QRCode.toDataURL(value, { margin: 1, width: size * 2, color: { dark: '#06142B', light: '#ffffff' } }).then(setSrc).catch(() => setSrc('')); }, [value, size]);
  return src ? <img src={src} width={size} height={size} alt={`QR Code สำหรับเข้าร่วมห้อง: ${value}`} className="rounded-xl bg-white p-1" /> : <div style={{ width: size, height: size }} className="rounded-xl bg-white/10" />;
}

/* ---------------- pickers ---------------- */
export function AvatarPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="เลือก Avatar">
      {AVATARS.map(a => (
        <button key={a.id} type="button" role="radio" aria-checked={value === a.id} onClick={() => onChange(a.id)}
          className={`glass-soft flex flex-col items-center gap-1 py-2 transition ${value === a.id ? 'ring-2 ring-neon shadow-[0_0_18px_rgba(0,229,255,.45)]' : 'hover:border-neon/60'}`}>
          <span className="text-3xl" aria-hidden>{a.emoji}</span><span className="text-[11px] text-soft">{a.name}</span>
        </button>
      ))}
    </div>
  );
}
export function ColorPicker({ value, onChange, taken = [] }: { value: string; onChange: (v: string) => void; taken?: string[] }) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="เลือกสีตัวเดิน">
      {TOKEN_COLORS.map(c => {
        const dis = taken.includes(c.hex);
        return (
          <button key={c.id} type="button" role="radio" aria-checked={value === c.hex} disabled={dis} onClick={() => onChange(c.hex)} title={c.name + (dis ? ' (ถูกเลือกแล้ว)' : '')}
            className={`w-11 h-11 rounded-full border-2 transition ${value === c.hex ? 'border-white scale-110 shadow-[0_0_16px_rgba(255,255,255,.5)]' : 'border-white/20'} ${dis ? 'opacity-25 cursor-not-allowed' : ''}`} style={{ background: c.hex }}>
            <span className="sr-only">{c.name}</span>
          </button>
        );
      })}
    </div>
  );
}
export const avatarEmoji = (id: string) => AVATARS.find(a => a.id === id)?.emoji || '🙂';

export function Pawn({ color, size = 28 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size * 1.3} viewBox="0 0 40 52" aria-hidden>
      <defs><radialGradient id={`g${color.slice(1)}`} cx="35%" cy="30%"><stop offset="0" stopColor="#fff" stopOpacity=".85" /><stop offset=".35" stopColor={color} /><stop offset="1" stopColor={color} stopOpacity=".75" /></radialGradient></defs>
      <ellipse cx="20" cy="48" rx="16" ry="4" fill="rgba(0,0,0,.35)" />
      <path d="M20 4a9 9 0 0 1 6 15.7c3.6 2.4 6 7.2 7 12.3l2 12H5l2-12c1-5.1 3.4-9.9 7-12.3A9 9 0 0 1 20 4z" fill={`url(#g${color.slice(1)})`} stroke="rgba(255,255,255,.7)" strokeWidth="1.5" />
    </svg>
  );
}

export function Loading({ text = 'กำลังโหลด...' }: { text?: string }) {
  return <div className="max-w-sm mx-auto my-16 text-center text-soft"><div className="loading-bar mb-3" />{text}</div>;
}
