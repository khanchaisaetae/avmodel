import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CLASSROOM_TASKS } from '../src/classroom-catalog.mjs';
import { initialClassroom, prepareClassroom, reviewClassroom, confirmClassroomStage, classroomReport } from '../src/classroom-model.mjs';
const catalog = JSON.parse(readFileSync(new URL('../data/port-catalog.json', import.meta.url)));
function wired(task) {
  const s = initialClassroom(task), used = {};
  for (const id of task.devices) s.power[id] = true;
  for (const id of Object.keys(s.sourceEnabled)) s.sourceEnabled[id] = true;
  s.links = task.segments.map(seg => ({
    sourcePortId: { dell: 'dell:hdmi', bluray: 'bluray:hdmi1', vertex: 'vertex:hdmi-out' }[seg.from],
    sinkPortId: seg.to === 'vertex' ? 'vertex:hdmi-in' :
      seg.to === 'epson' ? 'epson:hdmi' + (used.epson = (used.epson || 0) + 1) :
        (used.tv = (used.tv || 0) + 1) === 1 ? 'tv:hdmi-rear' : 'tv:hdmi-side',
    cableId: 'hdmi', connected: true,
  }));
  return target(task, s);
}
function target(task, state) {
  const s = prepareClassroom(task, state), source = s.requestedSource;
  const route = task.routes.find(r => r.source === source);
  s.displayInput = s.links[route.segments.at(-1)].sinkPortId;
  s.vertexSource = source === 'vertex' ? 'CAMERA' : 'HDMI IN';
  return s;
}
test('classroom uses three sources and one display, without extra hardware or canceled tasks', () => {
  assert.equal(CLASSROOM_TASKS.length, 4);
  assert.equal(new Set(CLASSROOM_TASKS.map(t => t.id)).size, 4);
  for (const t of CLASSROOM_TASKS) {
    assert.equal(t.devices.length, 4); assert.equal(t.segments.length, 3);
    assert.deepEqual([...t.sources].sort(), ['bluray','dell','vertex']);
    assert.equal(t.devices.filter(id => ['epson','tv'].includes(id)).length, 1);
    assert.deepEqual(t.sequence.map(s => s.source), ['dell','vertex','bluray','dell']);
    assert.ok(t.devices.every(id => catalog.devices.some(d => d.id === id)));
  }
});
for (const task of CLASSROOM_TASKS) test(task.id + ' requires all four explicit teaching checkpoints with unchanged wiring', () => {
  let s = wired(task); const links = JSON.stringify(s.links);
  for (let i=0; i<4; i++) {
    s = target(task, s);
    const live = reviewClassroom(task,s,catalog);
    assert.equal(live.result.status,'ready'); assert.equal(live.result.complete,false);
    assert.equal(live.state.classroom.proofs.length,i); // rendering never confirms
    const checked = confirmClassroomStage(task,s,catalog,'2026-10-24T10:00:00Z');
    assert.equal(checked.accepted,true);
    assert.equal(checked.state.classroom.proofs.length,i+1);
    assert.equal(checked.result.complete,i===3);
    assert.equal(JSON.stringify(checked.state.links),links);
    s=checked.state;
  }
  assert.deepEqual(s.classroom.proofs.map(p=>p.source),['dell','vertex','bluray','dell']);
  assert.equal(confirmClassroomStage(task,s,catalog).accepted,false);
});
test('wrong picture cannot skip a checkpoint, even with a visible camera picture', () => {
  const t=CLASSROOM_TASKS[0],s=wired(t);s.vertexSource='CAMERA';
  const r=confirmClassroomStage(t,s,catalog);
  assert.equal(r.accepted,false);assert.equal(r.result.code,'WRONG_SOURCE');
  assert.equal(r.result.actualSource,'vertex');assert.equal(r.state.classroom.proofs.length,0);
});
test('camera is an internal source on the existing Vertex output, not an extra cable', () => {
  const t=CLASSROOM_TASKS[0];let s=confirmClassroomStage(t,wired(t),catalog).state;
  s=target(t,s); assert.equal(s.requestedSource,'vertex');
  const r=reviewClassroom(t,s,catalog);assert.equal(r.result.status,'ready');assert.equal(r.result.actualSource,'vertex');assert.equal(r.state.links.length,3);
});
test('changing a wire after confirmation invalidates all earlier checkpoints', () => {
  const t=CLASSROOM_TASKS[0],s=confirmClassroomStage(t,wired(t),catalog).state;
  s.links=s.links.map((l,i)=>i===2?{...l,cableId:'vga',connected:false}:l);
  const r=reviewClassroom(t,s,catalog);assert.equal(r.state.classroom.proofs.length,0);assert.equal(r.state.requestedSource,'dell');assert.equal(r.result.complete,false);
});
test('changing Input and SOURCE preserves confirmed history while requiring the next picture', () => {
  const t=CLASSROOM_TASKS[0],s=confirmClassroomStage(t,wired(t),catalog).state;
  assert.equal(s.classroom.proofs.length,1);
  const r=confirmClassroomStage(t,s,catalog);assert.equal(r.accepted,false);
  const next=target(t,s);assert.equal(confirmClassroomStage(t,next,catalog).state.classroom.proofs.length,2);
});
test('all branches must be connected before the first classroom checkpoint', () => {
  const t=CLASSROOM_TASKS[0],s=wired(t);s.links[2].connected=false;
  const r=confirmClassroomStage(t,s,catalog);assert.equal(r.accepted,false);assert.equal(r.result.code,'INCOMPLETE_SYSTEM');
});
for (const setting of ['PC1','PC2']) test('Vertex '+setting+' does not output cross-type HDMI video', () => {
  const t=CLASSROOM_TASKS[0],s=wired(t);s.vertexSource=setting;
  const r=confirmClassroomStage(t,s,catalog);assert.equal(r.accepted,false);assert.equal(r.result.code,'VERTEX_SIGNAL_TYPE');
});
test('Blu-ray audio-only output and an occupied display input cannot pass', () => {
  const t=CLASSROOM_TASKS[0],s=wired(t);s.links[2].sourcePortId='bluray:hdmi2';
  assert.equal(confirmClassroomStage(t,s,catalog).accepted,false);
  s.links[2].sourcePortId='bluray:hdmi1';s.links[2].sinkPortId=s.links[1].sinkPortId;
  assert.equal(confirmClassroomStage(t,s,catalog).accepted,false);
});
test('report includes ordered evidence and settings without scores or catalog mutation', () => {
  const t=CLASSROOM_TASKS[1],before=JSON.stringify(catalog);let s=wired(t);
  for(let i=0;i<4;i++)s=confirmClassroomStage(t,target(t,s),catalog).state;
  const r=classroomReport(t,s,catalog,'เปลี่ยน SOURCE และ Input โดยไม่ถอดสาย');
  assert.equal(r.complete,true);assert.equal(r.completedStages,4);assert.equal(r.proofs.length,4);
  assert.equal(r.settings.displayInput,s.displayInput);assert.equal(r.reason,'เปลี่ยน SOURCE และ Input โดยไม่ถอดสาย');
  assert.equal('score' in r,false);assert.equal(JSON.stringify(catalog),before);
  r.links[0].cableId='vga';assert.equal(s.links[0].cableId,'hdmi');
});
