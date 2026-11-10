/* ป้ายชื่อการ์ดประเภทคลื่น (ไม่มีเฉลย ใช้ได้ทั้ง Frontend และ Backend) */
export const WAVE_TYPE_LABEL: Record<string, { th: string; en: string; image: string }> = {
  mechanical: { th: 'คลื่นกล', en: 'Mechanical Wave', image: '/assets/cards/types/mechanical.webp' },
  electromagnetic: { th: 'คลื่นแม่เหล็กไฟฟ้า', en: 'Electromagnetic Wave', image: '/assets/cards/types/electromagnetic.webp' },
  transverse: { th: 'คลื่นตามขวาง', en: 'Transverse Wave', image: '/assets/cards/types/transverse.webp' },
  longitudinal: { th: 'คลื่นตามยาว', en: 'Longitudinal Wave', image: '/assets/cards/types/longitudinal.webp' }
};
export const WAVE_TYPES = ['mechanical', 'electromagnetic', 'transverse', 'longitudinal'] as const;
export const QUESTION_CATEGORIES = ['ความหมายของคลื่น', 'คลื่นกล', 'คลื่นตามยาวและคลื่นตามขวาง', 'องค์ประกอบของคลื่น', 'ความถี่', 'คาบ', 'ความยาวคลื่น', 'อัตราเร็วคลื่น', 'การถ่ายทอดพลังงาน', 'สถานการณ์ประยุกต์'];
