import {initialScenario,updateSegmentSelection,evaluateScenario} from './scenario-engine.mjs';
import {WIRE_CHOICES} from './lesson-cables.mjs';
export const LAB3D_KEY='av-port-lab.lab3d.v1.';
export function selectLabPort(task,state,index,side,portId,catalog){
 const segment=task.segments[index],port=catalog.devices.flatMap(d=>d.ports).find(p=>p.id===portId);
 if(!segment||!['out','in'].includes(side)||!port||portId.split(':')[0]!==segment[side==='out'?'from':'to'])throw Error('เลือกพอร์ตบนอุปกรณ์ให้ตรงปลายสายที่กำลังต่อ');
 return updateSegmentSelection(task,state,index,{[side==='out'?'sourcePortId':'sinkPortId']:portId},catalog);
}
export function selectLabCable(task,state,index,cableId,catalog){
 if(cableId!==''&&!WIRE_CHOICES.some(c=>c.id===cableId))throw Error('ไม่พบชนิดสายนี้');
 return updateSegmentSelection(task,state,index,{cableId},catalog);
}
export function labPackage(task,state){return {schema:'av-port-lab.lab3d',version:1,taskId:task.id,state:structuredClone(state)};}
export function parseLabPackage(value,tasks,catalog){
 const task=tasks.find(t=>t.id===value?.taskId),input=value?.state;
 if(value?.schema!=='av-port-lab.lab3d'||value.version!==1||!task||!input||!Array.isArray(input.links)||input.links.length!==task.segments.length)throw Error('ไฟล์ไม่ใช่งานทดลองสามมิติที่รองรับ');
 let state=initialScenario(task);
 for(let i=0;i<input.links.length;i++){
  const l=input.links[i];if(!l||typeof l!=='object')throw Error('ข้อมูลสายไม่ครบ');
  for(const [side,key]of [['out','sourcePortId'],['in','sinkPortId']])if(l[key])state=selectLabPort(task,state,i,side,l[key],catalog).state;
  state=selectLabCable(task,state,i,l.cableId||'',catalog).state;
 }
 state.power=Object.fromEntries(task.devices.map(id=>[id,input.power?.[id]===true]));
 state.sourceEnabled=Object.fromEntries(Object.keys(state.sourceEnabled).map(id=>[id,input.sourceEnabled?.[id]===true]));
 const display=catalog.devices.find(d=>d.id===task.displayId);
 if(display.ports.some(p=>p.id===input.displayInput))state.displayInput=input.displayInput;
 if(['CAMERA','HDMI IN','PC1','PC2'].includes(input.vertexSource))state.vertexSource=input.vertexSource;
 if(task.sources.includes(input.requestedSource))state.requestedSource=input.requestedSource;
 // Imported completion is rechecked, never trusted as an assessment record.
 const observed=Array.isArray(input.observedSources)?input.observedSources:[];
 state.observedSources=task.sources.filter(source=>{
  if(!observed.includes(source))return false;const route=task.routes.find(r=>r.source===source),displayInput=state.links[route.segments.at(-1)].sinkPortId;
  return evaluateScenario(task,{...state,requestedSource:source,displayInput},catalog).status==='ready';
 });state.attempts=0;
 return {task,state};
}
