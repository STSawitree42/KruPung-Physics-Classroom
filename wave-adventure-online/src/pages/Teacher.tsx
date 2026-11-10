/* =========================================================
   Teacher Dashboard — ห้อง · ผลการเรียนรู้ · คลังคำถาม · การ์ด · กติกา · กระดาน
   ========================================================= */
import { useEffect, useMemo, useState } from 'react';
import { onValue, ref, get } from 'firebase/database';
import { Plus, Pencil, Trash2, Upload, Download, Database, ExternalLink, LogOut, Map as MapIcon, Save } from 'lucide-react';
import { fb, isConfigured } from '../config/firebase';
import { useAuthUser } from '../hooks/useFirebase';
import { signOut } from '../services/api';
import * as C from '../services/content';
import type { AnswerRecord, ContentBundle, GameResultRow, GameSettings, QuestionCard, SituationCard, SpecialCard, WaveType } from '@shared/types';
import { DEFAULT_SETTINGS } from '@shared/rules.config';
import { WAVE_TYPE_LABEL, WAVE_TYPES, QUESTION_CATEGORIES } from '@shared/waveTypes';
import { Latex, Loading, Modal, go, useToast } from '../components/ui';
import { TeacherGate, NotConfigured } from './Home';
import { SettingsForm } from './SettingsForm';
import { downloadCsv, parseCsv } from '../utils/csv';

type Tab = 'rooms' | 'questions' | 'situation' | 'special' | 'rules';
interface RoomMeta { name: string; code: string; createdAt: number; status: string; players: number }

export default function TeacherDashboard() {
  const { user, teacher, ready } = useAuthUser();
  const [tab, setTab] = useState<Tab>('rooms');
  if (!isConfigured) return <NotConfigured />;
  if (!ready) return <Loading />;
  if (!teacher) return <TeacherGate />;
  const tabs: [Tab, string][] = [['rooms', 'ห้อง & ผลการเรียนรู้'], ['questions', 'คลังคำถาม'], ['situation', 'การ์ดสถานการณ์'], ['special', 'การ์ดพิเศษ'], ['rules', 'กติกาเริ่มต้น']];
  return (
    <div className="page-enter">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="mr-auto"><div className="chip">TEACHER DASHBOARD</div><h1 className="text-2xl font-semibold mt-1">ครู {user?.displayName || user?.email}</h1></div>
        <button className="btn" onClick={() => go('/create')}><Plus size={18} />สร้างห้องใหม่</button>
        <button className="btn btn-ghost" onClick={() => go('/editor')}><MapIcon size={18} />Board Editor</button>
        <button className="btn btn-ghost" onClick={() => signOut().then(() => go('/home'))}><LogOut size={18} />ออกจากระบบ</button>
      </div>
      <div className="flex gap-2 overflow-x-auto scroll-thin pb-2" role="tablist">
        {tabs.map(([k, t]) => <button key={k} role="tab" aria-selected={tab === k} className={`btn btn-sm ${tab === k ? '' : 'btn-ghost'}`} onClick={() => setTab(k)}>{t}</button>)}
      </div>
      <div className="mt-3">
        {tab === 'rooms' && <RoomsTab uid={user!.uid} />}
        {tab !== 'rooms' && tab !== 'rules' && <ContentTab kind={tab} />}
        {tab === 'rules' && <RulesTab />}
      </div>
    </div>
  );
}

/* ---------------- rooms & results ---------------- */
function RoomsTab({ uid }: { uid: string }) {
  const toast = useToast();
  const [rooms, setRooms] = useState<Record<string, RoomMeta> | null>(null);
  const [view, setView] = useState<string | null>(null);
  useEffect(() => onValue(ref(fb().db, `teacherRooms/${uid}`), s => setRooms(s.val() || {})), [uid]);
  const list = useMemo(() => Object.entries(rooms || {}).sort((a, b) => b[1].createdAt - a[1].createdAt), [rooms]);
  if (!rooms) return <Loading />;
  const status: Record<string, string> = { WAITING: 'รอผู้เล่น', PLAYING: 'กำลังเล่น', PAUSED: 'หยุดชั่วคราว', FINISHED: 'จบแล้ว' };
  return (
    <div className="glass p-4 overflow-x-auto">
      {!list.length && <p className="text-soft">ยังไม่มีห้อง กด “สร้างห้องใหม่” เพื่อเริ่ม</p>}
      {!!list.length && (
        <table className="w-full text-sm min-w-[640px]">
          <thead><tr className="text-soft text-left">{['ห้อง', 'รหัส', 'สร้างเมื่อ', 'ผู้เล่น', 'สถานะ', ''].map(h => <th key={h} className="p-2">{h}</th>)}</tr></thead>
          <tbody>{list.map(([id, r]) => (
            <tr key={id} className="border-t border-white/10">
              <td className="p-2 font-semibold">{r.name}</td><td className="p-2 font-display neon-text">{r.code}</td>
              <td className="p-2">{new Date(r.createdAt).toLocaleString('th-TH')}</td><td className="p-2">{r.players}</td>
              <td className="p-2"><span className="chip">{status[r.status] || r.status}</span></td>
              <td className="p-2 flex gap-2 justify-end">
                <button className="btn btn-sm" onClick={() => go(`/host/${id}`)}><ExternalLink size={14} />{r.status === 'FINISHED' ? 'ดูผล' : 'ควบคุมเกม'}</button>
                {r.status === 'FINISHED' && <button className="btn btn-ghost btn-sm" onClick={() => setView(id)}><Download size={14} />รายงาน</button>}
              </td>
            </tr>))}</tbody>
        </table>
      )}
      <Modal open={!!view} onClose={() => setView(null)} wide label="รายงานผลการเรียนรู้">{view && <Report roomId={view} toast={toast} />}</Modal>
    </div>
  );
}

function Report({ roomId, toast }: { roomId: string; toast: (t: string, k?: 'bad' | 'good') => void }) {
  const [data, setData] = useState<{ results: GameResultRow[]; name: string; code: string } | null>(null);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  useEffect(() => {
    get(ref(fb().db, `results/${roomId}`)).then(s => setData(s.val())).catch(e => toast(e.message, 'bad'));
    get(ref(fb().db, `roomAnswers/${roomId}`)).then(s => setAnswers(Object.values(s.val() || {}) as AnswerRecord[])).catch(() => {});
  }, [roomId, toast]);
  if (!data) return <Loading />;
  const byCard: Record<string, { n: number; ok: number }> = {};
  answers.filter(a => a.kind !== 'special').forEach(a => { const c = (byCard[a.cardId] = byCard[a.cardId] || { n: 0, ok: 0 }); c.n++; if (a.verdict === 'full' || a.verdict === 'partial') c.ok++; });
  const hardest = Object.entries(byCard).filter(([, v]) => v.n > 0).sort((a, b) => a[1].ok / a[1].n - b[1].ok / b[1].n).slice(0, 5);
  return (
    <div>
      <h2 className="text-xl font-semibold">รายงาน: {data.name} ({data.code})</h2>
      <table className="w-full text-sm mt-3"><thead><tr className="text-soft text-left">{['อันดับ', 'กลุ่ม', 'คะแนน', '✅', '🟡', '❌'].map(h => <th key={h} className="p-1">{h}</th>)}</tr></thead>
        <tbody>{data.results.map(r => <tr key={r.playerId} className="border-t border-white/10"><td className="p-1">{r.rank}</td><td className="p-1">{r.name}{r.captain ? ` · ${r.captain}` : ''}</td><td className="p-1">{r.score}</td><td className="p-1">{r.correct}</td><td className="p-1">{r.partial}</td><td className="p-1">{r.wrong}</td></tr>)}</tbody></table>
      {!!hardest.length && <><h3 className="font-semibold mt-4">การ์ดที่ตอบถูกน้อยที่สุด</h3><ul className="text-sm text-soft mt-1">{hardest.map(([id, v]) => <li key={id}>{id}: ถูก {v.ok}/{v.n} ครั้ง</li>)}</ul></>}
      <div className="flex flex-wrap gap-2 mt-4">
        <button className="btn btn-sm" onClick={() => downloadCsv(`สรุปผล-${data.code}.csv`, [['อันดับ', 'กลุ่ม', 'ผู้เข้าสู่ระบบ', 'คะแนน', 'ตำแหน่ง', 'ถูกทั้งหมด', 'ถูกบางส่วน', 'ผิด', 'การ์ดที่เปิด', 'ผู้ชนะ'], ...data.results.map(r => [r.rank, r.name, r.captain || '', r.score, r.position, r.correct, r.partial, r.wrong, r.cards, r.winner ? 'ใช่' : ''])])}><Download size={14} />สรุปผล CSV</button>
        <button className="btn btn-ghost btn-sm" onClick={() => downloadCsv(`คำตอบรายข้อ-${data.code}.csv`, [['เวลา', 'กลุ่ม', 'การ์ด', 'ประเภท', 'คำตอบ', 'ผล', 'คะแนน', 'ครูตัดสิน'], ...answers.sort((a, b) => a.t - b.t).map(a => [new Date(a.t).toLocaleString('th-TH'), a.playerName, a.cardId, a.kind, Array.isArray(a.selection) ? a.selection.join('+') : String(a.selection ?? ''), a.verdict, a.points, a.byTeacher ? 'ใช่' : ''])])}><Download size={14} />คำตอบรายข้อ CSV</button>
      </div>
    </div>
  );
}

/* ---------------- content management ---------------- */
function ContentTab({ kind }: { kind: 'questions' | 'situation' | 'special' }) {
  const toast = useToast();
  const [state, setState] = useState<{ content: ContentBundle; seeded: boolean } | null>(null);
  const [edit, setEdit] = useState<Record<string, unknown> | null>(null);
  const [filter, setFilter] = useState('');
  const key: keyof ContentBundle = kind === 'questions' ? 'question' : kind;
  const reload = () => C.loadContent().then(setState).catch(e => toast(e.message, 'bad'));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { reload(); }, []);
  if (!state) return <Loading />;
  const items = Object.values(state.content[key]) as (QuestionCard | SituationCard | SpecialCard)[];
  const shown = items.filter(i => !filter || JSON.stringify(i).includes(filter)).sort((a, b) => a.id.localeCompare(b.id));
  const save = async (raw: Record<string, unknown>) => {
    try {
      if (!state.seeded) await C.seedDefaults();
      if (key === 'question') await C.saveQuestion(raw); else if (key === 'situation') await C.saveSituation(raw); else await C.saveSpecial(raw);
      toast('บันทึกแล้ว', 'good'); setEdit(null); reload();
    } catch (e) { toast((e as Error).message, 'bad'); }
  };
  const del = async (id: string) => { if (!confirm(`ลบ ${id}?`)) return; try { if (!state.seeded) await C.seedDefaults(); await C.deleteCard(key, id); toast('ลบแล้ว', 'good'); reload(); } catch (e) { toast((e as Error).message, 'bad'); } };
  const newItem = (): Record<string, unknown> => {
    const id = (key === 'question' ? 'q' : key === 'situation' ? 's' : 'sp-') + Date.now().toString(36);
    if (key === 'question') return { id, kind: 'question', category: QUESTION_CATEGORIES[0], difficulty: 'medium', text: '', choices: ['', '', '', ''], answer: 0, explanation: '', points: 3, enabled: true };
    if (key === 'situation') return { id, kind: 'situation', title: '', text: '', points: 3, answers: [['transverse', 'mechanical']], explanation: '', enabled: true };
    return { id, kind: 'special', type: 'REWARD', title: '', text: '', effect: { op: 'score', amount: 5 }, enabled: true };
  };
  return (
    <div className="glass p-4">
      {!state.seeded && <div className="glass-soft p-3 mb-3 text-sm flex flex-wrap gap-2 items-center"><Database size={16} />ตอนนี้ใช้ชุดข้อมูลเริ่มต้นในระบบ (การ์ดต้นฉบับ + คำถาม 50 ข้อ) แก้ไขครั้งแรกระบบจะบันทึกชุดนี้ลงฐานข้อมูลให้อัตโนมัติ
        <button className="btn btn-ghost btn-sm" onClick={() => C.seedDefaults().then(reload).then(() => toast('บันทึกชุดเริ่มต้นแล้ว', 'good')).catch(e => toast(e.message, 'bad'))}>บันทึกชุดเริ่มต้นตอนนี้</button></div>}
      <div className="flex flex-wrap gap-2 items-center mb-3">
        <input className="field !w-auto flex-1 min-w-[180px]" placeholder="ค้นหา..." value={filter} onChange={e => setFilter(e.target.value)} aria-label="ค้นหา" />
        <button className="btn btn-sm" onClick={() => setEdit(newItem())}><Plus size={14} />เพิ่ม</button>
        {key === 'question' && <ImportQuestions onDone={reload} seeded={state.seeded} />}
        <button className="btn btn-ghost btn-sm" onClick={() => { const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${key}.json`; a.click(); }}><Download size={14} />ส่งออก JSON</button>
      </div>
      <p className="text-soft text-sm mb-2">ทั้งหมด {items.length} รายการ · เปิดใช้ {items.filter(i => i.enabled).length} · การแก้ไขมีผลกับห้องที่สร้างใหม่</p>
      <ul className="grid gap-2">
        {shown.map(i => (
          <li key={i.id} className={`glass-soft p-3 flex gap-3 items-start ${i.enabled ? '' : 'opacity-50'}`}>
            {'image' in i && i.image && <img src={i.image} alt="" className="w-14 rounded-md hidden sm:block" />}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-1 mb-1"><span className="chip">{i.id}</span>
                {i.kind === 'question' && <><span className="chip">{i.category}</span><span className="chip">{i.difficulty}</span><span className="chip">{i.points} คะแนน</span></>}
                {i.kind === 'situation' && <><span className="chip">{i.points} คะแนน</span><span className="chip !text-good">{i.answers.map(a => a.map(t => WAVE_TYPE_LABEL[t].th).join('+')).join(' / ')}</span></>}
                {i.kind === 'special' && <span className="chip">{i.type}</span>}
              </div>
              <b>{i.kind === 'question' ? <Latex text={i.text} /> : i.title}</b>
              {i.kind !== 'question' && <p className="text-sm text-soft">{i.text}</p>}
              {i.kind === 'question' && <p className="text-sm text-good">เฉลย: <Latex text={i.choices[i.answer]} /></p>}
              {i.kind === 'situation' && i.note && <p className="text-xs text-gold mt-1">หมายเหตุ: {i.note}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <button className="btn btn-ghost btn-sm !px-2" aria-label={`แก้ไข ${i.id}`} onClick={() => setEdit(structuredClone(i) as unknown as Record<string, unknown>)}><Pencil size={14} /></button>
              <button className="btn btn-danger btn-sm !px-2" aria-label={`ลบ ${i.id}`} onClick={() => del(i.id)}><Trash2 size={14} /></button>
            </div>
          </li>
        ))}
      </ul>
      <Modal open={!!edit} onClose={() => setEdit(null)} wide label="แก้ไข">{edit && <Editor kind={key} value={edit} onSave={save} />}</Modal>
    </div>
  );
}

function ImportQuestions({ onDone, seeded }: { onDone: () => void; seeded: boolean }) {
  const toast = useToast();
  const onFile = async (f: File) => {
    const text = await f.text();
    let list: unknown[] = [];
    try {
      if (f.name.toLowerCase().endsWith('.json')) list = JSON.parse(text);
      else {
        const rows = parseCsv(text); const head = rows.shift()!.map(h => h.trim().toLowerCase());
        const col = (r: string[], k: string) => r[head.indexOf(k)] ?? '';
        list = rows.map(r => ({ id: col(r, 'id'), category: col(r, 'category'), difficulty: col(r, 'difficulty') || 'medium', text: col(r, 'text'), choices: [col(r, 'choice_a'), col(r, 'choice_b'), col(r, 'choice_c'), col(r, 'choice_d')], answer: 'abcd'.indexOf(col(r, 'answer').trim().toLowerCase()) >= 0 ? 'abcd'.indexOf(col(r, 'answer').trim().toLowerCase()) : Number(col(r, 'answer')), explanation: col(r, 'explanation'), points: Number(col(r, 'points') || 3), image: col(r, 'image') || undefined, enabled: true }));
      }
      if (!seeded) await C.seedDefaults();
      const r = await C.importQuestions(list);
      toast(`นำเข้า ${r.saved} ข้อ${r.errors.length ? ` · ผิดพลาด ${r.errors.length} ข้อ: ${r.errors.slice(0, 2).join('; ')}` : ''}`, r.errors.length ? 'bad' : 'good');
      onDone();
    } catch (e) { toast('อ่านไฟล์ไม่ได้: ' + (e as Error).message, 'bad'); }
  };
  return (
    <>
      <label className="btn btn-ghost btn-sm cursor-pointer"><Upload size={14} />นำเข้า CSV/JSON<input type="file" accept=".csv,.json" className="hidden" onChange={e => e.target.files?.[0] && onFile(e.target.files[0])} /></label>
      <button className="btn btn-ghost btn-sm" onClick={() => downloadCsv('แม่แบบคำถาม.csv', [['id', 'category', 'difficulty', 'text', 'choice_a', 'choice_b', 'choice_c', 'choice_d', 'answer', 'explanation', 'points', 'image'], ['q101', 'ความถี่', 'easy', 'คลื่นมีความถี่ 2 Hz คาบเท่าใด', '0.5 s', '2 s', '4 s', '1 s', 'a', 'T = 1/f = 0.5 s', '2', '']])}>แม่แบบ CSV</button>
    </>
  );
}

const EFFECT_PRESETS: [string, unknown][] = [
  ['ได้คะแนน +5', { op: 'score', amount: 5 }], ['เสียคะแนน −5', { op: 'score', amount: -5 }], ['เดินหน้า 2 ช่อง', { op: 'move', steps: 2 }], ['ถอยหลัง 2 ช่อง', { op: 'move', steps: -2 }],
  ['พักการเดิน 1 ตา', { op: 'skipTurn', turns: 1 }], ['ทอยซ้ำ', { op: 'extraRoll' }], ['คลื่นสะท้อน (คี่ถอย/คู่เดิน)', { op: 'diceParity' }], ['คลื่นเสียงก้อง (ทอยถอยแล้วทอยเดิน)', { op: 'echo' }],
  ['ไปช่องสีเดียวกันถัดไป', { op: 'sameColor' }], ['ตอบถูกครั้งถัดไป ×2', { op: 'nextAnswerMultiplier', factor: 2 }], ['กลุ่มถัดไปตอบผิดครั้งถัดไป', { op: 'forceNextOpponentWrong' }],
  ['ส่ง 5 คะแนนให้กลุ่มถัดไป', { op: 'transferToNext', amount: 5 }], ['ทุกกลุ่มช่วยตอบการ์ดถัดไป (ผิดหัก ×2)', { op: 'teamworkNextSituation', penaltyMultiplier: 2 }], ['ภารกิจทำความดี (ครูยืนยัน) +5', { op: 'goodDeed', reward: 5 }],
  ['เลือก: +10 คะแนน หรือ เดินหน้า 3', { op: 'choice', options: [{ label: 'รับ 10 คะแนน', effect: { op: 'score', amount: 10 } }, { label: 'เดินหน้า 3 ช่อง', effect: { op: 'move', steps: 3 } }] }]
];

function Editor({ kind, value, onSave }: { kind: keyof ContentBundle; value: Record<string, unknown>; onSave: (v: Record<string, unknown>) => void }) {
  const [v, setV] = useState(value);
  const [effectText, setEffectText] = useState(JSON.stringify(value.effect ?? {}, null, 2));
  const set = (k: string, x: unknown) => setV(p => ({ ...p, [k]: x }));
  const field = (k: string, label: string, area = false) => (
    <label className="block"><span className="label">{label}</span>
      {area ? <textarea className="field min-h-[80px]" value={String(v[k] ?? '')} onChange={e => set(k, e.target.value)} /> : <input className="field" value={String(v[k] ?? '')} onChange={e => set(k, e.target.value)} />}
    </label>
  );
  const submit = () => {
    if (kind === 'special') { try { onSave({ ...v, effect: JSON.parse(effectText) }); } catch { alert('รูปแบบ JSON ของผลการ์ดไม่ถูกต้อง'); } }
    else onSave(v);
  };
  return (
    <div className="grid gap-3">
      <h2 className="text-xl font-semibold">{kind === 'question' ? 'คำถาม' : kind === 'situation' ? 'การ์ดสถานการณ์' : 'การ์ดพิเศษ'}: {String(v.id)}</h2>
      <label className="flex items-center gap-2"><input type="checkbox" className="w-5 h-5 accent-[#00E5FF]" checked={v.enabled !== false} onChange={e => set('enabled', e.target.checked)} />เปิดใช้งาน</label>
      {kind === 'question' && (<>
        <div className="grid sm:grid-cols-3 gap-3">
          <label className="block"><span className="label">หมวดหมู่</span><input className="field" list="cats" value={String(v.category)} onChange={e => set('category', e.target.value)} /><datalist id="cats">{QUESTION_CATEGORIES.map(c => <option key={c} value={c} />)}</datalist></label>
          <label className="block"><span className="label">ระดับความยาก</span><select className="field" value={String(v.difficulty)} onChange={e => set('difficulty', e.target.value)}>{[['easy', 'ง่าย'], ['medium', 'ปานกลาง'], ['hard', 'ยาก']].map(([a, b]) => <option key={a} value={a} className="bg-navy">{b}</option>)}</select></label>
          <label className="block"><span className="label">คะแนน</span><input type="number" className="field" value={Number(v.points)} onChange={e => set('points', Number(e.target.value))} /></label>
        </div>
        {field('text', 'โจทย์ (สมการเขียนระหว่าง $...$ เช่น $v = f\\lambda$)', true)}
        <p className="text-sm text-soft">ตัวอย่างการแสดงผล: <Latex text={String(v.text || '')} /></p>
        {[0, 1, 2, 3].map(i => (
          <label key={i} className="flex items-center gap-2"><input type="radio" name="ans" className="w-5 h-5 accent-[#34F5A4]" checked={v.answer === i} onChange={() => set('answer', i)} aria-label={`ตัวเลือก ${'ABCD'[i]} เป็นคำตอบที่ถูก`} />
            <span className="font-display w-5">{'ABCD'[i]}</span><input className="field" value={(v.choices as string[])[i]} onChange={e => { const c = [...(v.choices as string[])]; c[i] = e.target.value; set('choices', c); }} /></label>
        ))}
        {field('image', 'รูปประกอบ (URL https:// หรือ /assets/...) ไม่บังคับ')}
        {field('explanation', 'คำอธิบายเฉลย', true)}
      </>)}
      {kind === 'situation' && (<>
        <div className="grid sm:grid-cols-[1fr_120px] gap-3">{field('title', 'ชื่อการ์ด')}<label className="block"><span className="label">คะแนน</span><input type="number" className="field" value={Number(v.points)} onChange={e => set('points', Number(e.target.value))} /></label></div>
        {field('text', 'สถานการณ์', true)}
        <div><span className="label">ชุดคำตอบที่ถูกต้อง (เพิ่มได้หลายชุด เช่น วิทยุ = เสียง หรือ คลื่นวิทยุ)</span>
          {(v.answers as WaveType[][]).map((set_, si) => (
            <div key={si} className="glass-soft p-2 mb-2 flex flex-wrap gap-2 items-center"><span className="text-sm">ชุดที่ {si + 1}:</span>
              {WAVE_TYPES.map(t => <label key={t} className="flex items-center gap-1 text-sm"><input type="checkbox" className="accent-[#00E5FF]" checked={set_.includes(t)} onChange={e => { const a = (v.answers as WaveType[][]).map(x => [...x]); a[si] = e.target.checked ? [...a[si], t] : a[si].filter(y => y !== t); set('answers', a); }} />{WAVE_TYPE_LABEL[t].th}</label>)}
              {(v.answers as WaveType[][]).length > 1 && <button className="btn btn-danger btn-sm !min-h-8" onClick={() => set('answers', (v.answers as WaveType[][]).filter((_, j) => j !== si))}>ลบชุดนี้</button>}
            </div>
          ))}
          <button className="btn btn-ghost btn-sm" onClick={() => set('answers', [...(v.answers as WaveType[][]), []])}>+ เพิ่มชุดคำตอบ</button>
        </div>
        {field('explanation', 'คำอธิบายเฉลย', true)}
        {field('note', 'หมายเหตุสำหรับครู (ไม่แสดงต่อนักเรียน)', true)}
        {field('image', 'รูปการ์ด (URL) ไม่บังคับ')}
      </>)}
      {kind === 'special' && (<>
        <div className="grid sm:grid-cols-[1fr_200px] gap-3">{field('title', 'ชื่อการ์ด')}
          <label className="block"><span className="label">ประเภท</span><select className="field" value={String(v.type)} onChange={e => set('type', e.target.value)}>{['REWARD', 'PENALTY', 'SITUATION', 'GOOD_DEED'].map(t => <option key={t} className="bg-navy">{t}</option>)}</select></label></div>
        {field('text', 'ข้อความบนการ์ด', true)}
        <label className="block"><span className="label">ผลของการ์ด (เลือกแบบสำเร็จรูป หรือแก้ JSON ขั้นสูง)</span>
          <select className="field mb-2" value="" onChange={e => { const p = EFFECT_PRESETS[Number(e.target.value)]; if (p) setEffectText(JSON.stringify(p[1], null, 2)); }}><option value="" className="bg-navy">— เลือกผลการ์ดสำเร็จรูป —</option>{EFFECT_PRESETS.map(([t], i) => <option key={i} value={i} className="bg-navy">{t}</option>)}</select>
          <textarea className="field font-mono text-xs min-h-[140px]" value={effectText} onChange={e => setEffectText(e.target.value)} /></label>
        <p className="text-xs text-soft">ระบบตรวจผลการ์ดก่อนบันทึก: เดินได้ไม่เกิน ±20 ช่อง และตำแหน่งจะอยู่ระหว่าง START–FINISH เสมอ · ห้ามสร้างการ์ดที่ทำให้นักเรียนได้รับอันตรายหรืออับอาย</p>
      </>)}
      <button className="btn btn-lg" onClick={submit}><Save />บันทึก</button>
    </div>
  );
}

/* ---------------- default rules ---------------- */
function RulesTab() {
  const toast = useToast();
  const [s, setS] = useState<GameSettings | null>(null);
  useEffect(() => { C.loadDefaultSettings().then(v => setS(v || { ...DEFAULT_SETTINGS })); }, []);
  if (!s) return <Loading />;
  return (
    <div className="glass p-4">
      <p className="text-soft text-sm mb-3">กติกาเริ่มต้นที่ใช้ตอนสร้างห้องใหม่ (ปรับแยกแต่ละห้องได้อีกครั้งในหน้าสร้างห้อง)</p>
      <SettingsForm value={s} onChange={setS} />
      <button className="btn mt-4" onClick={() => C.saveDefaultSettings(s).then(() => toast('บันทึกกติกาเริ่มต้นแล้ว', 'good')).catch(e => toast(e.message, 'bad'))}><Save size={18} />บันทึกกติกาเริ่มต้น</button>
    </div>
  );
}
