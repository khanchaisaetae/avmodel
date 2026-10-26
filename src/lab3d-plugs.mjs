// Connector fit is physical only; video direction and signal rules remain in the engine.
const EXTRA={displayport:['displayport','displayport'],'usb-c-video':['usb_c','usb_c'],composite:['rca','rca'],'s-video':['mini_din4','mini_din4'],lan:['rj45','rj45'],hdbaset:['rj45','rj45'],'rca-audio':['rca','rca'],'audio-3.5':['mini_jack_3_5','mini_jack_3_5'],'phone-6.35':['phone_jack_6_35','phone_jack_6_35'],'coax-audio':['rca','rca'],'optical-audio':['toslink','toslink'],'usb-c-hdmi':['usb_c','hdmi'],'usb-c-dp':['usb_c','displayport'],'hdmi-vga':['hdmi','vga']};
const LABEL={hdmi:'HDMI',vga:'VGA',usb_a:'USB-A',usb_b:'USB-B',usb_c:'USB-C',displayport:'DisplayPort',rca:'RCA',mini_din4:'S-Video',rj45:'RJ45',mini_jack_3_5:'3.5 มม.',phone_jack_6_35:'6.35 มม.',toslink:'Optical'};
export function plugTypes(cable){return cable?.connectors||EXTRA[cable?.id]||[];}
export function plugLabel(type){return LABEL[type]||type||'ยังไม่เลือกสาย';}
export function checkPlugDrop({task,state,index,side,port,cable}){
 if(!['out','in'].includes(side)||!task.segments[index]||!cable)return {ok:false,message:'เลือกชนิดสายก่อนลากหัวสาย'};
 if(!port)return {ok:false,message:'ยังไม่ตรงพอร์ต · หมุนหรือซูมให้เห็นช่องต่อแล้วลองใหม่'};
 if(port.connector!==plugTypes(cable)[side==='out'?0:1])return {ok:false,message:'หัว '+plugLabel(plugTypes(cable)[side==='out'?0:1])+' ไม่ตรงกับช่อง '+plugLabel(port.connector)};
 const plan=task.segments[index];if(port.id.split(':')[0]!==plan[side==='out'?'from':'to'])return {ok:false,message:'หัวด้านนี้ต้องเสียบที่อุปกรณ์'+(side==='out'?'ต้นทาง':'ปลายทาง')+'ของสายเส้นนี้'};
 const occupied=state.links.some((l,i)=>i!==index&&[l.sourcePortId,l.sinkPortId].includes(port.id));
 if(occupied)return {ok:false,message:'พอร์ตนี้มีหัวสายอื่นเสียบอยู่แล้ว · ถอดหัวสายเดิมก่อน'};
 return {ok:true,message:'ปล่อยเพื่อเสียบ '+port.label};
}
// Infer the task branch from the actual device touched; never overwrite another cable.
export function resolvePlugDrop({task,state,index,side,port,cable}){
 if(!port||!cable||!['out','in'].includes(side)||!state.links[index])return checkPlugDrop({task,state,index,side,port,cable});
 const key=side==='out'?'sourcePortId':'sinkPortId',other=side==='out'?'sinkPortId':'sourcePortId',deviceKey=side==='out'?'from':'to',otherKey=side==='out'?'to':'from',current=state.links[index];
 const matches=(plan)=>plan[deviceKey]===port.id.split(':')[0]&&(!current[other]||plan[otherKey]===current[other].split(':')[0]);
 let target=matches(task.segments[index])?index:task.segments.findIndex((plan,i)=>matches(plan)&&!state.links[i].sourcePortId&&!state.links[i].sinkPortId);
 // A fully inserted cable is edited in place. Partial cables can move to the inferred branch.
 if(current.sourcePortId&&current.sinkPortId)target=index;
 if(target<0)return {ok:false,message:'อุปกรณ์สองด้านไม่ตรงเส้นทางของโจทย์ หรือมีสายเชื่อมอยู่แล้ว'};
 let draft=state;
 if(target!==index)draft={...state,links:state.links.map((l,i)=>i===target?{...current}:i===index?{sourcePortId:'',sinkPortId:'',cableId:'',connected:false}:l)};
 const fit=checkPlugDrop({task,state:draft,index:target,side,port,cable});
 return {...fit,index:target,state:draft};
}
