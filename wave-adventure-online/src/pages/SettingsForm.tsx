/* Game Settings form — ครูปรับกติกาได้ทุกข้อ (Backend ตรวจขอบเขตซ้ำอีกครั้ง) */
import type { GameSettings } from '@shared/types';
import { DEFAULT_SETTINGS } from '@shared/rules.config';

type K = keyof GameSettings;
const NUM: { k: K; label: string; min: number; max: number; unit?: string }[] = [
  { k: 'maxPlayers', label: 'จำนวนกลุ่มสูงสุด', min: 2, max: 6, unit: 'กลุ่ม' },
  { k: 'answerSeconds', label: 'เวลาตอบการ์ด', min: 10, max: 600, unit: 'วินาที' },
  { k: 'wrongMoveBack', label: 'ตอบผิดถอยหลัง', min: 0, max: 10, unit: 'ช่อง' },
  { k: 'wrongPenaltyPoints', label: 'ตอบผิดหักคะแนน', min: 0, max: 100, unit: 'คะแนน' },
  { k: 'fixedQuestionPoints', label: 'คะแนนคำถาม (แบบคงที่)', min: 0, max: 100, unit: 'คะแนน' },
  { k: 'timeLimitMinutes', label: 'เวลาเกมสูงสุด (0 = ไม่จำกัด)', min: 0, max: 240, unit: 'นาที' },
  { k: 'maxRounds', label: 'จำนวนรอบสูงสุด (0 = ไม่จำกัด)', min: 0, max: 200, unit: 'รอบ' }
];
const SEL: { k: K; label: string; opts: [string, string][] }[] = [
  { k: 'waveDeck', label: 'การ์ดที่ช่องคลื่น 🌊', opts: [['situation', 'การ์ดสถานการณ์ (ตามต้นฉบับ)'], ['question', 'คำถามฟิสิกส์ 4 ตัวเลือก'], ['mixed', 'ผสมทั้งสองแบบ']] },
  { k: 'questionPoints', label: 'คะแนนการ์ดคำถาม', opts: [['card', 'ตามระดับความยากของการ์ด'], ['fixed', 'คงที่ทุกข้อ']] },
  { k: 'winCondition', label: 'เงื่อนไขการชนะ', opts: [['highestScore', 'จบเมื่อกลุ่มแรกถึงเส้นชัย · คะแนนสูงสุดชนะ (ต้นฉบับ)'], ['firstToFinish', 'ถึงเส้นชัยก่อนชนะ']] },
  { k: 'turnOrder', label: 'ลำดับการเล่น', opts: [['diceOff', 'ทอยลูกเต๋า แต้มสูงสุดเริ่มก่อน (ต้นฉบับ)'], ['join', 'ตามลำดับที่เข้าห้อง'], ['random', 'สุ่ม']] }
];
const BOOL: { k: K; label: string }[] = [
  { k: 'doubleForFullAnswer', label: 'เลือกประเภทคลื่นถูกครบทุกใบ ได้คะแนน 2 เท่า' },
  { k: 'specialCardsEnabled', label: 'เปิดการ์ดพิเศษที่ช่องฟ้าผ่า ⚡' },
  { k: 'goodDeedCardsEnabled', label: 'เพิ่มการ์ดภารกิจทำความดี (ครูยืนยันก่อนให้คะแนน)' },
  { k: 'skipTurnsEnabled', label: 'อนุญาตการพัก/ข้ามตาจากการ์ด' },
  { k: 'teacherConfirm', label: 'ครูยืนยันผลทุกคำตอบก่อนให้คะแนน' },
  { k: 'cardMovesTriggerCells', label: 'เดินจากผลการ์ดแล้วเกิดเหตุการณ์ของช่องใหม่' },
  { k: 'exactFinish', label: 'ต้องทอยได้พอดีเส้นชัย (ปิด = เดินเกินได้ ตามต้นฉบับ)' },
  { k: 'extraRollOnSix', label: 'ทอยได้ 6 ทอยซ้ำอีกครั้ง' },
  { k: 'requireSchoolLogin', label: 'ต้องเข้าสู่ระบบด้วยเลขประจำตัว + PIN (เฉพาะ ม.5)' }
];

export function SettingsForm({ value, onChange }: { value: GameSettings; onChange: (v: GameSettings) => void }) {
  const set = (k: K, v: unknown) => onChange({ ...value, [k]: v } as GameSettings);
  return (
    <div className="grid gap-4">
      <div className="grid sm:grid-cols-2 gap-3">
        {SEL.map(s => (
          <label key={s.k} className="block"><span className="label">{s.label}</span>
            <select className="field" value={String(value[s.k])} onChange={e => set(s.k, e.target.value)}>
              {s.opts.map(([v, t]) => <option key={v} value={v} className="bg-navy">{t}</option>)}
            </select>
          </label>
        ))}
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {NUM.map(n => (
          <label key={n.k} className="block"><span className="label">{n.label}</span>
            <span className="flex items-center gap-2"><input type="number" className="field" min={n.min} max={n.max} value={Number(value[n.k])} onChange={e => set(n.k, Math.max(n.min, Math.min(n.max, Number(e.target.value) || 0)))} /><span className="text-soft text-sm shrink-0">{n.unit}</span></span>
          </label>
        ))}
      </div>
      <div className="grid sm:grid-cols-2 gap-2">
        {BOOL.map(b => (
          <label key={b.k} className="glass-soft px-3 py-2 flex items-center gap-3 cursor-pointer">
            <input type="checkbox" className="w-5 h-5 accent-[#00E5FF] shrink-0" checked={!!value[b.k]} onChange={e => set(b.k, e.target.checked)} />
            <span className="text-sm">{b.label}</span>
          </label>
        ))}
      </div>
      <button type="button" className="btn btn-ghost btn-sm justify-self-start" onClick={() => onChange({ ...DEFAULT_SETTINGS })}>คืนค่ากติกาต้นฉบับ</button>
    </div>
  );
}
