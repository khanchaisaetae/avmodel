import { SCENARIOS, DEVICE_NAMES } from './scenario-catalog.mjs';
import { initialScenario, evaluateScenario } from './scenario-engine.mjs';
import { WIRE_CHOICES } from './lesson-cables.mjs';
import { parseDiagram } from './diagram-data.mjs';
import { reviewDiagram } from './diagram-review.mjs';
const clone=value=>JSON.parse(JSON.stringify(value));
export const INCOMING_TRANSFER_KEY='av-port-lab.transfer.incoming.v1';
export function parseReference(value,catalog){
 const task=SCENARIOS.find(t=>t.id===value?.taskId),s=value?.state;
 if(value?.schema!=='av-port-lab.transfer-reference'||value.version!==1||!task||
   typeof value.id!=='string'||! /^[a-z0-9-]{1,80}$/.test(value.id)||!s||!Array.isArray(s.links)||s.links.length!==task.segments.length)
   throw Error('ข้อมูลระบบอ้างอิงไม่รองรับ');
 const ports=new Map(catalog.devices.flatMap(d=>d.ports.map(p=>[p.id,p])));
 const links=s.links.map((l,i)=>{
  const seg=task.segments[i];
  if(!l||!ports.has(l.sourcePortId)||!ports.has(l.sinkPortId)||
    !l.sourcePortId.startsWith(seg.from+':')||!l.sinkPortId.startsWith(seg.to+':')||
    !WIRE_CHOICES.some(c=>c.id===l.cableId)||typeof l.connected!=='boolean')throw Error('พอร์ตหรือสายของระบบอ้างอิงไม่ถูกต้อง');
  return {sourcePortId:l.sourcePortId,sinkPortId:l.sinkPortId,cableId:l.cableId,connected:l.connected};
 });
 const power={},sourceEnabled={};
 for(const id of task.devices){if(typeof s.power?.[id]!=='boolean')throw Error('สถานะเปิดเครื่องไม่ครบ');power[id]=s.power[id];}
 for(const id of task.sources.filter(id=>id!=='vertex')){if(typeof s.sourceEnabled?.[id]!=='boolean')throw Error('สถานะส่งภาพไม่ครบ');sourceEnabled[id]=s.sourceEnabled[id];}
 if(!task.sources.includes(s.requestedSource)||typeof s.displayInput!=='string'||
   !['CAMERA','HDMI IN','PC1','PC2'].includes(s.vertexSource))throw Error('แหล่งภาพหรือการตั้งค่าไม่ถูกต้อง');
 const state={links,power,sourceEnabled,displayInput:s.displayInput,vertexSource:s.vertexSource,
   requestedSource:s.requestedSource,observedSources:[],attempts:0};
 if(evaluateScenario(task,state,catalog).status!=='ready')throw Error('ระบบอ้างอิงยังไม่พร้อมแสดงภาพตามเป้าหมาย');
 return {schema:'av-port-lab.transfer-reference',version:1,id:value.id,taskId:task.id,
   origin:value.origin==='practice'?'practice':'sample',state};
}
export function referenceFromScenario(task,state,catalog,id='sent-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10)){
 return parseReference({schema:'av-port-lab.transfer-reference',version:1,id,taskId:task.id,origin:'practice',state},catalog);
}
export function sampleReference(task,catalog){
 const s=initialScenario(task),used={};
 for(const id of task.devices)s.power[id]=true;
 for(const id of Object.keys(s.sourceEnabled))s.sourceEnabled[id]=true;
 s.vertexSource=['pass','merge'].includes(task.type)?'HDMI IN':'CAMERA';
 s.links=task.segments.map(seg=>({sourcePortId:{dell:'dell:hdmi',bluray:'bluray:hdmi1',vertex:'vertex:hdmi-out'}[seg.from],
  sinkPortId:seg.to==='vertex'?'vertex:hdmi-in':seg.to==='epson'?'epson:hdmi'+(used.epson=(used.epson||0)+1):
    (used.tv=(used.tv||0)+1)===1?'tv:hdmi-rear':'tv:hdmi-side',cableId:'hdmi',connected:true}));
 s.displayInput=s.links[task.routes[0].segments.at(-1)].sinkPortId;
 return parseReference({schema:'av-port-lab.transfer-reference',version:1,id:'sample-'+task.id,taskId:task.id,origin:'sample',state:s},catalog);
}
const wireKey=l=>JSON.stringify([l.from,l.to,l.sourcePortId,l.sinkPortId,l.cableId]);
export function compareTransfer(reference,diagram,catalog){
 const ref=parseReference(reference,catalog),task=SCENARIOS.find(t=>t.id===ref.taskId),issues=[];
 let drawing;try{drawing=parseDiagram(diagram,catalog);}catch(e){return {matches:false,issues:[e.message],live:null};}
 if(drawing.taskId!==task.id)issues.push('โจทย์ในผังไม่ตรงกับระบบอ้างอิง');
 const actualIds=drawing.nodes.map(n=>n.id);
 for(const id of task.devices)if(!actualIds.includes(id))issues.push('ยังไม่มี '+DEVICE_NAMES[id]+' ในผัง');
 for(const id of actualIds)if(!task.devices.includes(id))issues.push(DEVICE_NAMES[id]+' ไม่อยู่ในระบบอ้างอิง');
 const expected=task.segments.map((seg,i)=>({from:seg.from,to:seg.to,...ref.state.links[i]}));
 const actual=drawing.links.map(wireKey),expectedKeys=expected.map(wireKey);
 for(let i=0;i<expected.length;i++)if(!actual.includes(expectedKeys[i]))issues.push('สายอ้างอิง C'+(i+1)+': พอร์ตต้นทาง พอร์ตปลายทาง หรือชนิดสายยังไม่ตรง');
 for(const key of actual)if(!expectedKeys.includes(key)||actual.filter(x=>x===key).length>1)issues.push('มีสายเกิน ซ้ำ หรือเชื่อมต่างจากระบบอ้างอิง');
 for(const n of drawing.nodes){
  if(!task.devices.includes(n.id))continue;
  if(n.power!==ref.state.power[n.id])issues.push(DEVICE_NAMES[n.id]+': สถานะเปิดเครื่องไม่ตรง');
  if(Object.hasOwn(ref.state.sourceEnabled,n.id)&&n.enabled!==ref.state.sourceEnabled[n.id])issues.push(DEVICE_NAMES[n.id]+': สถานะเล่น / ส่งภาพไม่ตรง');
  if(n.id===task.displayId&&n.input!==ref.state.displayInput)issues.push(DEVICE_NAMES[n.id]+': Input ไม่ตรงกับระบบอ้างอิง');
  if(n.id==='vertex'&&n.source!==ref.state.vertexSource)issues.push('Vertex: SOURCE ไม่ตรงกับระบบอ้างอิง');
 }
 const live=reviewDiagram(drawing,catalog,ref.state.requestedSource).live;
 if(!live||live.status!=='ready')issues.push('ผังยังไม่แสดงภาพจากแหล่งเป้าหมายตามกฎจำลอง');
 return {matches:issues.length===0,issues:[...new Set(issues)],live};
}
export function drawingSignature(reference,diagram){
 return JSON.stringify([reference.id,diagram.taskId,
   diagram.nodes.map(n=>[n.id,n.power,n.enabled,n.input,n.source]).sort((a,b)=>a[0].localeCompare(b[0])),
   diagram.links.map(wireKey).sort()]);
}
export function documentSignature(reference,diagram,inspected){
 return JSON.stringify([drawingSignature(reference,diagram),diagram.reason,[...inspected].sort()]);
}
export function transferReadiness(reference,diagram,catalog,inspected,checkedSignature){
 const comparison=compareTransfer(reference,diagram,catalog),task=SCENARIOS.find(t=>t.id===reference.taskId);
 const observed=task.devices.every(id=>inspected.includes(id)),reason=diagram.reason.trim().length>=10;
 const checked=checkedSignature===drawingSignature(reference,diagram);
 return {comparison,observed,reason,checked,ready:comparison.matches&&observed&&reason&&checked};
}
export function installationRows(diagram,catalog){
 const ports=new Map(catalog.devices.flatMap(d=>d.ports.map(p=>[p.id,p])));
 return diagram.links.map((l,i)=>({wire:'L'+(i+1),from:DEVICE_NAMES[l.from],out:ports.get(l.sourcePortId)?.label||'ยังไม่ระบุ',
   to:DEVICE_NAMES[l.to],in:ports.get(l.sinkPortId)?.label||'ยังไม่ระบุ',cable:WIRE_CHOICES.find(c=>c.id===l.cableId)?.label||'ยังไม่ระบุ'}));
}
export function transferReport(reference,diagram,catalog,inspected,checkedSignature,confirmedSignature){
 const readiness=transferReadiness(reference,diagram,catalog,inspected,checkedSignature);
 return {schema:'av-port-lab.transfer-report',version:1,reference:clone(reference),diagram:parseDiagram(diagram,catalog),
   inspectedDevices:[...inspected],comparison:readiness.comparison,
   confirmed:readiness.ready&&confirmedSignature===documentSignature(reference,diagram,inspected),
   installation:installationRows(diagram,catalog),
   note:'เอกสารจากการจำลอง ไม่มีคะแนน ผู้สอนต้องตรวจความถูกต้องของเหตุผลก่อนนำไปใช้กับอุปกรณ์จริง'};
}
