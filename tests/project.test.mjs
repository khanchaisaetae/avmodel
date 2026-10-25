import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PROJECT_MISSIONS,PROJECT_FIELDS,PROJECT_CHECKS} from '../src/project-catalog.mjs';
import {emptyDiagram} from '../src/diagram-data.mjs';
import {emptyProjectMeta,reviewProject,captureProjectTest,normalizeProjectMeta,projectReadiness,projectSignature,projectPackage,parseProjectPackage,projectWiring} from '../src/project-model.mjs';
import {projectHtml} from '../src/project-documents.mjs';
const catalog=JSON.parse(readFileSync(new URL('../data/port-catalog.json',import.meta.url)));
function design(m){
 const primary=m.tests[0].displayId,video=m.tests[2].displayId;
 const links=[['dell','vertex','dell:hdmi','vertex:hdmi-in'],['vertex',primary,'vertex:hdmi-out',primary==='tv'?'tv:hdmi-rear':'epson:hdmi1'],
 ['bluray',video,'bluray:hdmi1',video===primary?(video==='tv'?'tv:hdmi-side':'epson:hdmi2'):(video==='tv'?'tv:hdmi-rear':'epson:hdmi1')]];
 return {...emptyDiagram('free'),reason:'เลือกพอร์ต HDMI เพื่อจัดระบบภาพและสลับแหล่งภาพตามความต้องการ',
  nodes:m.devices.map((id,i)=>({id,x:i*180,y:40,power:true,enabled:['dell','bluray'].includes(id),input:id==='tv'?'tv:hdmi-rear':id==='epson'?'epson:hdmi1':'',source:id==='vertex'?'HDMI IN':'CAMERA'})),
  links:links.map(([from,to,sourcePortId,sinkPortId],i)=>({id:'w'+(i+1),from,to,sourcePortId,sinkPortId,cableId:'hdmi'}))};
}
function select(m,d,testId){
 const next=structuredClone(d),t=m.tests.find(t=>t.id===testId),link=next.links.find(l=>l.to===t.displayId&&l.from===(t.source==='bluray'?'bluray':'vertex'));
 next.nodes.find(n=>n.id===t.displayId).input=link.sinkPortId;next.nodes.find(n=>n.id==='vertex').source=t.source==='vertex'?'CAMERA':'HDMI IN';return next;
}
function complete(m){let d=design(m),meta=emptyProjectMeta();for(const t of m.tests){d=select(m,d,t.id);const captured=captureProjectTest(m,d,catalog,meta,t.id,'2026-10-25T01:00:00Z');assert.equal(captured.accepted,true);meta=captured.meta;}
 d=select(m,d,'slides');for(const[id]of PROJECT_FIELDS)meta.notes[id]='ระบุความต้องการและขั้นตอนให้ผู้อื่นทำตามได้อย่างเหมาะสม';meta.checks=PROJECT_CHECKS.map(([id])=>id);return {d,meta};}
for(const m of PROJECT_MISSIONS)test(m.id+' captures all sources, restores startup and confirms a portable package',()=>{
 let {d,meta}=complete(m);const r=projectReadiness(m,d,catalog,meta);assert.equal(r.ready,true);assert.equal(r.confirmed,false);
 meta.accepted=projectSignature(m,d,r.meta);const p=projectPackage(m,d,catalog,meta);assert.equal(p.confirmed,true);assert.equal(p.tests.length,3);assert.ok(p.tests.every(t=>t.passed));
 const imported=parseProjectPackage(JSON.parse(JSON.stringify(p)),catalog);assert.equal(projectReadiness(imported.mission,imported.diagram,catalog,imported.meta).confirmed,true);
 assert.equal(p.inventory.devices.length,m.devices.length);assert.equal(p.inventory.wires.length,3);assert.equal('score' in p,false);
});
test('two advanced missions cover all five devices and independent displays without a Matrix',()=>{
 for(const m of PROJECT_MISSIONS.slice(1)){assert.equal(m.devices.length,5);assert.equal(new Set(m.tests.map(t=>t.displayId)).size,2);const {d}=complete(m);
 const states=m.startup.map(id=>reviewProject(m,d,catalog,id));assert.ok(states.every(r=>r.live.status==='ready'));assert.deepEqual(new Set(states.map(r=>r.live.actualSource)),new Set(['dell','bluray']));}
});
test('alternative native topology is accepted rather than requiring one model answer',()=>{
 const m=PROJECT_MISSIONS[1],d=design(m);d.links=[{id:'w1',from:'dell',to:'epson',sourcePortId:'dell:hdmi',sinkPortId:'epson:hdmi1',cableId:'hdmi'},
 {id:'w2',from:'vertex',to:'epson',sourcePortId:'vertex:hdmi-out',sinkPortId:'epson:hdmi2',cableId:'hdmi'},d.links[2]];
 d.nodes.find(n=>n.id==='vertex').source='CAMERA';
 assert.equal(reviewProject(m,d,catalog,'slides').live.status,'ready');d.nodes.find(n=>n.id==='epson').input='epson:hdmi2';assert.equal(reviewProject(m,d,catalog,'document').live.status,'ready');assert.equal(reviewProject(m,d,catalog,'video').live.status,'ready');
});
test('an image alone cannot complete a project without the test records, guide and checklist',()=>{
 const m=PROJECT_MISSIONS[0],d=design(m),r=projectReadiness(m,d,catalog,emptyProjectMeta());assert.equal(r.ready,false);assert.ok(r.pending.length>=8);
});
test('recorded tests survive moving nodes, but not a change to either cable endpoint',()=>{
 const m=PROJECT_MISSIONS[0],{d,meta}=complete(m),moved=structuredClone(d);moved.nodes[0].x=20;
 assert.equal(projectWiring(m,d),projectWiring(m,moved));assert.equal(Object.keys(normalizeProjectMeta(meta,m,moved,catalog).proofs).length,3);
 moved.links[0].sourcePortId='dell:usb-c';assert.equal(Object.keys(normalizeProjectMeta(meta,m,moved,catalog).proofs).length,0);
});
test('wrong-source camera and cross-type Vertex settings do not create passing evidence',()=>{
 const m=PROJECT_MISSIONS[0],d=design(m);d.nodes.find(n=>n.id==='vertex').source='CAMERA';assert.equal(captureProjectTest(m,d,catalog,emptyProjectMeta(),'slides').accepted,false);
 d.nodes.find(n=>n.id==='vertex').source='PC1';assert.equal(reviewProject(m,d,catalog,'slides').live.code,'VERTEX_SIGNAL_TYPE');
});
test('audio-only ports, missing devices and occupied outputs cannot pass',()=>{
 const m=PROJECT_MISSIONS[1];for(const edit of [d=>d.links[2].sourcePortId='bluray:hdmi2',d=>d.nodes.pop(),d=>d.links.push({...d.links[0],id:'w99'})]){
 const d=design(m);edit(d);assert.equal(captureProjectTest(m,d,catalog,emptyProjectMeta(),'slides').accepted,false);}
});
test('all proof records do not bypass startup requirements or switched-off sources',()=>{
 const m=PROJECT_MISSIONS[1],{d,meta}=complete(m);d.nodes.find(n=>n.id==='vertex').source='CAMERA';assert.equal(projectReadiness(m,d,catalog,meta).ready,false);
 d.nodes.find(n=>n.id==='vertex').source='HDMI IN';d.nodes.find(n=>n.id==='bluray').power=false;assert.equal(projectReadiness(m,d,catalog,meta).ready,false);
});
test('changed guide text invalidates earlier acceptance without losing physical test history',()=>{
 const m=PROJECT_MISSIONS[0],{d,meta}=complete(m);meta.accepted=projectSignature(m,d,projectReadiness(m,d,catalog,meta).meta);
 assert.equal(projectReadiness(m,d,catalog,meta).confirmed,true);meta.notes.care+=' เพิ่มแนวทางดูแล';const r=projectReadiness(m,d,catalog,meta);assert.equal(r.ready,true);assert.equal(r.confirmed,false);assert.equal(Object.keys(r.meta.proofs).length,3);
});
test('import rejects unknown packages and recomputes rather than trusting passed/confirmed fields',()=>{
 const m=PROJECT_MISSIONS[0],{d,meta}=complete(m),p=projectPackage(m,d,catalog,meta);p.confirmed=true;p.meta.accepted='forged';p.meta.proofs.slides.diagram.nodes.find(n=>n.id==='dell').enabled=false;
 const parsed=parseProjectPackage(p,catalog);assert.equal(parsed.meta.proofs.slides,undefined);assert.equal(projectReadiness(m,parsed.diagram,catalog,parsed.meta).confirmed,false);
 for(const patch of [{version:99},{missionId:'unknown'},{schema:'other'}])assert.throws(()=>parseProjectPackage({...p,...patch},catalog));
});
test('HTML handoff is self contained, contains installation and test evidence, and escapes learner text',()=>{
 const m=PROJECT_MISSIONS[1],{d,meta}=complete(m),before=JSON.stringify(catalog);meta.notes.needs='<script>alert("x")</script> & เป้าหมาย';const html=projectHtml(m,d,catalog,meta);
 assert.ok(html.startsWith('<!doctype html>'));assert.ok(html.includes('ตารางติดตั้งสาย'));assert.ok(html.includes('ผลทดสอบและตารางเลือกแหล่งภาพ'));assert.ok(html.includes('Sony KDL-40W650D'));
 assert.ok(!html.includes('<script>'));assert.ok(html.includes('&lt;script&gt;'));assert.ok(html.includes('ฉบับร่าง'));assert.equal(JSON.stringify(catalog),before);
});
