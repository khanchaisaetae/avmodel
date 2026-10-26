import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createDiagramState} from '../src/diagram-state.mjs';
import {createDiagramStorage} from '../src/diagram-storage.mjs';
import {createLessonState} from '../src/lesson-state.mjs';
import {emptyDiagram,getDiagramTask,parseDiagram} from '../src/diagram-data.mjs';
import {initialScenario,updateSegmentSelection} from '../src/scenario-engine.mjs';
import {SCENARIOS} from '../src/scenario-catalog.mjs';
const catalog=JSON.parse(readFileSync(new URL('../data/port-catalog.json',import.meta.url)));
test('separate editor instances do not share state or undo history',()=>{
 const make=()=>({state:emptyDiagram(),history:[],future:['old redo'],selection:null,review:{old:true},copy:structuredClone,getDiagramTask,save(){},render(){}}),a=make(),b=make(),aa=createDiagramState(a),bb=createDiagramState(b);
 aa.addDevice('dell');bb.addDevice('epson');aa.moveNode('dell',100,50);
 assert.deepEqual(a.state.nodes.map(n=>n.id),['dell']);assert.deepEqual(b.state.nodes.map(n=>n.id),['epson']);assert.equal(a.state.nodes[0].x,150);assert.equal(b.state.nodes[0].x,50);assert.equal(a.history.length,2);assert.equal(b.history.length,1);assert.deepEqual(a.history[0].nodes,[]);assert.deepEqual(a.future,[]);assert.equal(a.review,null);
});
test('diagram storage preserves prior format and keys but restores only after explicit resume',()=>{
 const before=globalThis.localStorage,values=new Map(),messages=[],controls=new Map();globalThis.localStorage={setItem:(k,v)=>values.set(k,v),getItem:k=>values.get(k)||null};
 try{const old={...emptyDiagram(),reason:'งานเดิมของนิสิต'},scope={state:emptyDiagram(),history:[],future:[],storagePrefix:'av-port-lab.diagram.v1.',catalog,parseDiagram,emptyDiagram,notice:m=>messages.push(m),render(){},$(id){if(!controls.has(id))controls.set(id,{textContent:''});return controls.get(id);}},api=createDiagramStorage(scope);
  scope.state=api.loadTask('2-01');scope.state=old;api.save();const raw=values.get('av-port-lab.diagram.v1.2-01');assert.deepEqual(JSON.parse(raw),old);
  scope.state=api.loadTask('2-01');assert.deepEqual(scope.state,emptyDiagram());assert.equal(controls.get('diagram-resume').hidden,false);assert.equal(values.get('av-port-lab.diagram.v1.2-01'),raw);
  api.resumeTask();assert.deepEqual(scope.state,old);assert.equal(controls.get('diagram-resume').hidden,true);assert.deepEqual(api.loadTask('2-02'),emptyDiagram('2-02'));assert.equal(controls.get('diagram-resume').hidden,true);
 }finally{if(before===undefined)delete globalThis.localStorage;else globalThis.localStorage=before;}
});
test('lesson controller updates current state through injected dependencies and keeps prior snapshots',()=>{
 const task=SCENARIOS[0];let current=initialScenario(task),renders=0;const scope={task,catalog,activeSegment:0,histories:new Map(),stateKey:()=>task.id+':practice',getState:()=>current,put:s=>{current=s;},clone:structuredClone,render:()=>renders++,lastResult:{old:true},assessmentReviewed:true,updateSegmentSelection},api=createLessonState(scope);
 api.pickPort('dell','dell:hdmi','out');api.pickPort('epson','epson:hdmi2','in');api.changeLink(0,{cableId:'hdmi'});
 assert.equal(current.links[0].connected,true);assert.equal(scope.lastResult.status,'compatible');assert.equal(scope.assessmentReviewed,false);assert.equal(scope.histories.get(scope.stateKey()).length,3);assert.equal(scope.histories.get(scope.stateKey())[0].state.links[0].sourcePortId,'');assert.ok(renders>=3);
});
test('feature modules import in Node without mounting a page or requiring browser globals',async()=>{
 const dir=new URL('../src/',import.meta.url),files=readdirSync(dir).filter(n=>/^(explorer-|lesson-|diagram-|classroom-|troubleshoot-|transfer-|project-)/.test(n)&&n.endsWith('.mjs')&&!['diagram-editor.mjs'].includes(n));
 for(const name of files)await import(new URL(name,dir));assert.ok(files.length>=25);
});
test('every relative module dependency resolves and the static import graph has no cycles',()=>{
 const dir=new URL('../src/',import.meta.url),files=readdirSync(dir).filter(n=>n.endsWith('.mjs')),graph=new Map();
 for(const name of files){const url=new URL(name,dir),source=readFileSync(url,'utf8'),deps=[...source.matchAll(/(?:from\s*|import\s*)['"](\.\.?\/[^'"]+)['"]/g)].map(m=>new URL(m[1].split('?')[0],url));for(const dep of deps)assert.ok(existsSync(fileURLToPath(dep)),name+' missing '+dep.pathname);graph.set(url.pathname,deps.map(d=>d.pathname));}
 const visited=new Set(),active=new Set();function visit(file){assert.ok(!active.has(file),'circular import at '+file);if(visited.has(file))return;active.add(file);for(const dep of graph.get(file)||[])visit(dep);active.delete(file);visited.add(file);}for(const file of graph.keys())visit(file);
});
test('diagram-model facade preserves the original public API identities',async()=>{const api=await import('../src/diagram-model.mjs'),data=await import('../src/diagram-data.mjs?v=20261025-placement'),review=await import('../src/diagram-review.mjs'),output=await import('../src/diagram-export.mjs');assert.equal(api.parseDiagram,data.parseDiagram);assert.equal(api.reviewDiagram,review.reviewDiagram);assert.equal(api.exportDiagramSvg,output.exportDiagramSvg);});
test('lesson shell initializes all reviewed task options using its injected element lookup',async()=>{
 const {createLessonShell}=await import('../src/lesson-shell.mjs'),before=globalThis.document,selected=[];globalThis.document={body:{append(){}}};
 const create=()=>({setAttribute(){},append(...items){this.children.push(...items);},children:[]}),table={},pane={};
 try{const shell=createLessonShell({table,pane,create,SCENARIOS,$:id=>{assert.equal(id,'scenario-select');return {append:group=>selected.push(group)};}});assert.deepEqual(Object.keys(shell).sort(),['model','picker','pop','reset']);assert.equal(selected.flatMap(g=>g.children).length,18);assert.ok(table.innerHTML.includes('connection-board'));assert.ok(pane.innerHTML.includes('target-source'));}finally{if(before===undefined)delete globalThis.document;else globalThis.document=before;}
});
test('moving into the extended grid persists coordinates beyond the old limits and stays undoable',()=>{
 let began=0;
 const scope={state:emptyDiagram(),history:[],future:[],selection:null,review:null,copy:structuredClone,getDiagramTask,save(){},render(){},workspace:{beginMove(){began++;}}};
 const api=createDiagramState(scope);api.addDevice('dell');api.moveNode('dell',1400,1200);
 const loaded=parseDiagram(JSON.parse(JSON.stringify(scope.state)),catalog);
 assert.equal(loaded.nodes[0].x,1450);assert.equal(loaded.nodes[0].y,1250);assert.equal(began,1);
 assert.deepEqual(scope.history.at(-1).nodes.map(n=>[n.x,n.y]),[[50,50]]);
 api.moveNode('dell',-2000,-2000);assert.deepEqual(scope.state.nodes.map(n=>[n.x,n.y]),[[0,0]]);
});
