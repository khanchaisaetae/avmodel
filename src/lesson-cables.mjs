import {CABLES} from './connection-exercise.mjs';
// Availability here is a teaching choice, never a new verified device capability.
export const WIRE_CHOICES=[
 ...CABLES.map(c=>({...c,engineSupported:true,group:c.id==='hdmi'?'ภาพดิจิทัล':c.id==='vga'?'ภาพแอนะล็อก':'ข้อมูล / ฟังก์ชันเฉพาะ',availability:c.id==='hdmi'?'จำลองเส้นทาง HDMI ได้':c.id==='vga'?'ตรวจหัวต่อได้ · ภาพ VGA ยังไม่จำลอง':'ต้องใช้ฟังก์ชันและซอฟต์แวร์ที่รองรับ'})),
 {id:'displayport',label:'DisplayPort ↔ DisplayPort',group:'ภาพดิจิทัล',description:'สายภาพดิจิทัล ต้องมีพอร์ต DisplayPort ที่อุปกรณ์ทั้งสองปลาย',availability:'ยังไม่จำลอง'},
 {id:'usb-c-video',label:'USB-C ↔ USB-C สำหรับภาพ',group:'ภาพดิจิทัล',description:'ต้องรองรับ DisplayPort over USB-C และใช้สายที่รองรับภาพ ไม่ใช่สายชาร์จทุกเส้น',availability:'ต้องมีเงื่อนไขเพิ่มเติม · ยังไม่จำลอง'},
 {id:'composite',label:'Composite Video · RCA',group:'ภาพแอนะล็อก',description:'สายสัญญาณภาพแอนะล็อก ไม่รวมสายเสียง L/R',availability:'ยังไม่จำลอง'},
 {id:'s-video',label:'S-Video',group:'ภาพแอนะล็อก',description:'สายภาพแอนะล็อก S-Video ตามหัวต่อที่รองรับ',availability:'ยังไม่จำลอง'},
 {id:'lan',label:'สาย LAN · ข้อมูลเครือข่าย',group:'ข้อมูล / ฟังก์ชันเฉพาะ',description:'ใช้รับส่งข้อมูลเครือข่าย ไม่ทำให้พอร์ต LAN กลายเป็น HDMI',availability:'ต้องมีฟังก์ชันเฉพาะ · ยังไม่จำลอง'},
 {id:'hdbaset',label:'สายสำหรับ HDBaseT',group:'ข้อมูล / ฟังก์ชันเฉพาะ',description:'ต้องใช้พอร์ตและตัวส่ง HDBaseT ที่รองรับ ไม่ใช่ต่อจากพอร์ต LAN ทั่วไป',availability:'ต้องมีตัวส่งที่รองรับ · ยังไม่จำลอง'},
 {id:'rca-audio',label:'RCA Audio · L/R',group:'เสียง',description:'ส่งสัญญาณเสียงแอนะล็อกสองช่อง ไม่ส่งภาพ',availability:'สายเสียง · ไม่ใช่เส้นทางภาพ'},
 {id:'audio-3.5',label:'สายเสียง 3.5 มม.',group:'เสียง',description:'ใช้กับช่องเสียงที่รองรับ ต้องตรวจชนิดและหน้าที่ของช่องต่อ',availability:'สายเสียง · ไม่ใช่เส้นทางภาพ'},
 {id:'phone-6.35',label:'Phone · 6.35 มม. (1/4 นิ้ว)',group:'เสียง',description:'ใช้กับช่องเสียงที่รองรับ เช่น MIC ของ Vertex ไม่สมมติหน้าสัมผัส TS/TRS',availability:'สายเสียง · ไม่ใช่เส้นทางภาพ'},
 {id:'coax-audio',label:'Coaxial Digital Audio',group:'เสียง',description:'ส่งเสียงดิจิทัลผ่านช่อง Coaxial ไม่ใช่ Composite Video',availability:'สายเสียง · ไม่ใช่เส้นทางภาพ'},
 {id:'optical-audio',label:'Optical Digital Audio',group:'เสียง',description:'ส่งเสียงดิจิทัลผ่านใยแก้วนำแสง ไม่ส่งภาพ',availability:'สายเสียง · ไม่ใช่เส้นทางภาพ'},
 {id:'usb-c-hdmi',label:'USB-C → HDMI',group:'สายแปลง / อะแดปเตอร์',description:'ต้นทางต้องรองรับภาพผ่าน USB-C และใช้อะแดปเตอร์ที่รองรับทิศทางนี้',availability:'ต้องมีเงื่อนไขเพิ่มเติม · ยังไม่จำลอง'},
 {id:'usb-c-dp',label:'USB-C → DisplayPort',group:'สายแปลง / อะแดปเตอร์',description:'ส่งภาพจาก USB-C ที่รองรับไปยัง DisplayPort ของจอ ต้องตรวจทิศทาง',availability:'ต้องมีเงื่อนไขเพิ่มเติม · ยังไม่จำลอง'},
 {id:'hdmi-vga',label:'HDMI → VGA · แบบมีวงจรแปลง',group:'สายแปลง / อะแดปเตอร์',description:'แปลงภาพดิจิทัลเป็นแอนะล็อก ต้องมีวงจรแปลง ไม่ใช่เพียงเปลี่ยนหัวสาย',availability:'ต้องมีวงจรแปลง · ยังไม่จำลอง'}
].map(c=>({engineSupported:false,color:0x8b9fa8,...c}));
export function portDirection(p){const d=p.video_direction||p.direction;return d==='out'?'OUT · ส่งออก':d==='in'?'IN · รับเข้า':p.connection_kind==='configurable_video'?'MODE · ตามโหมดเครื่อง':'I/O · ตามหน้าที่พอร์ต';}
export function portFunction(p){
 if(p.signal==='hdmi_audio'&&p.video_capable===false)return 'เสียงเท่านั้น';
 if(p.video_capable===true)return p.connection_kind==='software_video'?'ภาพผ่านซอฟต์แวร์':p.connection_kind==='configurable_video'?'ภาพ · ตามโหมดเครื่อง':'สัญญาณภาพ';
 return ({audio:'สัญญาณเสียง',network:'ข้อมูลเครือข่าย',control:'ควบคุม',power:'ไฟเลี้ยง',usb_data:'ข้อมูล USB',usb_media:'สื่อ / ข้อมูล USB'}[p.connection_kind]||'ตามหน้าที่ในคู่มือ');
}
// Bidirectional and mode-dependent sockets stay visible in both relevant groups.
export function portSupportsSide(port,side){
 if(side!=='in'&&side!=='out')return false;
 const direction=port.video_direction||port.direction;
 return direction===side||(direction!=='in'&&direction!=='out');
}
