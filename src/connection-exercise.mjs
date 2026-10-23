import {validateDirectVideoLink} from './connection-rules.mjs';
// These cables and output timing are supplied by the exercise, not added to hardware specs.
export const EXERCISE_MODE='1280x800@60';
export const CABLES=[
 {id:'hdmi',label:'สาย HDMI',description:'HDMI ↔ HDMI · ภาพและเสียงดิจิทัล',connectors:['hdmi','hdmi'],signals:['hdmi_video'],color:0x258d89},
 {id:'vga',label:'สาย VGA',description:'D-Sub 15 ↔ D-Sub 15 · ภาพแอนะล็อก',connectors:['vga','vga'],signals:['analog_rgb'],color:0x537ab2},
 {id:'usb',label:'สาย USB-A → USB-B',description:'ต้องใช้ฟังก์ชันและซอฟต์แวร์ที่รองรับ',connectors:['usb_a','usb_b'],signals:['usb_data'],color:0x8c7797}
];
export function initialExercise(){return {sourcePortId:'',sinkPortId:'',cableId:'',connected:false,sourcePowered:false,sinkPowered:false,sourceVideoEnabled:false,selectedInputPortId:'',attempts:0};}
const response=(status,code,message)=>({status,code,message,gradable:status!=='indeterminate',imageVisible:false});
export function evaluateExercise(state,catalog,{scope='display'}={}){
 const ports=new Map(catalog.devices.flatMap(d=>d.ports.map(p=>[p.id,p])));
 const source=ports.get(state.sourcePortId),sink=ports.get(state.sinkPortId),choice=CABLES.find(c=>c.id===state.cableId);
 if(!source||!sink||!choice)return response('indeterminate','INCOMPLETE_SELECTION','เลือกพอร์ตของ Dell พอร์ตของ Epson และสายให้ครบก่อน');
 if(!source.id.startsWith('dell:')||!sink.id.startsWith('epson:'))return response('invalid','WRONG_DEVICE','กิจกรรมนี้ให้เชื่อม Dell เป็นแหล่งภาพ และ Epson เป็นอุปกรณ์แสดงภาพ');
 if([source,sink].some(p=>p.video_capable===false))return response('invalid','NOT_VIDEO_PORT','ช่องที่เลือกเป็นช่องเสียง ควบคุม หรือไฟเลี้ยง จึงใช้เป็นทางรับ–ส่งภาพไม่ได้');
 // Explicit lesson assumption: Dell HDMI is set to the supplied timing. Never mutate catalog.
 const lessonSource=source.id==='dell:hdmi'?{...source,supported_modes:[EXERCISE_MODE],supported_modes_complete:false}:source;
 const cable={...choice,kind:'direct',verification_status:'verified',supported_modes:[EXERCISE_MODE],supported_modes_complete:false};
 const linkState={occupiedPortIds:[],sourcePowered:state.sourcePowered,sinkPowered:state.sinkPowered,sourceVideoEnabled:state.sourceVideoEnabled,selectedInputPortId:state.selectedInputPortId,mode:EXERCISE_MODE,linkHealthy:true};
 const topology=validateDirectVideoLink({source:lessonSource,sink,cable,state:linkState,scope:'topology'});
 if(topology.status!=='compatible'){
  if(topology.code==='SPECIAL_ROUTE_REQUIRED')return {...topology,message:source.id==='dell:usb-c'?'USB-C ของ Dell ส่งภาพได้ แต่ต้องใช้สายหรืออะแดปเตอร์ DisplayPort over USB-C ที่รองรับ กิจกรรมนี้ฝึกสายภาพตรง จึงยังไม่ตัดสินเส้นทางนี้':'พอร์ตนี้ต้องใช้เส้นทางหรือซอฟต์แวร์เฉพาะตามคู่มือ กิจกรรมสายภาพตรงนี้ยังไม่จำลองเส้นทางดังกล่าว'};
  return topology;
 }
 if(scope==='topology')return topology;
 if(!state.connected)return response('no_image','NOT_CONNECTED','เลือกอุปกรณ์ครบแล้ว กด “เชื่อมสาย” เพื่อเสียบปลายทั้งสอง');
 return validateDirectVideoLink({source:lessonSource,sink,cable,state:linkState,scope:'display'});
}
export function changeWiring(state,patch){return {...state,...patch,connected:false};}
