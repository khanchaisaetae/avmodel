import { SCENARIOS } from './scenario-catalog.mjs';

// Three picture sources, four devices, one display. Vertex's camera shares its
// HDMI output with the external HDMI source; it is not a second output branch.
export const CLASSROOM_SEQUENCE = [
  { source: 'dell', title: 'เปิดสไลด์', detail: 'แสดงสไลด์จาก Dell เพื่อเริ่มบทเรียน' },
  { source: 'vertex', title: 'สาธิตเอกสาร', detail: 'เปลี่ยนเป็นภาพเอกสารจากกล้อง Vertex' },
  { source: 'bluray', title: 'เปิดวิดีโอ', detail: 'แสดงวิดีโอจาก Sony Blu-ray' },
  { source: 'dell', title: 'กลับสู่สไลด์', detail: 'กลับไปสไลด์เดิมโดยไม่เปลี่ยนสาย' },
];
export const CLASSROOM_TASKS = SCENARIOS.filter(t => t.type === 'merge').map((t, i) => ({
  ...t,
  id: 'UC4-0' + (i + 1),
  title: (t.displayId === 'epson' ? 'Epson' : 'Sony TV') + ' · ' +
    (t.sources[0] === 'dell' ? 'Dell ผ่าน Vertex / Blu-ray ต่อตรง' : 'Blu-ray ผ่าน Vertex / Dell ต่อตรง'),
  goal: 'เชื่อม 3 แหล่งภาพให้พร้อม แล้วสลับสไลด์ → เอกสาร → วิดีโอ → สไลด์ บนจอเดียว โดยไม่ถอดหรือเปลี่ยนสายระหว่างลำดับ',
  sources: [...t.sources, 'vertex'],
  routes: [...t.routes, { source: 'vertex', segments: [1] }],
  sequence: CLASSROOM_SEQUENCE,
}));
