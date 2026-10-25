const test=(id,source,displayId,title)=>({id,source,displayId,title});
export const PROJECT_MISSIONS=[
 {id:'room-01',title:'ห้องเรียนสไลด์ เอกสาร และวิดีโอ',devices:['dell','vertex','bluray','epson'],
  brief:'ออกแบบระบบให้สลับสไลด์จาก Dell ภาพเอกสารจากกล้อง Vertex และวิดีโอจาก Blu-ray บน Epson โดยคงสายชุดเดิม',
  tests:[test('slides','dell','epson','สไลด์ → Epson'),test('document','vertex','epson','เอกสาร → Epson'),test('video','bluray','epson','วิดีโอ → Epson')],startup:['slides']},
 {id:'room-02',title:'ห้องเรียนและมุมวิดีโอ · ครบ 5 อุปกรณ์',devices:['dell','vertex','bluray','epson','tv'],
  brief:'พื้นที่สอนแสดงสไลด์ Dell หรือเอกสารจากกล้อง Vertex บน Epson ส่วนมุมวิดีโอแสดง Blu-ray บน Sony TV เตรียมเริ่มสอนด้วย Dell บน Epson และวิดีโอบน TV พร้อมกัน',
  tests:[test('slides','dell','epson','สไลด์ → Epson'),test('document','vertex','epson','เอกสาร → Epson'),test('video','bluray','tv','วิดีโอ → Sony TV')],startup:['slides','video']},
 {id:'room-03',title:'ห้องสาธิตและฉายวิดีโอ · ครบ 5 อุปกรณ์',devices:['dell','vertex','bluray','epson','tv'],
  brief:'จอสาธิต Sony TV ใช้แสดงสไลด์ Dell หรือเอกสารจากกล้อง Vertex ส่วน Epson ใช้ฉายวิดีโอจาก Blu-ray เตรียมเริ่มสอนด้วย Dell บน TV และวิดีโอบน Epson พร้อมกัน',
  tests:[test('slides','dell','tv','สไลด์ → Sony TV'),test('document','vertex','tv','เอกสาร → Sony TV'),test('video','bluray','epson','วิดีโอ → Epson')],startup:['slides','video']},
];
export const PROJECT_FIELDS=[
 ['needs','วิเคราะห์ความต้องการ','ผู้ใช้ต้องการแสดงสื่ออะไร ที่จอใด และใช้งานในลำดับใด…'],
 ['operation','คู่มือเลือกแหล่งภาพ','ระบุว่าจะเลือก SOURCE / Input อย่างไรเพื่อสลับสื่อแต่ละชนิด…'],
 ['care','แนวทางดูแลและจัดเก็บ','ระบุสิ่งที่จะตรวจสภาพ วิธีดูแล/จัดเก็บ และกรณีที่ควรส่งผู้รับผิดชอบตรวจ…'],
 ['recovery','แนวทางแก้ปัญหา','หากภาพไม่ขึ้นหรือผิดแหล่ง จะตรวจอะไร และยืนยันผลหลังแก้อย่างไร…'],
];
export const PROJECT_CHECKS=[
 ['labels','ตรวจคู่พอร์ตและป้ายสายในผังแล้ว'],['startup','ตรวจการตั้งค่าเริ่มใช้งานแล้ว'],
 ['care','จัดทำแนวทางดูแลและจัดเก็บแล้ว'],['documents','ตรวจเอกสารฉบับส่งมอบแล้ว'],
];
export const getProjectMission=id=>PROJECT_MISSIONS.find(m=>m.id===id);
