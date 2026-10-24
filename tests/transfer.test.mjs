import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SCENARIOS} from '../src/scenario-catalog.mjs';
import {emptyDiagram,reviewDiagram} from '../src/diagram-model.mjs';
import {initialScenario} from '../src/scenario-engine.mjs';
import {sampleReference,parseReference,referenceFromScenario,compareTransfer,drawingSignature,documentSignature,
 transferReadiness,transferReport,installationRows} from '../src/transfer-model.mjs';
const catalog=JSON.parse(readFileSync(new URL('../data/port-catalog.json',import.meta.url)));
function drawing(ref){
 const task=SCENARIOS.find(t=>t.id===ref.taskId),s=ref.state;
 return {...emptyDiagram(task.id),reason:'ต่อ OUT ไป IN ตามสายที่ตรวจ แล้วตั้งแหล่งภาพและ Input ให้ตรงกัน',
  nodes:task.devices.map((id,i)=>({id,x:i*200,y:30,power:s.power[id],enabled:s.sourceEnabled[id]||false,
   input:id===task.displayId?s.displayInput:'',source:id==='vertex'?s.vertexSource:'CAMERA'})),
  links:task.segments.map((seg,i)=>({id:'w'+(i+1),from:seg.from,to:seg.to,
   sourcePortId:s.links[i].sourcePortId,sinkPortId:s.links[i].sinkPortId,cableId:s.links[i].cableId}))};
}
for(const task of SCENARIOS)test('reference '+task.id+' is valid and accepts an independently positioned/reordered faithful diagram',()=>{
 const ref=sampleReference(task,catalog),d=drawing(ref),before=JSON.stringify(ref);
 assert.equal(compareTransfer(ref,d,catalog).matches,true);
 d.links.reverse();d.nodes.reverse();d.nodes.forEach(n=>{n.x=50;n.y=400;});
 assert.equal(compareTransfer(ref,d,catalog).matches,true);assert.equal(JSON.stringify(ref),before);
 assert.deepEqual(parseReference(JSON.parse(JSON.stringify(ref)),catalog),ref);
});
test('a working alternate input is accepted in UC3 but differs from the recorded UC6 system',()=>{
 const ref=sampleReference(SCENARIOS[0],catalog),d=drawing(ref);
 d.links[0].sinkPortId='epson:hdmi2';d.nodes.find(n=>n.id==='epson').input='epson:hdmi2';
 assert.equal(reviewDiagram(d,catalog,'dell').live.status,'ready');
 const r=compareTransfer(ref,d,catalog);assert.equal(r.matches,false);assert.ok(r.issues.some(x=>x.includes('C1')));
});
test('source changes, missing devices, extra wires and wrong settings cannot pass fidelity checks',()=>{
 const ref=sampleReference(SCENARIOS.find(t=>t.id==='4-01'),catalog);
 for(const edit of [d=>d.nodes.find(n=>n.id==='vertex').source='CAMERA',d=>d.nodes.pop(),
   d=>d.links.push({...d.links[0],id:'w99'}),d=>d.nodes[0].enabled=false,d=>d.taskId='2-01']){
  const d=drawing(ref);edit(d);assert.equal(compareTransfer(ref,d,catalog).matches,false);
 }
});
test('confirmation requires inspection, reason and an explicit check of the current drawing',()=>{
 const ref=sampleReference(SCENARIOS[0],catalog),d=drawing(ref),ids=d.nodes.map(n=>n.id),sig=drawingSignature(ref,d);
 assert.equal(transferReadiness(ref,d,catalog,[],sig).ready,false);
 assert.equal(transferReadiness(ref,d,catalog,ids,null).ready,false);
 const blank={...d,reason:''};assert.equal(transferReadiness(ref,blank,catalog,ids,sig).ready,false);
 assert.equal(transferReadiness(ref,d,catalog,ids,sig).ready,true);
 const confirmation=documentSignature(ref,d,ids),r=transferReport(ref,d,catalog,ids,sig,confirmation);
 assert.equal(r.confirmed,true);d.reason+=' เพิ่มวิธีตรวจภาพ';assert.equal(transferReport(ref,d,catalog,ids,sig,confirmation).confirmed,false);
});
test('moving nodes does not invalidate circuit checks; changing a port does',()=>{
 const ref=sampleReference(SCENARIOS[0],catalog),d=drawing(ref),sig=drawingSignature(ref,d);
 d.nodes[0].x=900;assert.equal(drawingSignature(ref,d),sig);
 d.links[0].sinkPortId='epson:hdmi2';assert.notEqual(drawingSignature(ref,d),sig);
});
test('practice handoff preserves the actual selected ports rather than generating a replacement answer',()=>{
 const task=SCENARIOS[0],ref=sampleReference(task,catalog),s=structuredClone(ref.state);
 s.links[0].sinkPortId='epson:hdmi2';s.displayInput='epson:hdmi2';
 const sent=referenceFromScenario(task,s,catalog,'sent-test');
 assert.equal(sent.state.links[0].sinkPortId,'epson:hdmi2');assert.equal(sent.origin,'practice');
 assert.equal(compareTransfer(sent,drawing(sent),catalog).matches,true);
 s.links[0].sinkPortId='bad';assert.equal(sent.state.links[0].sinkPortId,'epson:hdmi2');
 assert.throws(()=>referenceFromScenario(task,initialScenario(task),catalog,'sent-off'));
});
test('reference import rejects unsupported schemas, foreign ports, missing settings and unsupported routes',()=>{
 const ref=sampleReference(SCENARIOS[0],catalog);
 for(const edit of [r=>r.version=99,r=>r.taskId='4-10',r=>r.id='../bad',r=>r.state.links.push(r.state.links[0]),
  r=>r.state.links[0].sourcePortId='bluray:hdmi1',r=>r.state.links[0].cableId='magic',r=>delete r.state.power.epson,
  r=>r.state.requestedSource='vertex',r=>r.state.links[0].sourcePortId='dell:usb-c']){
  const r=structuredClone(ref);edit(r);assert.throws(()=>parseReference(r,catalog));
 }
});
test('report contains portable diagram, installation endpoints and manual-inspection claims without scores',()=>{
 const ref=sampleReference(SCENARIOS[0],catalog),d=drawing(ref),ids=d.nodes.map(n=>n.id);
 const before=JSON.stringify(catalog),rows=installationRows(d,catalog);assert.equal(rows[0].out,'HDMI');assert.match(rows[0].in,/HDMI1/);
 const report=transferReport(ref,d,catalog,ids,drawingSignature(ref,d),documentSignature(ref,d,ids));
 assert.equal(report.confirmed,true);assert.equal(report.installation.length,1);assert.equal('score' in report,false);
 report.diagram.nodes[0].power=false;report.reference.state.power.dell=false;assert.equal(d.nodes[0].power,true);assert.equal(ref.state.power.dell,true);
 assert.equal(JSON.stringify(catalog),before);
});
