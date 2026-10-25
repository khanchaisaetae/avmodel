import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SCENARIOS} from '../src/scenario-catalog.mjs';
import {initialScenario,evaluateScenario,checkScenario} from '../src/scenario-engine.mjs';
import {LAB3D_KEY,selectLabPort,selectLabCable,labPackage,parseLabPackage} from '../src/lab3d-model.mjs';
const catalog=JSON.parse(readFileSync(new URL('../data/port-catalog.json',import.meta.url)));
function wired(task){
 let state=initialScenario(task);const used={};
 task.segments.forEach((seg,i)=>{
  const out={dell:'dell:hdmi',bluray:'bluray:hdmi1',vertex:'vertex:hdmi-out'}[seg.from];
  used[seg.to]=(used[seg.to]||0)+1;
  const sink=seg.to==='vertex'?'vertex:hdmi-in':seg.to==='epson'?'epson:hdmi'+used[seg.to]:used[seg.to]===1?'tv:hdmi-rear':'tv:hdmi-side';
  state=selectLabPort(task,state,i,'out',out,catalog).state;state=selectLabPort(task,state,i,'in',sink,catalog).state;state=selectLabCable(task,state,i,'hdmi',catalog).state;
 });
 state.power=Object.fromEntries(task.devices.map(id=>[id,true]));state.sourceEnabled=Object.fromEntries(Object.keys(state.sourceEnabled).map(id=>[id,true]));state.vertexSource=['pass','merge'].includes(task.type)?'HDMI IN':'CAMERA';state.displayInput=state.links[task.routes[0].segments.at(-1)].sinkPortId;return state;
}
for(const task of SCENARIOS)test('3D '+task.id+' uses the reviewed engine and survives export/import',()=>{
 const state=wired(task),before=JSON.stringify(state),packet=labPackage(task,state),parsed=parseLabPackage(JSON.parse(JSON.stringify(packet)),SCENARIOS,catalog);
 assert.equal(evaluateScenario(task,parsed.state,catalog).status,'ready');assert.equal(parsed.state.links.length,task.segments.length);assert.equal(JSON.stringify(state),before);
 let current=state;for(const source of task.sources){const route=task.routes.find(r=>r.source===source);current={...current,requestedSource:source,displayInput:current.links[route.segments.at(-1)].sinkPortId};const checked=checkScenario(task,current,catalog);assert.equal(checked.result.status,'ready');current=checked.state;}
 assert.equal(current.observedSources.length,task.sources.length);
 assert.deepEqual(parseLabPackage(labPackage(task,current),SCENARIOS,catalog).state.observedSources,current.observedSources);
});
test('3D selections keep state isolated and reject unknown or foreign endpoints',()=>{
 const task=SCENARIOS[0],state=initialScenario(task),before=JSON.stringify(state);selectLabPort(task,state,0,'out','dell:hdmi',catalog);assert.equal(JSON.stringify(state),before);assert.notEqual(LAB3D_KEY,'av-port-lab.scenario-progress.v1');
 for(const args of [[9,'out','dell:hdmi'],[0,'out','bluray:hdmi1'],[0,'in','epson:unknown'],[0,'both','dell:hdmi']])assert.throws(()=>selectLabPort(task,state,...args,catalog));assert.throws(()=>selectLabCable(task,state,0,'magic',catalog));
});
test('3D import recomputes connections and rejects malformed files without trusting ready flags',()=>{
 const task=SCENARIOS[0],packet=labPackage(task,initialScenario(task));packet.state.links[0].connected=true;packet.state.observedSources=['dell'];assert.equal(parseLabPackage(packet,SCENARIOS,catalog).state.links[0].connected,false);assert.deepEqual(parseLabPackage(packet,SCENARIOS,catalog).state.observedSources,[]);
 for(const patch of [{schema:'other'},{version:99},{taskId:'matrix'},{state:{links:[]}}])assert.throws(()=>parseLabPackage({...packet,...patch},SCENARIOS,catalog));
});
test('3D keeps unsupported adapters indeterminate and rejects audio-only HDMI for image',()=>{
 const task=SCENARIOS[0];let state=selectLabPort(task,wired(task),0,'out','dell:usb-c',catalog).state;state=selectLabCable(task,state,0,'usb-c-hdmi',catalog).state;assert.equal(state.links[0].connected,false);
 const blu=SCENARIOS.find(t=>t.id==='2-03');const r=selectLabPort(blu,wired(blu),0,'out','bluray:hdmi2',catalog);assert.equal(r.result.code,'NO_VIDEO');assert.equal(r.state.links[0].connected,false);
});
