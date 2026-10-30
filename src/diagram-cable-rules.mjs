// UC3 cable-specific checks. Evidence and remaining gaps: ref/CABLE_RULE_EVIDENCE_2026-10-30.md.
export const DIAGRAM_CABLE_LABELS = {
 hdmi:'ตรวจเส้นทางภาพ',vga:'ตรวจเส้นทางภาพ', 'usb-c-hdmi':'รองรับแบบมีเงื่อนไข',
 'hdmi-vga':'ต้องมีวงจรแปลง · มีเงื่อนไข HDCP',composite:'ตรวจหัวต่อและสัญญาณ', 's-video':'ตรวจหัวต่อ · ยังไม่มีจอรองรับ',
 usb:'ตรวจสาย · ต้องมีซอฟต์แวร์',lan:'ข้อมูลเครือข่าย · ไม่ใช่สายภาพตรง',hdbaset:'ต้องมีตัวส่ง HDBaseT',
 displayport:'ยังไม่มีอุปกรณ์พอร์ต DP', 'usb-c-video':'ยังไม่มีจอรับภาพ USB-C','usb-c-dp':'ยังไม่มีจอรับภาพ DP',
 'rca-audio':'ตรวจสายเสียง · ไม่ส่งภาพ','audio-3.5':'ตรวจสายเสียง · ไม่ส่งภาพ','phone-6.35':'ตรวจหัวต่อ · ต้องทราบระดับเสียง',
 'coax-audio':'เสียงดิจิทัล · ไม่ส่งภาพ','optical-audio':'เสียงดิจิทัล · ไม่ส่งภาพ'
};
const r=(status,code,message,extra={})=>({status,code,message,imageVisible:false,gradable:status!=='indeterminate',...extra});
const bad=msg=>r('invalid','CABLE_ENDPOINT',msg);
const unknown=msg=>r('indeterminate','CABLE_CONDITIONS',msg);
export function checkDiagramCable(l,a,b){
 if(!a||!b)return null;
 const c=l.cableId;
 if(['hdmi','vga','usb-c-hdmi'].includes(c))return null;
 if(a.capability_status!=='verified_reference'||b.capability_status!=='verified_reference')return unknown('ข้อมูลพอร์ตยังไม่ผ่านการยืนยัน จึงยังไม่ตัดสินเส้นทางนี้');
 const connectors=(x,y)=>a.connector===x&&b.connector===y;
 const video=(signal)=>a.direction==='out'&&b.direction==='in'&&a.video_capable===true&&b.video_capable===true&&a.signal===signal&&b.signal===signal;
 if(c==='hdmi-vga'){
  if(!connectors('hdmi','vga')||a.direction!=='out'||b.direction==='out'||!a.video_capable)return bad('ต้องต่อ HDMI OUT ที่ส่งภาพได้ ไป VGA IN ผ่านวงจรแปลงแบบ Active ไม่สามารถใช้ย้อนทิศทาง');
  if(b.connection_kind==='configurable_video')return unknown('ต้องกำหนดพอร์ตปลายทางเป็น VGA IN ก่อน จึงจะตรวจเส้นทางได้');
  if(b.direction!=='in'||!b.video_capable)return bad('ปลายทางต้องเป็น VGA IN ที่รับภาพได้');
  return r('compatible','ACTIVE_HDMI_VGA','ต่อได้เมื่อใช้อะแดปเตอร์ Active HDMI → VGA พร้อมไฟเลี้ยงตามรุ่น และรูปแบบภาพที่รองรับ ไม่ส่งเสียงผ่าน VGA; สื่อที่ติด HDCP ใช้เส้นทางนี้ไม่ได้',{conditional:true,hdcpSensitive:true});
 }
 if(c==='composite'||c==='s-video'){
  const connector=c==='composite'?'rca':'mini_din4',signal=c==='composite'?'composite_video':'s_video';
  if(!connectors(connector,connector)||!video(signal))return bad('ต้องต่อช่องภาพ '+c+' OUT → IN ชนิดเดียวกัน; RCA สำหรับเสียงหรือ Coaxial ใช้แทนช่องภาพไม่ได้');
  return r('compatible','ANALOG_VIDEO','หัวต่อและทิศทางภาพตรงกัน ต้องใช้มาตรฐานภาพที่ต้นทางและปลายทางรองรับ',{conditional:true});
 }
 if(['displayport','usb-c-video','usb-c-dp'].includes(c)){
  const pair={displayport:['displayport','displayport'],'usb-c-video':['usb_c','usb_c'],'usb-c-dp':['usb_c','displayport']}[c];
  if(!connectors(...pair))return bad('หัวต่อไม่ตรงกับสาย '+c+'; อุปกรณ์ชุดนี้ยังไม่มีจอรับภาพ DisplayPort หรือ USB-C');
  return unknown('ต้องมีคู่มือยืนยัน DP/Alt Mode ของพอร์ตรับภาพ และรุ่นสายที่รองรับภาพ ก่อนเพิ่มอุปกรณ์ปลายทาง');
 }
 if(c==='usb'){
  if(!connectors('usb_a','usb_b'))return bad('สายนี้กำหนดหัว USB-A ฝั่งคอมพิวเตอร์ ไป USB-B ฝั่งอุปกรณ์ ไม่ใช่สาย HDMI');
  if(l.from==='dell'&&b.id==='epson:usb-b')return r('compatible','EPSON_USB_DISPLAY','ต่อสาย Dell USB-A → Epson USB-B ได้ แต่ต้องติดตั้งและเปิด Epson USB Display บนระบบปฏิบัติการที่รองรับ',{requiresSoftware:true,conditional:true});
  if(l.from==='dell'&&b.id==='vertex:usb-b')return unknown('USB ของ Vertex ใช้ส่งภาพกล้องเข้าคอมพิวเตอร์ผ่านซอฟต์แวร์ ไม่ใช่ส่งจอ Dell ออก Vertex; ยังไม่มีสถานะโปรแกรมรับภาพในแบบจำลอง');
  return unknown('หัว USB ต่อกันได้ยังไม่ยืนยันบทบาท Host/Device และซอฟต์แวร์ส่งภาพของอุปกรณ์คู่นี้');
 }
 if(c==='hdbaset'){
  if(!connectors('rj45','rj45'))return bad('HDBaseT ต้องใช้หัว RJ-45 ที่พอร์ต HDBaseT ทั้งสองฝั่ง');
  if(a.signal!=='hdbaset'||b.signal!=='hdbaset')return bad('พอร์ต LAN Ethernet ไม่ใช่ตัวส่ง HDBaseT ต้องเพิ่มอุปกรณ์ HDBaseT transmitter');
  return unknown('ต้องมีคู่มือรุ่นตัวส่ง ระยะทาง ประเภทสาย และรูปแบบภาพที่รองรับร่วมกัน');
 }
 if(c==='lan'){
  if(!connectors('rj45','rj45')||a.signal!=='ethernet'||b.signal!=='ethernet')return bad('สาย LAN สำหรับข้อมูลต้องต่อพอร์ต Ethernet ไม่ใช่ HDBaseT หรือช่องภาพชนิดอื่น');
  return unknown('เชื่อมข้อมูลเครือข่ายได้ แต่ภาพต้องอาศัยซอฟต์แวร์และการตั้งค่าเครือข่าย เช่น Epson iProjection; แบบจำลองยังไม่มีสถานะเหล่านี้');
 }
 const audio={'rca-audio':['rca','analog_audio'],'audio-3.5':['mini_jack_3_5','analog_audio'],'phone-6.35':['phone_jack_6_35','analog_audio'],'coax-audio':['rca','spdif_coaxial'],'optical-audio':['toslink','spdif_optical']}[c];
 if(audio){
  if(a.connector?.includes('unknown')||b.connector?.includes('unknown'))return unknown('คู่มือยังไม่ระบุขนาด/หน้าสัมผัสหัวต่อเสียงครบ จึงยังไม่ตัดสินว่าต่อผิด');
  if(!connectors(audio[0],audio[0])||a.signal!==audio[1]||b.signal!==audio[1]||a.direction!=='out'||b.direction!=='in')return bad('สายเสียงต้องต่อ Audio OUT → Audio IN ที่หัวต่อและชนิดสัญญาณตรงกัน; ไม่ใช่เส้นทางภาพ');
  if(c==='phone-6.35')return unknown('ต้องทราบ TS/TRS และระดับ Mic/Line ของทั้งสองฝั่ง ไม่ยืนยันจากขนาด 6.35 มม. เพียงอย่างเดียว');
  return r('no_image','AUDIO_ONLY','หัวต่อและทิศทางเสียงตรงกัน แต่สายนี้ไม่ส่งภาพ; ยังไม่จำลองระดับเสียง การจับคู่ช่องเสียง หรือเสียงที่ได้ยิน',{wiringCompatible:true});
 }
 return null;
}
