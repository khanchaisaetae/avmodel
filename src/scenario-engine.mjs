import {validateDirectVideoLink} from './connection-rules.mjs';
import {CABLES} from './connection-exercise.mjs';
import {DEVICE_NAMES,SOURCE_NAMES} from './scenario-catalog.mjs';
const result=(status,code,message,extra={})=>({status,code,message,imageVisible:false,gradable:status!=='indeterminate',complete:false,...extra});
export function initialScenario(task){return {links:task.segments.map(()=>({sourcePortId:'',sinkPortId:'',cableId:'',connected:false})),power:Object.fromEntries(task.devices.map(id=>[id,false])),sourceEnabled:Object.fromEntries(task.sources.filter(id=>id!=='vertex').map(id=>[id,false])),displayInput:'',vertexSource:'CAMERA',requestedSource:task.sources[0],observedSources:[],attempts:0};}
export function editSegment(state,index,patch){return {...state,links:state.links.map((l,i)=>i===index?{...l,...patch,connected:false}:l),observedSources:[]};}
const portMap=catalog=>new Map(catalog.devices.flatMap(d=>d.ports.map(p=>[p.id,p])));
export function validateSegment(task,state,index,catalog){
 const plan=task.segments[index],link=state.links[index];if(!plan||!link)return result('invalid','UNKNOWN_SEGMENT','ไม่พบช่วงสายนี้');
 const ports=portMap(catalog),source=ports.get(link.sourcePortId),sink=ports.get(link.sinkPortId),choice=CABLES.find(c=>c.id===link.cableId);
 if(!source||!sink||!choice)return result('indeterminate','MISSING_SELECTION','เลือกพอร์ตทั้งสองปลายและชนิดสายให้ครบ');
 if(source.id.split(':')[0]!==plan.from||sink.id.split(':')[0]!==plan.to)return result('invalid','WRONG_DEVICE','พอร์ตไม่ตรงกับอุปกรณ์ในช่วงสายที่เลือก');
 if(source.video_capable===false||sink.video_capable===false)return result('invalid','NO_VIDEO','พอร์ตที่เลือกไม่ส่งหรือรับภาพ เช่น HDMI OUT 2 ของ Blu-ray ส่งเฉพาะเสียง');
 const occupied=state.links.flatMap((l,i)=>i!==index&&l.connected?[l.sourcePortId,l.sinkPortId]:[]);
 // Supplied timing is an exercise assumption, never a hardware-specification update.
 const supplied=p=>p.supported_modes===null&&p.connector==='hdmi'&&p.connection_kind==='native_video'?{...p,supported_modes:[task.mode],supported_modes_complete:false}:p;
 const r=validateDirectVideoLink({source:supplied(source),sink:supplied(sink),cable:{...choice,kind:'direct',verification_status:'verified',supported_modes:[task.mode],supported_modes_complete:false},state:{occupiedPortIds:occupied},scope:'topology'});
 if(r.code==='SPECIAL_ROUTE_REQUIRED')return {...r,message:source.id==='dell:usb-c'?'USB-C ของ Dell ส่งภาพได้ผ่านสายหรืออะแดปเตอร์ที่รองรับ แต่โจทย์นี้ฝึกเส้นทาง HDMI ตรง จึงยังไม่ตัดสินเส้นทางนี้':'พอร์ตนี้ต้องใช้ซอฟต์แวร์ โหมด หรือเส้นทางเฉพาะ จึงยังไม่ตัดสินเป็นคำตอบผิดจากข้อมูลที่ไม่ครบ'};
 return r;
}
export function connectSegment(task,state,index,catalog){const r=validateSegment(task,state,index,catalog);return {state:{...state,links:state.links.map((l,i)=>i===index?{...l,connected:r.status==='compatible'}:l),observedSources:[]},result:r};}
export function disconnectSegment(state,index){return editSegment(state,index,{});}
export function evaluateScenario(task,state,catalog){
 const ports=portMap(catalog),display=task.displayId;
 if(!state.power[display])return result('no_image','DISPLAY_OFF','เปิด '+DEVICE_NAMES[display]+' ก่อนตรวจภาพ');
 if(!state.displayInput)return result('no_image','INPUT_NOT_SELECTED','เลือก Input ของจอให้ตรงกับช่องที่ต่อ');
 const index=task.segments.findIndex((s,i)=>s.to===display&&state.links[i].connected&&state.links[i].sinkPortId===state.displayInput);
 if(index<0)return result('no_image','WRONG_INPUT','Input ของจอยังไม่ตรงกับสายที่เชื่อม หรือยังไม่ได้เสียบสายเข้าช่องนั้น');
 const seen=new Set();
 function trace(i){
  if(seen.has(i))return result('invalid','CYCLE','พบวงจรสัญญาณที่ไม่ถูกต้อง');seen.add(i);
  const l=state.links[i],seg=task.segments[i];if(!l.connected)return result('no_image','NOT_CONNECTED','ยังไม่ได้เชื่อมสายครบตามเส้นทาง');
  const valid=validateSegment(task,state,i,catalog);if(valid.status!=='compatible')return valid;
  for(const id of [seg.from,seg.to])if(!state.power[id])return result('no_image','POWER_OFF','เปิด '+DEVICE_NAMES[id]+' ในเส้นทางที่กำลังใช้งาน');
  for(const id of [l.sourcePortId,l.sinkPortId]){const p=ports.get(id);if(Array.isArray(p.supported_modes)&&!p.supported_modes.includes(task.mode))return result('indeterminate','MODE_NOT_DOCUMENTED','รูปแบบภาพนี้ยังไม่อยู่ในรายการที่ยืนยัน จึงไม่ตัดสินคะแนน');}
  if(seg.from==='vertex'){
   if(l.sourcePortId!=='vertex:hdmi-out')return result('indeterminate','VERTEX_ROUTE_UNKNOWN','กิจกรรมนี้กำหนดเส้นทางออก HDMI ของ Vertex เท่านั้น');
   if(state.vertexSource==='CAMERA')return result('signal','CAMERA_SIGNAL','ภาพจากกล้อง Vertex',{imageVisible:true,actualSource:'vertex'});
   if(state.vertexSource!=='HDMI IN')return result('no_image','VERTEX_SIGNAL_TYPE','Vertex เลือกอินพุต RGB/VGA จึงไม่ส่งภาพข้ามประเภทออก HDMI ให้เลือก SOURCE: HDMI IN สำหรับสาย HDMI');
   const inputIndex=task.segments.findIndex((p,j)=>p.to==='vertex'&&state.links[j].connected&&state.links[j].sinkPortId==='vertex:hdmi-in');
   if(inputIndex<0)return result('no_image','VERTEX_INPUT_MISSING','Vertex เลือก HDMI IN แต่ยังไม่มีสายเชื่อมเข้าช่อง HDMI IN');
   return trace(inputIndex);
  }
  if(!state.sourceEnabled[seg.from])return result('no_image','SOURCE_DISABLED',seg.from==='dell'?'Dell ยังไม่ได้ส่งภาพออกจอภายนอก':'Blu-ray ยังไม่ได้เริ่มเล่นสื่อหรือส่งภาพ');
  return result('signal','SOURCE_SIGNAL','มีสัญญาณภาพ',{imageVisible:true,actualSource:seg.from});
 }
 const signal=trace(index);if(!signal.imageVisible)return signal;
 if(signal.actualSource!==state.requestedSource)return result('wrong_source','WRONG_SOURCE','มีภาพขึ้น แต่เป็นภาพจาก '+SOURCE_NAMES[signal.actualSource]+' ขณะนี้โจทย์ต้องการ '+SOURCE_NAMES[state.requestedSource],{imageVisible:true,actualSource:signal.actualSource});
 const checks=task.segments.map((_,i)=>state.links[i].connected?validateSegment(task,state,i,catalog):result('no_image','MISSING_BRANCH','ยังเชื่อมสายไม่ครบทุกช่วงสำหรับการสลับภาพโดยไม่ถอดสาย'));
 const bad=checks.find(r=>r.status!=='compatible');
 if(bad)return result(bad.status,'INCOMPLETE_SYSTEM','ภาพจากแหล่งที่ต้องการขึ้นแล้ว แต่ระบบยังไม่ครบ: '+bad.message,{imageVisible:true,actualSource:signal.actualSource,signalCorrect:true});
 return result('ready','TARGET_VISIBLE','แสดงภาพจาก '+SOURCE_NAMES[signal.actualSource]+' ถูกต้องตามเป้าหมาย',{imageVisible:true,actualSource:signal.actualSource,signalCorrect:true});
}
export function checkScenario(task,state,catalog){
 const r=evaluateScenario(task,state,catalog),observed=r.status==='ready'?[...new Set([...state.observedSources,state.requestedSource])]:state.observedSources;
 const complete=r.status==='ready'&&task.sources.every(s=>observed.includes(s));
 return {state:{...state,observedSources:observed,attempts:state.attempts+1},result:{...r,complete}};
}
export function nextSource(task,state){const source=task.sources.find(id=>!state.observedSources.includes(id));return source?{...state,requestedSource:source}:state;}
