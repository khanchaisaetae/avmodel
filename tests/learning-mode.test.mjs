import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SCENARIOS} from '../src/scenario-catalog.mjs';
import {initialScenario,updateSegmentSelection} from '../src/scenario-engine.mjs';
import {reviewLearning} from '../src/learning-mode.mjs';
const catalog=JSON.parse(readFileSync(new URL('../data/port-catalog.json',import.meta.url))),task=SCENARIOS[0];
function ready(){let s=initialScenario(task);s=updateSegmentSelection(task,s,0,{sourcePortId:'dell:hdmi',sinkPortId:'epson:hdmi1',cableId:'hdmi'},catalog).state;return {...s,power:{dell:true,epson:true},sourceEnabled:{dell:true},displayInput:'epson:hdmi1'};}
test('practice records a successful picture once, including repeated UI renders',()=>{const a=reviewLearning(task,ready(),catalog,'practice');assert.equal(a.result.complete,true);assert.deepEqual(a.state.observedSources,['dell']);assert.equal(a.state.attempts,1);const b=reviewLearning(task,a.state,catalog,'practice');assert.equal(b.state.attempts,1);assert.equal(b.result.complete,true);});
test('assessment neither reveals feedback nor records a source before submission',()=>{const s=ready(),r=reviewLearning(task,s,catalog,'assessment');assert.equal(r.result,null);assert.equal(r.state,s);assert.deepEqual(s.observedSources,[]);});
test('assessment requires an explanation and never mutates an unsubmitted answer',()=>{const s=ready(),r=reviewLearning(task,s,catalog,'assessment',{submitted:true,reason:'  สาย  '});assert.equal(r.needsReason,true);assert.equal(r.state,s);assert.equal(r.result,null);});
test('assessment checks only after explicit submission with an explanation',()=>{const r=reviewLearning(task,ready(),catalog,'assessment',{submitted:true,reason:'ส่งภาพจาก HDMI OUT ของ Dell เข้าช่อง HDMI1 ของ Epson'});assert.equal(r.result.complete,true);assert.deepEqual(r.state.observedSources,['dell']);});
test('a wrong input remains unsuccessful in assessment and exposes feedback after submission',()=>{const s={...ready(),displayInput:'epson:hdmi2'},r=reviewLearning(task,s,catalog,'assessment',{submitted:true,reason:'เลือกช่องรับภาพบนโปรเจกเตอร์เพื่อแสดงภาพ'});assert.equal(r.result.complete,false);assert.equal(r.result.code,'WRONG_INPUT');assert.deepEqual(r.state.observedSources,[]);});
test('practice gives immediate troubleshooting without counting an unsuccessful attempt',()=>{const s=initialScenario(task),r=reviewLearning(task,s,catalog,'practice');assert.equal(r.result.code,'DISPLAY_OFF');assert.equal(r.state.attempts,0);});
for(const mode of ['practice','assessment'])test(mode+' requires both sources in a four-device system',()=>{
 const t=SCENARIOS.find(t=>t.id==='4-01');let s=initialScenario(t);s.power=Object.fromEntries(t.devices.map(id=>[id,true]));s.sourceEnabled={dell:true,bluray:true};s.vertexSource='HDMI IN';
 for(const [index,sourcePortId,sinkPortId]of [[0,'dell:hdmi','vertex:hdmi-in'],[1,'vertex:hdmi-out','epson:hdmi1'],[2,'bluray:hdmi1','epson:hdmi2']])s=updateSegmentSelection(t,s,index,{sourcePortId,sinkPortId,cableId:'hdmi'},catalog).state;
 s.displayInput='epson:hdmi1';const options={submitted:true,reason:'เลือก HDMI OUT ต่อ HDMI IN แล้วเลือก Input ให้ตรงกับแหล่งภาพ'};
 const first=reviewLearning(t,s,catalog,mode,options);assert.equal(first.result.complete,false);assert.deepEqual(first.state.observedSources,['dell']);
 s={...first.state,requestedSource:'bluray',displayInput:'epson:hdmi2'};
 if(mode==='assessment')assert.equal(reviewLearning(t,s,catalog,mode).result,null);
 const second=reviewLearning(t,s,catalog,mode,options);assert.equal(second.result.complete,true);assert.deepEqual(second.state.observedSources,['dell','bluray']);
});
