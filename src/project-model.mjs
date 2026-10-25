import {parseDiagram} from './diagram-data.mjs';
import {reviewDiagram} from './diagram-review.mjs?v=20261025-project';
import {DEVICE_NAMES} from './scenario-catalog.mjs';
import {installationRows} from './transfer-model.mjs';
import {getProjectMission,PROJECT_FIELDS,PROJECT_CHECKS} from './project-catalog.mjs';
const copy=value=>JSON.parse(JSON.stringify(value));
export function parseProjectDiagram(value,catalog){return {...parseDiagram(value,catalog),taskId:'free'};}
export function projectWiring(mission,d){
 return JSON.stringify([mission.id,d.nodes.map(n=>n.id).sort(),d.links.map(l=>JSON.stringify([l.from,l.to,l.sourcePortId,l.sinkPortId,l.cableId])).sort()]);
}
export function reviewProject(mission,diagram,catalog,testId){
 const step=mission.tests.find(t=>t.id===testId)||mission.tests[0];
 let d;try{d=parseProjectDiagram(diagram,catalog);}catch(e){return {structureReady:false,live:null,issues:[{message:e.message}],message:e.message};}
 const task={id:'project',mode:'1920x1080@60',devices:mission.devices,sources:['dell','vertex','bluray'],displayId:step.displayId,
   segments:d.links.map(l=>({from:l.from,to:l.to}))};
 const r=reviewDiagram(d,catalog,step.source,task);
 const active=new Set(),visited=new Set();let cycle=false;
 function visit(id){if(active.has(id)){cycle=true;return;}if(visited.has(id))return;active.add(id);
  for(const l of d.links.filter(l=>l.from===id))visit(l.to);active.delete(id);visited.add(id);}
 for(const n of d.nodes)visit(n.id);
 if(cycle){r.issues.push({kind:'topology',message:'พบวงจรย้อนกลับในเส้นทางภาพ'});r.structureReady=false;}
 r.message=r.structureReady&&r.live?.status==='ready'?'ทดสอบสำเร็จ: '+step.title:r.issues.length?'ตรวจรายการในผัง แล้วทดสอบใหม่':r.live?.message||'ยังไม่พร้อมทดสอบ';
 return r;
}
export function emptyProjectMeta(){return {notes:{},checks:[],proofs:{},accepted:null};}
export function normalizeProjectMeta(value,mission,diagram,catalog){
 const meta=emptyProjectMeta();
 for(const[id]of PROJECT_FIELDS)meta.notes[id]=typeof value?.notes?.[id]==='string'?value.notes[id].slice(0,2000):'';
 meta.checks=Array.isArray(value?.checks)?[...new Set(value.checks.filter(id=>PROJECT_CHECKS.some(([key])=>id===key)))]:[];
 const wiring=projectWiring(mission,diagram);
 for(const t of mission.tests){const p=value?.proofs?.[t.id];if(!p||typeof p.timestamp!=='string'||!/^\d{4}-\d\d-\d\dT/.test(p.timestamp))continue;
  try{const d=parseProjectDiagram(p.diagram,catalog),r=reviewProject(mission,d,catalog,t.id);
   if(projectWiring(mission,d)===wiring&&r.structureReady&&r.live?.status==='ready')meta.proofs[t.id]={timestamp:p.timestamp.slice(0,32),diagram:d};
  }catch{}
 }
 meta.accepted=typeof value?.accepted==='string'&&value.accepted.length<100000?value.accepted:null;
 return meta;
}
export function captureProjectTest(mission,diagram,catalog,meta,testId,timestamp=new Date().toISOString()){
 const next=normalizeProjectMeta(meta,mission,diagram,catalog),r=reviewProject(mission,diagram,catalog,testId);
 if(!mission.tests.some(t=>t.id===testId)||!r.structureReady||r.live?.status!=='ready')return {accepted:false,meta:next,result:r};
 next.proofs[testId]={timestamp,diagram:parseProjectDiagram(diagram,catalog)};next.accepted=null;
 return {accepted:true,meta:next,result:r};
}
export function projectSignature(mission,diagram,meta){
 return JSON.stringify([mission.id,projectWiring(mission,diagram),diagram.reason,
  diagram.nodes.map(n=>[n.id,n.power,n.enabled,n.input,n.source]).sort(),meta.notes,[...meta.checks].sort(),meta.proofs]);
}
export function projectReadiness(mission,diagram,catalog,value){
 const meta=normalizeProjectMeta(value,mission,diagram,catalog),pending=[];
 for(const t of mission.tests)if(!meta.proofs[t.id])pending.push('ยังไม่ทดสอบ '+t.title+' ของผังฉบับนี้');
 const startup=mission.startup.map(id=>({id,result:reviewProject(mission,diagram,catalog,id)}));
 if(startup.some(x=>!x.result.structureReady||x.result.live?.status!=='ready'))pending.push('คืนสภาพเริ่มใช้งาน: '+mission.startup.map(id=>mission.tests.find(t=>t.id===id).title).join(' และ '));
 if(diagram.reason.trim().length<10)pending.push('อธิบายเหตุผลการออกแบบอย่างน้อย 10 ตัวอักษร');
 for(const[id,label]of PROJECT_FIELDS)if(meta.notes[id].trim().length<10)pending.push(label+': อย่างน้อย 10 ตัวอักษร');
 for(const[id,label]of PROJECT_CHECKS)if(!meta.checks.includes(id))pending.push(label);
 for(const id of mission.devices)if(!diagram.nodes.find(n=>n.id===id)?.power)pending.push('เปิดเครื่อง '+DEVICE_NAMES[id]+' ให้พร้อมใช้');
 for(const id of ['dell','bluray'])if(mission.devices.includes(id)&&!diagram.nodes.find(n=>n.id===id)?.enabled)pending.push('เปิดเล่น / ส่งภาพของ '+DEVICE_NAMES[id]);
 const ready=pending.length===0;
 return {meta,pending,startup,ready,confirmed:ready&&meta.accepted===projectSignature(mission,diagram,meta)};
}
export function projectInventory(diagram,catalog){
 const wires=installationRows(diagram,catalog),groups=new Map();
 for(const row of wires)groups.set(row.cable,(groups.get(row.cable)||0)+1);
 return {devices:diagram.nodes.map(n=>({id:n.id,name:DEVICE_NAMES[n.id],quantity:1})),
  cables:[...groups].map(([name,quantity])=>({name,quantity})),wires};
}
export function projectPackage(mission,diagram,catalog,meta){
 const d=parseProjectDiagram(diagram,catalog),r=projectReadiness(mission,d,catalog,meta);
 return {schema:'av-port-lab.classroom-project',version:1,missionId:mission.id,diagram:d,meta:r.meta,
  confirmed:r.confirmed,pending:r.pending,inventory:projectInventory(d,catalog),
  tests:mission.tests.map(t=>({id:t.id,title:t.title,passed:!!r.meta.proofs[t.id],timestamp:r.meta.proofs[t.id]?.timestamp||null})),
  note:'ผลจำลอง ไม่มีคะแนน การตรวจข้อความและรายการดูแลเป็นการบันทึกโดยผู้เรียน ผู้สอนต้องตรวจเนื้อหาก่อนใช้จริง ไม่มีการส่งผลอัตโนมัติ'};
}
export function parseProjectPackage(value,catalog){
 const mission=getProjectMission(value?.missionId);
 if(value?.schema!=='av-port-lab.classroom-project'||value.version!==1||!mission)throw Error('ไฟล์แฟ้มโครงการไม่รองรับ');
 const diagram=parseProjectDiagram(value.diagram,catalog),meta=normalizeProjectMeta(value.meta,mission,diagram,catalog);
 return {mission,diagram,meta};
}
