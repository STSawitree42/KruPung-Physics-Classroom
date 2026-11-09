/* =========================================================
   SOUND QUEST — configuration
   เปลี่ยนค่าที่นี่เพื่อเชื่อมต่อฐานข้อมูลภายหลัง
   ========================================================= */
window.SQ = window.SQ || {};
SQ.config = {
  version: '1.0.0',
  /* 'local'  = บันทึกใน localStorage ของอุปกรณ์นี้ (ค่าเริ่มต้นของต้นแบบ)
     'remote' = บันทึกใน localStorage และส่งสำเนาไปยัง API ด้านล่างด้วย
                (เช่น Google Apps Script Web App, Supabase Edge Function, Netlify Function) */
  storage: 'local',
  apiBaseUrl: '',            // เช่น 'https://script.google.com/macros/s/XXXX/exec'
  passRatio: 0.6,            // ต้องทำถูก ≥ 60% ของภารกิจในด่าน จึงผ่านด่านและปลดล็อกด่านถัดไป
  missionAttempts: 3,        // จำนวนครั้งที่ส่งคำตอบภารกิจทดลองได้
  xp: { mcq: 100, num: 200, mission: 150, withHint: 60, levelBonus: 100 }
};
