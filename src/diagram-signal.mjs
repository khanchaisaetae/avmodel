import {checkDiagramCable} from "./diagram-cable-rules.mjs";
// UC3-only logical signal tracing. Does not certify timings, EDID, HDCP or physical cable health.
import {validateSegment} from './scenario-engine.mjs';
import {DEVICE_NAMES} from './scenario-catalog.mjs';
const result=(status,code,message,extra={})=>({status,code,message,imageVisible:false,gradable:status!=='indeterminate',...extra});
export function validateDiagramSegment(task,state,index,catalog){
 const ports=new Map(catalog.devices.flatMap(d=>d.ports.map(p=>[p.id,p]))),l=state.links[index];
 const a=ports.get(l.sourcePortId),b=ports.get(l.sinkPortId);
 let r = checkDiagramCable(l,a,b);
 if(r) { /* cable-specific result */ }
 else if(l.cableId==='usb-c-hdmi'&&a&&b){
  if(a.id!=='dell:usb-c'||b.connector!=='hdmi'||b.direction!=='in')r=result('invalid','ADAPTER_DIRECTION','อะแดปเตอร์ USB-C to HDMI ต้องต่อ USB-C ของ Dell ไปยัง HDMI IN ของปลายทาง ตรวจทิศทางและหัวต่อทั้งสองปลาย');
  else if(a.capability_status!=='verified_reference'||b.capability_status!=='verified_reference'||!a.video_capable||!b.video_capable)r=result('indeterminate','ADAPTER_EVIDENCE','ข้อมูลความสามารถด้านภาพยังไม่ครบ จึงยังยืนยันเส้นทางนี้ไม่ได้');
  else r=result('compatible','USB_C_HDMI','ต่อได้ตามเงื่อนไข: ใช้อะแดปเตอร์ USB-C to HDMI ที่รองรับ DisplayPort over USB-C และสาย HDMI ไม่ใช่สาย USB สำหรับชาร์จหรือข้อมูล', {conditional:true});
 }else r=validateSegment(task,state,index,catalog);
 const name=(p,id)=>`${DEVICE_NAMES[id]||id} / ${p?.label||'ยังไม่เลือกพอร์ต'}`;
 return {...r,message:`${name(a,l.from)} → ${name(b,l.to)}: ${r.message}`};
}
export function traceDiagramDisplay(diagram,catalog,linkResults,displayId,requestedSource){
 const nodes=new Map(diagram.nodes.map(n=>[n.id,n])),ports=new Map(catalog.devices.flatMap(d=>d.ports.map(p=>[p.id,p]))),path=[],traversed=[];
 function incoming(id,port,seen){
  const matches=diagram.links.map((l,i)=>({l,i})).filter(({l})=>l.to===id&&l.sinkPortId===port);
  if(!matches.length)return result('no_image','WRONG_INPUT',`${DEVICE_NAMES[id]} เลือก ${ports.get(port)?.label||'ช่องรับภาพที่ยังไม่ระบุ'} แต่ไม่มีสายเข้าช่องนี้ ตรวจ Input ให้ตรงกับช่องที่เสียบสาย`);
  if(matches.length!==1)return result('invalid','PORT_OCCUPIED','ช่องรับภาพเดียวมีสายมากกว่าหนึ่งเส้น ให้แยกใช้พอร์ตที่รองรับ');
  const {l,i}=matches[0];traversed.push(i);path.unshift(`${DEVICE_NAMES[l.from]} / ${ports.get(l.sourcePortId)?.label} → ${DEVICE_NAMES[l.to]} / ${ports.get(l.sinkPortId)?.label}`);
  if(linkResults[i].status!=='compatible')return linkResults[i];
  if(linkResults[i].requiresSoftware)return result('indeterminate','SOFTWARE_STATE_UNKNOWN','สาย USB ต่อถูกต้อง แต่ยังไม่ทราบว่าติดตั้งและเปิด Epson USB Display แล้วหรือไม่ จึงยังยืนยันภาพไม่ได้');
  if(seen.has(l.from))return result('invalid','CYCLE','พบเส้นทางวนกลับ ตรวจลูกศรให้เดินจากแหล่งภาพไปยังจอ');
  const n=nodes.get(l.from);if(!n)return result('indeterminate','MISSING_DEVICE','ไม่พบอุปกรณ์ต้นทางในผัง');
  if(!n.power)return result('no_image','POWER_OFF',`เปิด ${DEVICE_NAMES[n.id]} ในเส้นทางนี้ก่อน`);
  if(n.id==='vertex'){
   const out=ports.get(l.sourcePortId);
   if(n.source==='CAMERA' && new Set(diagram.links.filter(w=>w.from==='vertex').map(w=>ports.get(w.sourcePortId)?.connector)).size>1)return result('indeterminate','SIMULTANEOUS_OUTPUT_UNKNOWN','ยังไม่มีหลักฐานยืนยันการส่งภาพกล้องออก HDMI และ RGB พร้อมกัน จึงยังไม่ยืนยันผลสองช่องทาง');
   if(['rca','mini_din4'].includes(out?.connector))return result('indeterminate','ANALOG_SOURCE_MODE','หัวต่อภาพแอนะล็อกถูกต้อง แต่ยังไม่มีหลักฐานกฎส่งผ่าน/โหมดกล้องสำหรับเอาท์พุตนี้ครบ จึงยังยืนยันภาพไม่ได้');
   if(n.source==='CAMERA')return result('ready','CAMERA_SIGNAL','ภาพจากกล้อง Vertex ตามเส้นทางที่ต่อ',{imageVisible:true,actualSource:'vertex'});
   const input={PC1:'vertex:rgb-in1',PC2:'vertex:rgb-in2','HDMI IN':'vertex:hdmi-in'}[n.source];
   if(!input)return result('indeterminate','SOURCE_UNKNOWN','ยังไม่รองรับโหมด Source นี้');
   if(ports.get(input)?.connector!==out?.connector)return result('no_image','VERTEX_SIGNAL_TYPE',`Vertex เลือก ${n.source} แต่ส่งออก ${out?.label}: ไม่ส่งผ่านข้าม HDMI กับ RGB/VGA ให้ใช้ Source และเอาท์พุตประเภทเดียวกัน`);
   return incoming(n.id,input,new Set([...seen,n.id]));
  }
  if(!['dell','bluray'].includes(n.id))return result('indeterminate','SOURCE_UNKNOWN','อุปกรณ์นี้ยังไม่มีกฎสำหรับเป็นแหล่งภาพ');
  if(!n.enabled)return result('no_image','SOURCE_DISABLED',n.id==='dell'?'Dell ยังไม่ส่งภาพออกจอภายนอก ให้เปิดการส่งภาพ':'Sony Blu-ray ยังไม่เล่น/ส่งภาพ ให้เริ่มเล่นสื่อ');
  return result('ready','SOURCE_SIGNAL',`ภาพจาก ${DEVICE_NAMES[n.id]}`,{imageVisible:true,actualSource:n.id});
 }
 const display=nodes.get(displayId);
 let r=!display?.power?result('no_image','DISPLAY_OFF',`เปิด ${DEVICE_NAMES[displayId]} ก่อนทดลองภาพ`):incoming(displayId,display.input,new Set([displayId]));
 if(r.imageVisible && r.actualSource==='bluray' && traversed.some(i=>linkResults[i]?.hdcpSensitive))r=result('indeterminate','HDCP_UNKNOWN','เส้นทาง HDMI → VGA อาจถูกปิดกั้นโดย HDCP ของสื่อ Blu-ray ต้องทราบชนิดสื่อและการรองรับอะแดปเตอร์ จึงยังยืนยันภาพไม่ได้');
 if(r.imageVisible&&requestedSource&&r.actualSource!==requestedSource)r={...r,status:'wrong_source',code:'WRONG_SOURCE',message:`มีภาพจาก ${DEVICE_NAMES[r.actualSource]} แต่เลือกทดลอง ${DEVICE_NAMES[requestedSource]} ตรวจ Source ของ Vertex และ Input ของจอ`};
 return {...r,displayId,path,message:r.message+(r.imageVisible?' · ผลตามการต่อและการตั้งค่าในแบบจำลอง ยังไม่รับรองความละเอียด อะแดปเตอร์จริง หรือ HDCP':'')};
}
