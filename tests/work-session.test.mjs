import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorkSession} from '../src/work-session.mjs';
function fixture(){const values=new Map([['a',JSON.stringify({answer:'old'})],['b',JSON.stringify({answer:'other'})]]),calls=[];const session=createWorkSession({storage:{getItem:k=>{calls.push(['read',k]);return values.get(k);},setItem:(k,v)=>{calls.push(['write',k]);values.set(k,v);}},parse:v=>{if(typeof v?.answer!=='string')throw Error('invalid');return v;},hasWork:v=>!!v.answer});return {values,calls,session};}
test('opening only offers a validated snapshot and never writes or supplies an automatic answer',()=>{
 const {session,values,calls}=fixture();session.open('a');assert.equal(session.available,true);assert.deepEqual(calls,[['read','a']]);assert.equal(JSON.parse(values.get('a')).answer,'old');
 const saved=session.resume();assert.equal(saved.answer,'old');assert.equal(session.available,false);assert.equal(session.resume(),null);saved.answer='changed';assert.equal(JSON.parse(values.get('a')).answer,'old');
});
test('blank startup/check preserves old work; explicit reset replaces it',()=>{
 const {session,values}=fixture();session.open('a');assert.equal(session.save({answer:''}),false);assert.equal(session.available,true);assert.equal(JSON.parse(values.get('a')).answer,'old');
 session.save({answer:''},{force:true});assert.equal(session.available,false);session.open('a');assert.equal(session.available,false);
});
test('editing starts a new saved assignment and task switching keeps recovery isolated',()=>{
 const {session,values}=fixture();session.open('a');session.save({answer:'new'});assert.equal(session.available,false);session.open('b');assert.equal(session.resume().answer,'other');session.open('a');assert.equal(session.resume().answer,'new');assert.equal(JSON.parse(values.get('b')).answer,'other');
});
test('assessment never reads, restores or overwrites practice recovery',()=>{
 const {session,values,calls}=fixture();session.open('a',{assessment:true});assert.equal(session.available,false);assert.equal(session.resume(),null);assert.equal(session.save({answer:'exam'}),false);assert.equal(session.save({answer:''},{force:true}),false);assert.deepEqual(calls,[]);assert.equal(JSON.parse(values.get('a')).answer,'old');
});
test('bad or unavailable storage starts without a recovery offer',()=>{
 for(const raw of ['bad json','{}','{"answer":""}']){const session=createWorkSession({storage:{getItem:()=>raw},parse:v=>{if(typeof v.answer!=='string')throw Error('bad');return v;},hasWork:v=>!!v.answer});session.open('a');assert.equal(session.available,false);}
 const session=createWorkSession({storage:{getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}},parse:v=>v,hasWork:()=>true});session.open('a');assert.equal(session.available,false);assert.throws(()=>session.save({answer:'new'}),/blocked/);
});

import {createLessonTasks} from '../src/lesson-tasks.mjs';
import {SCENARIOS} from '../src/scenario-catalog.mjs';
import {initialScenario} from '../src/scenario-engine.mjs';
test('reopening an assessment task drops its old answer, explanation and undo history',()=>{
 const states=new Map(),histories=new Map(),reasons=new Map();
 const controls=new Map();const scope={task:SCENARIOS[0],learningMode:'assessment',states,histories,reasons,SCENARIOS,initialScenario,activeSegment:1,lastResult:{complete:true},assessmentReviewed:true,
  stateKey(){return this.task.id+':'+this.learningMode;},put(s){states.set(this.stateKey(),s);},$(id){if(!controls.has(id))controls.set(id,{});return controls.get(id);},closeContext(){},closeModel(){},buildBoard(){},render(){}};
 const key=scope.stateKey(),old=initialScenario(scope.task);old.power.dell=true;old.links[0].sourcePortId='dell:hdmi';states.set(key,old);histories.set(key,[old]);reasons.set(key,'previous explanation');
 createLessonTasks(scope).chooseTask(scope.task.id);
 assert.deepEqual(states.get(key),initialScenario(scope.task));assert.equal(reasons.has(key),false);assert.equal(histories.has(key),false);assert.equal(scope.assessmentReviewed,false);
});
