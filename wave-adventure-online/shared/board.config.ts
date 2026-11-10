/* =========================================================
   board.config.ts — ค่ากระดานเกม "การผจญภัยในโลกคลื่น"
   แก้ไขได้โดยไม่ต้องแก้ Game Engine
   ---------------------------------------------------------
   ที่มา: วิเคราะห์จากภาพกระดานต้นฉบับ (assets/board/board.webp, 1500×1000 px)
   - ภาพกระดานจริงมีช่องหกเหลี่ยม 36 ช่อง + START + FINISH
   - ประเภทช่องอ่านจากไอคอนบนภาพ: คลื่น 🌊 16 ช่อง, ฟ้าผ่า ⚡ 12 ช่อง, ช่องปกติ 8 ช่อง
   - พิกัดเป็น normalized (0–1) ของภาพ จึงรองรับทุกขนาดหน้าจอ
   - ครูแก้ตำแหน่ง/ประเภทช่องได้ที่หน้า "Board Coordinate Editor"
   หมายเหตุ: Prompt ระบุ 50 ช่อง แต่ภาพกระดานจริงมี 36 ช่อง จึงใช้ตามภาพจริงเป็นค่าเริ่มต้น
   (ดู ASSET_ANALYSIS.md) หากมีภาพกระดาน 50 ช่อง ให้กำหนดใน Board Editor ได้ทันที
   ========================================================= */
import type { BoardConfig, BoardCell, CellType } from './types';

export const DEFAULT_BOARD: BoardConfig = {
  id: 'original-36',
  name: 'กระดานต้นฉบับ (36 ช่อง)',
  image: '/assets/board/board.webp',
  aspect: 1.5,
  cells: [
    { index: 0, x: 0.0973, y: 0.3150, type: 'START', color: null },
    { index: 1, x: 0.1753, y: 0.3690, type: 'NORMAL', color: 'blue' },
    { index: 2, x: 0.2393, y: 0.3010, type: 'NORMAL', color: 'purple' },
    { index: 3, x: 0.3013, y: 0.2390, type: 'WAVE', color: 'purple' },
    { index: 4, x: 0.3680, y: 0.2010, type: 'WAVE', color: 'blue' },
    { index: 5, x: 0.4453, y: 0.1660, type: 'LIGHTNING', color: 'purple' },
    { index: 6, x: 0.5227, y: 0.1650, type: 'WAVE', color: 'blue' },
    { index: 7, x: 0.6000, y: 0.1660, type: 'WAVE', color: 'purple' },
    { index: 8, x: 0.6773, y: 0.1890, type: 'WAVE', color: 'blue' },
    { index: 9, x: 0.7547, y: 0.2120, type: 'WAVE', color: 'purple' },
    { index: 10, x: 0.8327, y: 0.2360, type: 'LIGHTNING', color: 'blue' },
    { index: 11, x: 0.9093, y: 0.2590, type: 'NORMAL', color: 'purple' },
    { index: 12, x: 0.9360, y: 0.3850, type: 'LIGHTNING', color: 'blue' },
    { index: 13, x: 0.8587, y: 0.4200, type: 'LIGHTNING', color: 'purple' },
    { index: 14, x: 0.7680, y: 0.3850, type: 'WAVE', color: 'blue' },
    { index: 15, x: 0.6773, y: 0.3850, type: 'LIGHTNING', color: 'blue' },
    { index: 16, x: 0.6000, y: 0.4010, type: 'WAVE', color: 'purple' },
    { index: 17, x: 0.5227, y: 0.3690, type: 'WAVE', color: 'blue' },
    { index: 18, x: 0.4453, y: 0.3390, type: 'NORMAL', color: 'purple' },
    { index: 19, x: 0.3787, y: 0.3850, type: 'WAVE', color: 'blue' },
    { index: 20, x: 0.3120, y: 0.4320, type: 'LIGHTNING', color: 'blue' },
    { index: 21, x: 0.2393, y: 0.5000, type: 'WAVE', color: 'purple' },
    { index: 22, x: 0.1667, y: 0.5670, type: 'NORMAL', color: 'blue' },
    { index: 23, x: 0.2140, y: 0.6540, type: 'WAVE', color: 'purple' },
    { index: 24, x: 0.2920, y: 0.6980, type: 'LIGHTNING', color: 'blue' },
    { index: 25, x: 0.3687, y: 0.7430, type: 'WAVE', color: 'purple' },
    { index: 26, x: 0.4460, y: 0.6760, type: 'LIGHTNING', color: 'blue' },
    { index: 27, x: 0.5233, y: 0.6270, type: 'LIGHTNING', color: 'blue' },
    { index: 28, x: 0.5920, y: 0.5540, type: 'WAVE', color: 'purple' },
    { index: 29, x: 0.6773, y: 0.5540, type: 'NORMAL', color: 'blue' },
    { index: 30, x: 0.7627, y: 0.5590, type: 'LIGHTNING', color: 'purple' },
    { index: 31, x: 0.7240, y: 0.6660, type: 'WAVE', color: 'blue' },
    { index: 32, x: 0.6387, y: 0.6930, type: 'NORMAL', color: 'purple' },
    { index: 33, x: 0.5827, y: 0.7760, type: 'LIGHTNING', color: 'blue' },
    { index: 34, x: 0.6853, y: 0.7980, type: 'WAVE', color: 'purple' },
    { index: 35, x: 0.7680, y: 0.7920, type: 'NORMAL', color: 'blue' },
    { index: 36, x: 0.8500, y: 0.7770, type: 'LIGHTNING', color: 'purple' },
    { index: 37, x: 0.9433, y: 0.7400, type: 'FINISH', color: null },
  ]
};

/** ตรวจว่ากระดานพร้อมใช้งาน: มี START/FINISH และทุกช่องมีพิกัด */
export function validateBoard(b: BoardConfig): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!b || !Array.isArray(b.cells)) return { ok: false, errors: ['ไม่มีข้อมูลช่อง'] };
  const n = b.cells.length;
  if (n < 5) errors.push('ต้องมีอย่างน้อย 5 ช่อง (รวม START และ FINISH)');
  if (n > 120) errors.push('จำนวนช่องมากเกินไป (สูงสุด 120)');
  b.cells.forEach((c, i) => {
    if (c.index !== i) errors.push(`ลำดับช่องที่ ${i} ไม่ถูกต้อง`);
    if (c.x == null || c.y == null || !(c.x >= 0 && c.x <= 1 && c.y >= 0 && c.y <= 1)) errors.push(`ช่อง ${i} ยังไม่ได้กำหนดพิกัด`);
  });
  if (n && b.cells[0].type !== 'START') errors.push('ช่องแรกต้องเป็น START');
  if (n && b.cells[n - 1].type !== 'FINISH') errors.push('ช่องสุดท้ายต้องเป็น FINISH');
  b.cells.slice(1, -1).forEach(c => { if (c.type === 'START' || c.type === 'FINISH') errors.push(`ช่อง ${c.index} ใช้ประเภท ${c.type} ไม่ได้`); });
  return { ok: errors.length === 0, errors };
}

export const finishIndex = (b: BoardConfig) => b.cells.length - 1;
export const cellType = (b: BoardConfig, i: number): CellType => (b.cells[i] ? b.cells[i].type : 'NORMAL');

/** สร้างกระดานเปล่า N ช่อง (สำหรับ Board Editor) */
export function emptyBoard(playable: number, image = DEFAULT_BOARD.image, aspect = DEFAULT_BOARD.aspect): BoardConfig {
  const cells: BoardCell[] = [];
  for (let i = 0; i <= playable + 1; i++) {
    cells.push({ index: i, x: null, y: null, type: i === 0 ? 'START' : i === playable + 1 ? 'FINISH' : 'NORMAL', color: null });
  }
  return { id: 'custom-' + playable, name: `กระดานกำหนดเอง (${playable} ช่อง)`, image, aspect, cells };
}
