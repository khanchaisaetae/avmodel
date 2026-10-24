import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {TROUBLESHOOT_TASKS} from '../src/troubleshoot-catalog.mjs';
import {initialTroubleshoot,reviewTroubleshoot,recordCheck,confirmTroubleshoot,troubleHint,troubleshootReport} from '../src/troubleshoot-model.mjs';
import {evaluateScenario,updateSegmentSelection} from '../src/scenario-engine.mjs';
const catalog=JSON.parse(readFileSync(new URL('../data/port-catalog.json',import.meta.url)));
function fix(task,state){
 let s=structuredClone(state);
 for(const fault of task.faults){
  if(fault==='display-off')s.power[task.displayId]=true;
  if(['output-off','play-off'].includes(fault))s.sourceEnabled[task.sources[0]]=true;
  if(fault==='wrong-input')s.displayInput=s.links[task.routes[0].segments.at(-1)].sinkPortId;
  if(['unplugged','wrong-cable'].includes(fault))s=updateSegmentSelection(task,s,0,{cableId:'hdmi'},catalog).state;
  if(fault==='audio-only')s=updateSegmentSelection(task,s,0,{sourcePortId:'bluray:hdmi1'},catalog).state;
  if(fault==='middle-off')s.power.vertex=true;
  if(['camera-selected','rgb-selected'].includes(fault))s.vertexSource='HDMI IN';
  if(fault==='occupied-input')s=updateSegmentSelection(task,s,1,{sinkPortId:'tv:hdmi-side'},catalog).state;
 }
 return s;
}
function notes(task,s){
 const checked=recordCheck(task,s,catalog,'system','ตรวจเส้นทางและเปรียบเทียบสถานะอุปกรณ์');
 return {...checked.state,troubleshoot:{...checked.state.troubleshoot,conclusion:'ตรวจพบการตั้งค่าหรือการเชื่อมต่อไม่ตรง จึงปรับแก้และตรวจภาพซ้ำ'}};
}
test('12 troubleshooting tasks use known devices, distinct IDs and no canceled dual-output tasks',()=>{
 assert.equal(TROUBLESHOOT_TASKS.length,12);assert.equal(new Set(TROUBLESHOOT_TASKS.map(t=>t.id)).size,12);
 for(const t of TROUBLESHOOT_TASKS){assert.equal(t.devices.filter(id=>['tv','epson'].includes(id)).length,1);assert.ok(t.devices.every(id=>catalog.devices.some(d=>d.id===id)));assert.ok(t.faults.length);}
});
for(const t of TROUBLESHOOT_TASKS)test(t.id+' starts with a real fault and requires explicit evidence before completion',()=>{
 const initial=initialTroubleshoot(t),r=evaluateScenario(t,initial,catalog);
 assert.notEqual(r.status,'ready');assert.equal(confirmTroubleshoot(t,initial,catalog).accepted,false);
 const before=reviewTroubleshoot(t,initial,catalog);assert.equal(before.result.code,'INVESTIGATE');assert.equal(before.result.complete,false);assert.notEqual(before.result.message,r.message);
 const repaired=fix(t,initial);assert.equal(evaluateScenario(t,repaired,catalog).status,'ready');
 assert.equal(reviewTroubleshoot(t,repaired,catalog).result.complete,false);assert.equal(confirmTroubleshoot(t,repaired,catalog).accepted,false);
 const evidenced=notes(t,repaired),confirmed=confirmTroubleshoot(t,evidenced,catalog);
 assert.equal(confirmed.accepted,true);assert.equal(reviewTroubleshoot(t,confirmed.state,catalog).result.complete,true);
 assert.notEqual(evaluateScenario(t,initial,catalog).status,'ready');
});
test('two-fault case remains unresolved after fixing just one cause',()=>{
 const t=TROUBLESHOOT_TASKS.at(-1),s=initialTroubleshoot(t);s.power.epson=true;
 assert.equal(evaluateScenario(t,s,catalog).code,'SOURCE_DISABLED');assert.equal(confirmTroubleshoot(t,notes(t,s),catalog).accepted,false);
 s.sourceEnabled.dell=true;assert.equal(confirmTroubleshoot(t,notes(t,s),catalog).accepted,true);
});
test('an image from the wrong source is visible but cannot be confirmed as repaired',()=>{
 const t=TROUBLESHOOT_TASKS[8],s=initialTroubleshoot(t),r=evaluateScenario(t,s,catalog);
 assert.equal(r.imageVisible,true);assert.equal(r.actualSource,'vertex');assert.equal(confirmTroubleshoot(t,notes(t,s),catalog).accepted,false);
});
test('checking does not alter the physical system; observations are bounded and recorded in order',()=>{
 const t=TROUBLESHOOT_TASKS[0],s=initialTroubleshoot(t),before=JSON.stringify(s);
 const a=recordCheck(t,s,catalog,'power','เครื่องฉายยังปิดอยู่','2026-10-24T12:00:00Z');
 const b=recordCheck(t,a.state,catalog,'input','ตรวจช่องรับภาพแล้ว','2026-10-24T12:01:00Z');
 assert.equal(JSON.stringify(s),before);assert.deepEqual(b.state.links,s.links);assert.equal(b.state.troubleshoot.checks.length,2);
 assert.equal(b.state.troubleshoot.checks[0].imageVisible,false);assert.equal(b.state.troubleshoot.checks[0].timestamp,'2026-10-24T12:00:00Z');
 assert.equal(recordCheck(t,s,catalog,'unknown','ข้อความ').accepted,false);assert.equal(recordCheck(t,s,catalog,'power','  ').accepted,false);
 assert.equal(recordCheck(t,s,catalog,'power','ก'.repeat(1200)).state.troubleshoot.checks[0].observation.length,1000);
});
test('hints are opt-in and progress from a checklist to the current diagnostic',()=>{
 const t=TROUBLESHOOT_TASKS[0],s=initialTroubleshoot(t);assert.equal(troubleHint(t,s,catalog),'');
 s.troubleshoot.hintLevel=1;assert.match(troubleHint(t,s,catalog),/ตรวจตามลำดับ/);
 s.troubleshoot.hintLevel=2;assert.match(troubleHint(t,s,catalog),/ไฟเลี้ยง/);
 s.troubleshoot.hintLevel=3;assert.equal(troubleHint(t,s,catalog),evaluateScenario(t,s,catalog).message);
});
test('later changes to settings or explanation invalidate an earlier confirmation',()=>{
 const t=TROUBLESHOOT_TASKS[0],s=confirmTroubleshoot(t,notes(t,fix(t,initialTroubleshoot(t))),catalog).state;
 assert.equal(reviewTroubleshoot(t,s,catalog).result.complete,true);
 const wrong=structuredClone(s);wrong.displayInput='epson:hdmi2';assert.equal(reviewTroubleshoot(t,wrong,catalog).result.complete,false);
 const edited=structuredClone(s);edited.troubleshoot.conclusion+=' และตรวจอีกครั้ง';assert.equal(reviewTroubleshoot(t,edited,catalog).result.complete,false);
});
test('unsupported USB-C route is indeterminate and never passes as a guessed repair',()=>{
 const t=TROUBLESHOOT_TASKS[0],s=fix(t,initialTroubleshoot(t));s.links[0].sourcePortId='dell:usb-c';
 assert.equal(evaluateScenario(t,s,catalog).status,'indeterminate');assert.equal(confirmTroubleshoot(t,notes(t,s),catalog).accepted,false);
});
test('report preserves diagnosis, ordered checks and hints without scores or shared mutations',()=>{
 const t=TROUBLESHOOT_TASKS[6],before=JSON.stringify(catalog),taskBefore=JSON.stringify(t);
 let s=initialTroubleshoot(t);s=recordCheck(t,s,catalog,'ports','ตรวจชื่อ HDMI OUT บนเครื่องเล่น').state;s=fix(t,s);
 s.troubleshoot.conclusion='เปลี่ยนจากช่องส่งเฉพาะเสียง ไปช่องส่งภาพและเสียง';s.troubleshoot.hintLevel=2;
 s=confirmTroubleshoot(t,s,catalog).state;const r=troubleshootReport(t,s,catalog);
 assert.equal(r.complete,true);assert.equal(r.hintsUsed,2);assert.equal(r.checks.length,1);assert.equal('score' in r,false);
 r.links[0].sourcePortId='bad';r.checks[0].observation='แก้สำเนา';assert.equal(s.links[0].sourcePortId,'bluray:hdmi1');assert.notEqual(s.troubleshoot.checks[0].observation,'แก้สำเนา');
 assert.equal(JSON.stringify(catalog),before);assert.equal(JSON.stringify(t),taskBefore);
});
