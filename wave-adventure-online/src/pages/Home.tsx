/* Splash · Home · How to play · Knowledge · Settings · Create room · Join room */
import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Users, PlusCircle, BookOpen, Lightbulb, Settings as Cog, LogIn, GraduationCap, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { api, ensureUser, lastRoom, schoolLogin, teacherSignIn, teacherSignInEmulator } from '../services/api';
import { useAuthUser } from '../hooks/useFirebase';
import { AvatarPicker, ColorPicker, Pawn, go, useToast } from '../components/ui';
import { DEFAULT_SETTINGS, TOKEN_COLORS } from '@shared/rules.config';
import { WAVE_TYPE_LABEL } from '@shared/waveTypes';
import type { GameSettings } from '@shared/types';
import { getPrefs, setPrefs, sfx } from '../game/sound';
import { isConfigured, USE_EMULATORS } from '../config/firebase';
import { SettingsForm } from './SettingsForm';
import { loadDefaultSettings } from '../services/content';

/* ---------------- Splash ---------------- */
export function Splash() {
  return (
    <div className="min-h-[78dvh] grid place-items-center text-center page-enter">
      <div>
        <motion.img src="/assets/board/board-preview.webp" alt="ภาพกระดานต้นฉบับ การผจญภัยในโลกคลื่น" className="w-[min(560px,92vw)] mx-auto rounded-2xl border border-neon/40 shadow-[0_0_60px_rgba(0,229,255,.25)]"
          initial={{ opacity: 0, y: 20, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: .7 }} />
        <h1 className="title-neon text-3xl sm:text-5xl mt-6">WAVE ADVENTURE</h1>
        <p className="font-display tracking-[.3em] text-ice text-sm sm:text-base">ONLINE</p>
        <p className="text-xl sm:text-2xl mt-2">การผจญภัยในโลกคลื่น</p>
        <p className="text-soft mt-1">บอร์ดเกมฟิสิกส์ ม.5 เรื่องคลื่นกล · เล่นออนไลน์พร้อมกันหลายเครื่อง</p>
        <button className="btn btn-lg mt-6 pulse-glow" onClick={() => { sfx.turn(); go('/home'); }}><Sparkles />เริ่มต้นการผจญภัย</button>
      </div>
    </div>
  );
}

/* ---------------- Home ---------------- */
export function Home() {
  const { user, teacher } = useAuthUser();
  const last = lastRoom.get();
  const tiles = [
    { icon: <Users />, t: 'เข้าร่วมห้อง', d: 'นักเรียนกรอกรหัสห้อง 6 ตัว หรือสแกน QR', to: '/join', main: true },
    { icon: <PlusCircle />, t: 'สร้างห้องเกม', d: 'สำหรับครู: ตั้งกติกา รับรหัสห้องและ QR', to: '/create' },
    { icon: <BookOpen />, t: 'วิธีเล่น', d: 'กติกาบอร์ดเกม “ผจญภัยในโลกคลื่น”', to: '/how' },
    { icon: <Lightbulb />, t: 'คลังความรู้', d: 'ทบทวนประเภทคลื่นก่อนเล่น', to: '/learn' },
    { icon: <GraduationCap />, t: 'Teacher Dashboard', d: 'จัดการห้อง คำถาม การ์ด และผลการเรียนรู้', to: '/teacher' },
    { icon: <Cog />, t: 'ตั้งค่า', d: 'เสียง และการลดแอนิเมชัน', to: '/settings' }
  ];
  return (
    <div className="page-enter">
      <div className="grid lg:grid-cols-[1.1fr_1fr] gap-5 items-center">
        <div>
          <div className="chip">PHYSICS · MECHANICAL WAVES · ม.5</div>
          <h1 className="title-neon text-3xl sm:text-4xl mt-3">การผจญภัยในโลกคลื่น</h1>
          <p className="text-soft mt-2 leading-relaxed">ออกเดินทาง • สำรวจ • เรียนรู้ • พิชิต — ทอยลูกเต๋า เดินบนกระดาน หยุดช่องคลื่นเพื่อจำแนกประเภทคลื่นจากสถานการณ์จริง และลุ้นการ์ดพิเศษที่ช่องฟ้าผ่า</p>
          {last && user && <button className="btn btn-royal mt-4" onClick={() => go(`/room/${last.roomId}`)}><LogIn size={18} />กลับเข้าห้องล่าสุด ({last.code})</button>}
          {teacher && <span className="chip ml-2 mt-4">คุณเข้าสู่ระบบในฐานะครู</span>}
          {!isConfigured && <p className="mt-4 glass-soft p-3 text-sm text-gold">⚠ ยังไม่ได้ตั้งค่า Firebase — ดูหน้า “วิธีเล่น” และ “คลังความรู้” ได้ แต่การเล่นออนไลน์ต้องตั้งค่าตาม FIREBASE_SETUP.md</p>}
        </div>
        <img src="/assets/board/board-preview.webp" alt="ภาพตัวอย่างกระดานต้นฉบับ" className="rounded-2xl border border-neon/30 shadow-[0_0_40px_rgba(0,229,255,.18)]" />
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-6">
        {tiles.map(t => (
          <button key={t.to} onClick={() => { sfx.click(); go(t.to); }} className={`glass text-left p-4 flex gap-3 items-start transition hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(0,229,255,.25)] ${t.main ? 'ring-2 ring-neon/60' : ''}`}>
            <span className="w-11 h-11 rounded-xl grid place-items-center bg-neon/10 text-neon shrink-0">{t.icon}</span>
            <span><b className="block text-lg">{t.t}</b><span className="text-sm text-soft">{t.d}</span></span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Create room (teacher) ---------------- */
export function CreateRoom() {
  const toast = useToast();
  const { user, teacher, ready } = useAuthUser();
  const [name, setName] = useState('ห้องผจญภัยในโลกคลื่น ม.5');
  const [settings, setSettings] = useState<GameSettings>({ ...DEFAULT_SETTINGS });
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (teacher) loadDefaultSettings().then(v => v && setSettings(v)); }, [teacher]);
  if (!isConfigured) return <NotConfigured />;
  if (ready && !teacher) return <TeacherGate />;
  const create = async () => {
    setBusy(true);
    try { const r = await api.createRoom(name, settings); toast(`สร้างห้องแล้ว รหัส ${r.code}`, 'good'); go(`/host/${r.roomId}`); }
    catch (e) { toast((e as Error).message, 'bad'); } finally { setBusy(false); }
  };
  return (
    <div className="max-w-3xl mx-auto glass p-4 sm:p-6 page-enter">
      <div className="chip">CREATE ROOM</div>
      <h1 className="text-2xl font-semibold mt-2">สร้างห้องเกม</h1>
      <p className="text-soft text-sm">ครู: {user?.displayName || user?.email}</p>
      <label className="label mt-4" htmlFor="roomName">ชื่อห้อง</label>
      <input id="roomName" className="field" maxLength={60} value={name} onChange={e => setName(e.target.value)} />
      <h2 className="font-semibold mt-5 mb-2">ตั้งค่ากติกา</h2>
      <SettingsForm value={settings} onChange={setSettings} />
      <button className="btn btn-lg w-full mt-5" disabled={busy || name.trim().length < 2} onClick={create}><PlusCircle />สร้างห้องและรับรหัส</button>
    </div>
  );
}

export function TeacherGate() {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  return (
    <div className="max-w-md mx-auto glass p-6 text-center page-enter">
      <GraduationCap className="mx-auto text-neon" size={44} />
      <h1 className="text-xl font-semibold mt-2">สำหรับครูเท่านั้น</h1>
      <p className="text-soft mt-1 text-sm">เข้าสู่ระบบด้วยบัญชี Google ของครูที่ได้รับสิทธิ์ (อีเมลอยู่ในรายการ TEACHER_EMAILS)</p>
      <button className="btn btn-lg mt-4" disabled={busy} onClick={async () => { setBusy(true); try { await teacherSignIn(); toast('ยืนยันสิทธิ์ครูแล้ว', 'good'); location.reload(); } catch (e) { toast((e as Error).message, 'bad'); } finally { setBusy(false); } }}>เข้าสู่ระบบด้วย Google</button>
      {USE_EMULATORS && (
        <div className="glass-soft p-3 mt-4 text-left">
          <p className="text-xs text-gold mb-2">โหมดทดสอบ (Firebase Emulator) — ไม่แสดงในเว็บจริง</p>
          <div className="flex gap-2"><input id="emuEmail" className="field" defaultValue="teacher@school.test" aria-label="อีเมลครูทดสอบ" />
            <button className="btn btn-sm" disabled={busy} onClick={async () => { setBusy(true); try { await teacherSignInEmulator((document.getElementById('emuEmail') as HTMLInputElement).value); location.reload(); } catch (e) { toast((e as Error).message, 'bad'); } finally { setBusy(false); } }}>เข้าสู่ระบบ (ทดสอบ)</button></div>
        </div>
      )}
    </div>
  );
}

export function NotConfigured() {
  return (
    <div className="max-w-xl mx-auto glass p-6 page-enter">
      <h1 className="text-xl font-semibold">ยังไม่ได้เชื่อมต่อ Firebase</h1>
      <p className="text-soft mt-2">การเล่นออนไลน์หลายเครื่องต้องมี Firebase Project ของโรงเรียน ทำตามขั้นตอนใน <b>FIREBASE_SETUP.md</b> แล้วใส่ค่าใน Environment Variables ของ Netlify</p>
      <button className="btn btn-ghost mt-4" onClick={() => go('/home')}>กลับหน้าแรก</button>
    </div>
  );
}

/* ---------------- Join room (students) ---------------- */
export function JoinRoom({ initialCode }: { initialCode?: string }) {
  const toast = useToast();
  const { sid, sname } = useAuthUser();
  const [code, setCode] = useState((initialCode || '').toUpperCase());
  const [name, setName] = useState(() => localStorage.getItem('wao.name') || '');
  const [avatar, setAvatar] = useState(() => localStorage.getItem('wao.avatar') || 'surfer');
  const [color, setColor] = useState<string>(() => localStorage.getItem('wao.color') || TOKEN_COLORS[0].hex);
  const [busy, setBusy] = useState(false);
  const [school, setSchool] = useState({ id: '', pin: '' });
  const [showSchool, setShowSchool] = useState(false);
  useEffect(() => { if (initialCode) setCode(initialCode.toUpperCase()); }, [initialCode]);
  if (!isConfigured) return <NotConfigured />;
  const join = async () => {
    setBusy(true);
    try {
      await ensureUser();
      const r = await api.joinRoom(code.trim(), name.trim(), avatar, color);
      try { localStorage.setItem('wao.name', name.trim()); localStorage.setItem('wao.avatar', avatar); localStorage.setItem('wao.color', color); } catch { /* ignore */ }
      lastRoom.set({ roomId: r.roomId, code: code.trim() });
      toast(r.rejoined ? 'กลับเข้าห้องเดิมแล้ว' : 'เข้าร่วมห้องสำเร็จ!', 'good');
      go(`/room/${r.roomId}`);
    } catch (e) { toast((e as Error).message, 'bad'); } finally { setBusy(false); }
  };
  const loginSchool = async () => {
    setBusy(true);
    try { const s = await schoolLogin(school.id, school.pin); toast(`ยืนยันตัวตนแล้ว: ${s.name}`, 'good'); setShowSchool(false); }
    catch (e) { toast((e as Error).message, 'bad'); } finally { setBusy(false); }
  };
  return (
    <div className="max-w-2xl mx-auto glass p-4 sm:p-6 page-enter">
      <div className="chip">JOIN ROOM</div>
      <h1 className="text-2xl font-semibold mt-2">เข้าร่วมห้องเกม</h1>
      <div className="grid sm:grid-cols-2 gap-4 mt-4">
        <div>
          <label className="label" htmlFor="code">รหัสห้อง (6 ตัว)</label>
          <input id="code" className="field font-display tracking-[.4em] text-2xl text-center uppercase" maxLength={6} autoComplete="off" inputMode="text" value={code} onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} placeholder="ABC234" />
        </div>
        <div>
          <label className="label" htmlFor="nick">ชื่อกลุ่ม / ชื่อเล่น</label>
          <input id="nick" className="field" maxLength={20} value={name} onChange={e => setName(e.target.value)} placeholder="เช่น ทีมคลื่นยักษ์" />
        </div>
      </div>
      <div className="mt-4"><span className="label">เลือก Avatar</span><AvatarPicker value={avatar} onChange={setAvatar} /></div>
      <div className="mt-4 flex flex-wrap items-center gap-4"><span className="label !mb-0">สีตัวเดิน</span><ColorPicker value={color} onChange={setColor} /><Pawn color={color} size={30} /></div>
      <div className="mt-4 glass-soft p-3 text-sm">
        {sid ? <p>✅ เข้าสู่ระบบด้วยเลขประจำตัวแล้ว: <b>{sname}</b> ({sid})</p>
          : <><p className="text-soft">ถ้าครูกำหนดให้ใช้เลขประจำตัว ให้เข้าสู่ระบบด้วยเลขประจำตัว + PIN เดียวกับระบบห้องเรียนออนไลน์</p>
            <button className="btn btn-ghost btn-sm mt-2" onClick={() => setShowSchool(s => !s)}><LogIn size={16} />เข้าสู่ระบบด้วยเลขประจำตัว</button></>}
        {showSchool && !sid && (
          <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-2 mt-3">
            <input className="field" inputMode="numeric" placeholder="เลขประจำตัว" value={school.id} onChange={e => setSchool(s => ({ ...s, id: e.target.value }))} aria-label="เลขประจำตัว" />
            <input className="field" type="password" inputMode="numeric" placeholder="รหัส PIN" value={school.pin} onChange={e => setSchool(s => ({ ...s, pin: e.target.value }))} aria-label="รหัส PIN" />
            <button className="btn" disabled={busy || !school.id || !school.pin} onClick={loginSchool}>ยืนยัน</button>
          </div>
        )}
      </div>
      <button className="btn btn-lg w-full mt-5" disabled={busy || code.length !== 6 || name.trim().length < 2} onClick={join}><Users />เข้าร่วมห้อง</button>
    </div>
  );
}

/* ---------------- How to play ---------------- */
export function HowToPlay() {
  const steps = [
    ['🎲', 'เริ่มเกม', 'แต่ละกลุ่มเข้าห้องด้วยรหัสจากครู ทุกกลุ่มกด “พร้อม” ครูกดเริ่ม ระบบทอยลูกเต๋าให้ทุกกลุ่ม กลุ่มที่ได้แต้มสูงสุดเริ่มก่อน แล้ววนตามลำดับ'],
    ['👣', 'การเดิน', 'เมื่อถึงตา กดทอยลูกเต๋า 1 ลูก ตัวเดินจะเดินหน้าตามแต้มบนกระดาน หยุดช่องปกติถือว่าจบตา'],
    ['🌊', 'ช่องคลื่น', 'เปิด “การ์ดสถานการณ์คลื่น” อ่านสถานการณ์ แล้วช่วยกันเลือก “การ์ดประเภทคลื่น” ที่ถูกต้อง (เลือกได้มากกว่า 1 ใบ)'],
    ['✅', 'การให้คะแนน', 'ตอบถูกได้คะแนนตามตัวเลขบนการ์ด (2–5) ถ้าเลือกถูกครบทุกใบได้ 2 เท่า (เช่น คลื่นแม่เหล็กไฟฟ้า + คลื่นตามขวาง) ถ้ามีใบที่ผิดหรือไม่ถูกเลย ได้ 0 คะแนนและถอยหลัง 2 ช่อง'],
    ['⚡', 'ช่องฟ้าผ่า', 'เปิด “การ์ดพิเศษ” และทำตามทันที เช่น ได้คะแนนเพิ่ม เดินหน้า ถอยหลัง พักตา หรือช่วยกันตอบทั้งห้อง'],
    ['🏁', 'การจบเกม', 'เกมจบเมื่อกลุ่มแรกไปถึง FINISH (เดินเกินได้) หรือหมดเวลาที่ครูกำหนด (30–35 นาที) แล้วรวมคะแนน กลุ่มที่คะแนนสูงสุดเป็น “ผู้พิชิตคลื่น”!'],
    ['👩‍🏫', 'บทบาทของครู', 'ผู้ดำเนินเกม (ชี้แจงกติกา บริหารเวลา) · ผู้ตัดสิน (ตรวจหรือยืนยันคำตอบ) · ผู้ให้ความรู้ (อธิบายเพิ่มเติมจากเฉลย)']
  ];
  return (
    <div className="max-w-3xl mx-auto page-enter">
      <h1 className="title-neon text-2xl sm:text-3xl">วิธีเล่น “ผจญภัยในโลกคลื่น (Wave Master)”</h1>
      <p className="text-soft mt-1">ผู้เล่น 2–6 กลุ่ม (กลุ่มละ 3–5 คน) · ใช้เวลา 30–60 นาที · เหมาะสำหรับ ม.5</p>
      <ol className="grid gap-3 mt-4">
        {steps.map(([i, t, d], k) => <li key={k} className="glass p-4 flex gap-3"><span className="text-3xl" aria-hidden>{i}</span><span><b className="block">{t}</b><span className="text-soft">{d}</span></span></li>)}
      </ol>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
        {Object.entries(WAVE_TYPE_LABEL).map(([k, v]) => <figure key={k} className="glass-soft p-2 text-center"><img src={v.image} alt={v.th} className="rounded-lg" /><figcaption className="text-sm mt-1">{v.th}</figcaption></figure>)}
      </div>
    </div>
  );
}

/* ---------------- Knowledge ---------------- */
export function Knowledge() {
  const items = [
    { t: 'คลื่นกล (Mechanical Wave)', d: 'ต้องอาศัยตัวกลางในการเคลื่อนที่ เช่น คลื่นเสียง คลื่นผิวน้ำ คลื่นในเส้นเชือก คลื่นแผ่นดินไหว เคลื่อนที่ผ่านสุญญากาศไม่ได้', e: 'v = fλ' },
    { t: 'คลื่นแม่เหล็กไฟฟ้า (Electromagnetic Wave)', d: 'ไม่ต้องอาศัยตัวกลาง เคลื่อนที่ในสุญญากาศได้ด้วยอัตราเร็ว 3×10⁸ m/s เช่น แสง คลื่นวิทยุ ไมโครเวฟ WiFi อินฟราเรด รังสีเอกซ์ และเป็นคลื่นตามขวางเสมอ', e: 'c = fλ' },
    { t: 'คลื่นตามขวาง (Transverse Wave)', d: 'อนุภาคตัวกลางสั่นตั้งฉากกับทิศการเคลื่อนที่ของคลื่น มีสันคลื่นและท้องคลื่น เช่น คลื่นในเส้นเชือก คลื่นแม่เหล็กไฟฟ้า', e: '' },
    { t: 'คลื่นตามยาว (Longitudinal Wave)', d: 'อนุภาคตัวกลางสั่นในแนวเดียวกับทิศการเคลื่อนที่ของคลื่น เกิดส่วนอัดและส่วนขยาย เช่น คลื่นเสียง สปริงที่ถูกดันเข้า–ออก คลื่น P ของแผ่นดินไหว', e: '' },
    { t: 'องค์ประกอบของคลื่น', d: 'แอมพลิจูด (A) = การกระจัดสูงสุด · ความยาวคลื่น (λ) = ระยะสันถึงสัน · ความถี่ (f) = จำนวนรอบต่อวินาที (Hz) · คาบ (T) = เวลา 1 รอบ', e: 'T = 1/f' },
    { t: 'การถ่ายทอดพลังงาน', d: 'คลื่นพาพลังงานไปโดยตัวกลางไม่ได้เคลื่อนที่ไปด้วย พลังงานคลื่นแปรผันตามกำลังสองของแอมพลิจูด', e: 'E ∝ A²' }
  ];
  return (
    <div className="max-w-3xl mx-auto page-enter">
      <h1 className="title-neon text-2xl sm:text-3xl">คลังความรู้: คลื่นกล ม.5</h1>
      <div className="grid sm:grid-cols-2 gap-3 mt-4">
        {items.map(i => <article key={i.t} className="glass p-4"><h2 className="font-semibold neon-text">{i.t}</h2><p className="text-soft mt-1 text-sm leading-relaxed">{i.d}</p>{i.e && <p className="font-display mt-2 text-ice">{i.e}</p>}</article>)}
      </div>
    </div>
  );
}

/* ---------------- Settings ---------------- */
export function SettingsPage() {
  const [p, setP] = useState(getPrefs());
  return (
    <div className="max-w-md mx-auto glass p-6 page-enter">
      <h1 className="text-xl font-semibold">ตั้งค่า</h1>
      <label className="flex items-center justify-between mt-4 gap-3"><span className="flex items-center gap-2">{p.sound ? <Volume2 /> : <VolumeX />}เสียงเอฟเฟกต์</span>
        <input type="checkbox" className="w-6 h-6 accent-[#00E5FF]" checked={p.sound} onChange={e => { setP(setPrefs({ sound: e.target.checked })); sfx.click(); }} /></label>
      <label className="flex items-center justify-between mt-4 gap-3"><span>ลดแอนิเมชัน (Reduced Motion)</span>
        <input type="checkbox" className="w-6 h-6 accent-[#00E5FF]" checked={p.reduceMotion} onChange={e => setP(setPrefs({ reduceMotion: e.target.checked }))} /></label>
      <p className="text-soft text-sm mt-4">การตั้งค่านี้บันทึกในอุปกรณ์นี้เท่านั้น</p>
    </div>
  );
}
