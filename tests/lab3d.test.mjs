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

const {defaultLabPositions,parseLabPositions,moveLabDevice,LAB_TABLE_LIMIT}=await import('../src/lab3d-layout.mjs');
test('old 3D files receive default positions and moved positions survive JSON without altering signals',()=>{
 const task=SCENARIOS.find(t=>t.id==='4-01'),state=wired(task),packet=labPackage(task,state);delete packet.state.positions;
 assert.deepEqual(parseLabPackage(packet,SCENARIOS,catalog).state.positions,defaultLabPositions(task));
 const before=structuredClone(state),moved=moveLabDevice(state,task,'dell',4.5,-2.25),parsed=parseLabPackage(labPackage(task,moved),SCENARIOS,catalog);
 assert.deepEqual(state,before);assert.deepEqual(parsed.state.positions.dell,{x:4.5,z:-2.25});assert.deepEqual(moved.links,state.links);assert.deepEqual(moved.power,state.power);assert.equal(evaluateScenario(task,moved,catalog).status,evaluateScenario(task,state,catalog).status);
 const afterCable=selectLabCable(task,moved,0,'hdmi',catalog).state;assert.deepEqual(afterCable.positions,moved.positions);
});
test('table movement stays on the table and rejects unknown or invalid positions',()=>{
 const task=SCENARIOS[0],state=initialScenario(task);assert.deepEqual(moveLabDevice(state,task,'dell',99,-99).positions.dell,{x:LAB_TABLE_LIMIT,z:-LAB_TABLE_LIMIT});
 for(const args of [['matrix',0,0],['dell',NaN,0],['dell',0,Infinity]])assert.throws(()=>moveLabDevice(state,task,...args));
 for(const value of [null,[],{dell:{x:0,z:0}},{...defaultLabPositions(task),matrix:{x:0,z:0}},{...defaultLabPositions(task),dell:{x:13,z:0}},{...defaultLabPositions(task),dell:{x:0,z:'0'}}])assert.throws(()=>parseLabPositions(value,task));
});
test('layout-only undo and reset preserve the latest connection and device settings',()=>{
 const task=SCENARIOS[0],state=wired(task),old=defaultLabPositions(task),moved=moveLabDevice(state,task,'epson',2,3),latest={...moved,power:{...moved.power,dell:false}};
 const undone={...latest,positions:old};assert.equal(undone.power.dell,false);assert.deepEqual(undone.links,state.links);assert.deepEqual(undone.positions,old);
 const packet=labPackage(task,latest);packet.state.positions.epson.x=Infinity;assert.throws(()=>parseLabPackage(packet,SCENARIOS,catalog));
});

import {plugTypes,checkPlugDrop} from '../src/lab3d-plugs.mjs';
import {WIRE_CHOICES} from '../src/lesson-cables.mjs';
const physical=(task,state,index,side,id,cableId='hdmi')=>checkPlugDrop({task,state,index,side,port:catalog.devices.flatMap(d=>d.ports).find(p=>p.id===id),cable:WIRE_CHOICES.find(c=>c.id===cableId)});
test('all cable choices specify both physical heads including directional adapters',()=>{
 for(const c of WIRE_CHOICES)assert.equal(plugTypes(c).length,2,c.id);
 assert.deepEqual(plugTypes(WIRE_CHOICES.find(c=>c.id==='usb-c-hdmi')),['usb_c','hdmi']);
});
test('plug fit rejects mismatched sockets and wrong devices without changing existing work',()=>{
 const t=SCENARIOS[0],s=wired(t),before=JSON.stringify(s);
 assert.equal(physical(t,s,0,'out','dell:hdmi').ok,true);
 assert.equal(physical(t,s,0,'out','dell:usb-a-1').ok,false);
 assert.equal(physical(t,s,0,'out','epson:hdmi1').ok,false);
 assert.equal(physical(t,s,0,'in',null).ok,false);
 assert.equal(JSON.stringify(s),before);
});
test('occupied physical ports are reserved even on an unvalidated or unsupported cable',()=>{
 const t=SCENARIOS.find(t=>t.id==='3-05'),s=initialScenario(t);
 s.links[0]={sourcePortId:'dell:hdmi',sinkPortId:'epson:hdmi1',cableId:'hdmi-vga',connected:false};
 assert.equal(physical(t,s,1,'in','epson:hdmi1').ok,false);
 assert.equal(physical(t,s,1,'in','epson:hdmi2').ok,true);
});
test('physical insertion allows audio-only HDMI and wrong signal direction for diagnosis',()=>{
 const t=SCENARIOS.find(t=>t.id==='2-03'),s=initialScenario(t);
 assert.equal(physical(t,s,0,'out','bluray:hdmi2').ok,true);
 let next=selectLabCable(t,s,0,'hdmi',catalog).state;
 next=selectLabPort(t,next,0,'out','bluray:hdmi2',catalog).state;
 next=selectLabPort(t,next,0,'in','epson:hdmi1',catalog).state;
 assert.equal(next.links[0].connected,false);
 assert.equal(physical(SCENARIOS.find(t=>t.id==='3-01'),initialScenario(SCENARIOS.find(t=>t.id==='3-01')),0,'in','vertex:hdmi-out').ok,true);
});
test('USB and directional adapter heads fit their own ends only',()=>{
 const t=SCENARIOS[0],s=initialScenario(t);
 assert.equal(physical(t,s,0,'out','dell:usb-a-1','usb').ok,true);
 assert.equal(physical(t,s,0,'in','epson:usb-b','usb').ok,true);
 assert.equal(physical(t,s,0,'in','epson:usb-a','usb').ok,false);
 assert.equal(physical(t,s,0,'out','dell:usb-c','usb-c-hdmi').ok,true);
 assert.equal(physical(t,s,0,'out','dell:hdmi','usb-c-hdmi').ok,false);
});
test('detaching one head persists as a partial cable and preserves device positions/settings',()=>{
 const t=SCENARIOS[0],s=wired(t);s.positions={dell:{x:-1,z:2},epson:{x:3,z:1}};
 const partial={...s,observedSources:[],links:s.links.map(l=>({...l,sinkPortId:'',connected:false}))};
 const restored=parseLabPackage(JSON.parse(JSON.stringify(labPackage(t,partial))),SCENARIOS,catalog).state;
 assert.equal(restored.links[0].sourcePortId,'dell:hdmi');assert.equal(restored.links[0].sinkPortId,'');assert.equal(restored.links[0].cableId,'hdmi');assert.equal(restored.links[0].connected,false);
 assert.deepEqual(restored.positions,s.positions);assert.deepEqual(restored.power,s.power);assert.deepEqual(restored.sourceEnabled,s.sourceEnabled);
});

import {resolvePlugDrop} from '../src/lab3d-plugs.mjs';
function infer(t,s,index,side,id){return resolvePlugDrop({task:t,state:s,index,side,port:catalog.devices.flatMap(d=>d.ports).find(p=>p.id===id),cable:WIRE_CHOICES.find(c=>c.id===s.links[index].cableId)});}
test('3D infers every branch from device ports without a branch selector',()=>{
 for(const t of SCENARIOS){let s=initialScenario(t);for(let target=t.segments.length-1;target>=0;target--){
  const empty=s.links.findIndex(l=>!l.sourcePortId&&!l.sinkPortId);s=selectLabCable(t,s,empty,'hdmi',catalog).state;
  const source={dell:'dell:hdmi',bluray:'bluray:hdmi1',vertex:'vertex:hdmi-out'}[t.segments[target].from];
  const fit=infer(t,s,empty,'out',source);assert.equal(fit.ok,true,t.id);assert.equal(fit.index,target,t.id);
  s=selectLabPort(t,fit.state,fit.index,'out',source,catalog).state;
  const to=t.segments[target].to,used=s.links.filter(l=>l.sinkPortId.startsWith(to+':')).length;
  const sink=to==='vertex'?'vertex:hdmi-in':to==='epson'?'epson:hdmi'+(used+1):used?'tv:hdmi-side':'tv:hdmi-rear';
  const end=infer(t,s,target,'in',sink);assert.equal(end.ok,true,t.id);s=selectLabPort(t,end.state,end.index,'in',sink,catalog).state;
 }assert.ok(s.links.every(l=>l.connected),t.id);}
});
test('destination-first cable migrates to the inferred source branch without overwriting another cable',()=>{
 const t=SCENARIOS.find(t=>t.id==='3-05');let s=selectLabCable(t,initialScenario(t),0,'hdmi',catalog).state;
 s=selectLabPort(t,s,0,'in','epson:hdmi1',catalog).state;
 const fit=infer(t,s,0,'out','bluray:hdmi1');assert.equal(fit.ok,true);assert.equal(fit.index,1);assert.equal(fit.state.links[0].sinkPortId,'');assert.equal(fit.state.links[1].sinkPortId,'epson:hdmi1');
 const original=JSON.stringify(s);const bad=infer(t,s,0,'out','vertex:hdmi-out');assert.equal(bad.ok,false);assert.equal(JSON.stringify(s),original);
});

import {evaluateLabDisplay} from '../src/lab3d-display.mjs';
test('3D display observes every selected source without a target or mutating the saved work',()=>{
 for(const t of SCENARIOS){const s=wired(t);for(const source of t.sources){const route=t.routes.find(r=>r.source===source);s.displayInput=s.links[route.segments.at(-1)].sinkPortId;
  // A legacy target can disagree with the selected source; it must never constrain observation.
  s.requestedSource='legacy-unselected-source';const before=JSON.stringify(s),r=evaluateLabDisplay(t,s,catalog);
  assert.equal(r.status,'signal',t.id);assert.equal(r.actualSource,source,t.id);assert.equal(r.imageVisible,true);assert.equal(r.complete,false);assert.equal(JSON.stringify(s),before);
 }}
});
test('a working route displays even when another source branch is unplugged',()=>{
 const t=SCENARIOS.find(t=>t.id==='3-05'),s=wired(t);s.links[1]={sourcePortId:'',sinkPortId:'',cableId:'',connected:false};
 const r=evaluateLabDisplay(t,s,catalog);assert.equal(r.imageVisible,true);assert.equal(r.actualSource,'dell');assert.equal(r.status,'signal');assert.doesNotMatch(r.message,/เป้าหมาย|ครบ|ผิด/);
});
test('Vertex camera and pass-through follow its device SOURCE switch rather than task target',()=>{
 const t=SCENARIOS.find(t=>t.id==='3-01'),s=wired(t);s.vertexSource='CAMERA';s.requestedSource='dell';s.links[0]={sourcePortId:'',sinkPortId:'',cableId:'',connected:false};
 assert.equal(evaluateLabDisplay(t,s,catalog).actualSource,'vertex');
 s.vertexSource='HDMI IN';assert.equal(evaluateLabDisplay(t,s,catalog).imageVisible,false);
 s.vertexSource='PC1';assert.equal(evaluateLabDisplay(t,s,catalog).imageVisible,false);
});
test('TV and projector power, wrong input and unsupported cables never produce invented pictures',()=>{
 for(const id of ['2-01','2-02']){const t=SCENARIOS.find(t=>t.id===id),s=wired(t);s.power[t.displayId]=false;assert.equal(evaluateLabDisplay(t,s,catalog).status,'off');
  s.power[t.displayId]=true;s.displayInput='';assert.equal(evaluateLabDisplay(t,s,catalog).imageVisible,false);
  s.displayInput=s.links[0].sinkPortId;s.links[0].cableId='usb-c-hdmi';s.links[0].connected=false;
  const r=evaluateLabDisplay(t,s,catalog);assert.equal(r.status,'indeterminate');assert.equal(r.imageVisible,false);
 }
});
