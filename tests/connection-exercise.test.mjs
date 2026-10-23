import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {initialExercise,evaluateExercise,changeWiring,EXERCISE_MODE} from '../src/connection-exercise.mjs';
const catalog=JSON.parse(readFileSync(new URL('../data/port-catalog.json',import.meta.url)));
const ready=()=>({...initialExercise(),sourcePortId:'dell:hdmi',sinkPortId:'epson:hdmi2',cableId:'hdmi',connected:true,sourcePowered:true,sinkPowered:true,sourceVideoEnabled:true,selectedInputPortId:'epson:hdmi2'});
test('lesson can show a simulated image under explicit supplied timing, without changing reference facts',()=>{const before=JSON.stringify(catalog);assert.equal(catalog.devices[0].ports.find(p=>p.id==='dell:hdmi').supported_modes,null);const result=evaluateExercise(ready(),catalog);assert.equal(result.status,'ready');assert.equal(result.imageVisible,true);assert.equal(JSON.stringify(catalog),before);assert.equal(EXERCISE_MODE,'1280x800@60');});
test('both Epson HDMI inputs work when input selection matches the connected socket',()=>{for(const id of ['epson:hdmi1','epson:hdmi2'])assert.equal(evaluateExercise({...ready(),sinkPortId:id,selectedInputPortId:id},catalog).status,'ready');});
for(const[name,patch,code]of [
 ['new attempt',initialExercise(),'INCOMPLETE_SELECTION'],
 ['not plugged in',{connected:false},'NOT_CONNECTED'],
 ['Dell off',{sourcePowered:false},'POWER_OFF'],
 ['projector off',{sinkPowered:false},'POWER_OFF'],
 ['external display disabled',{sourceVideoEnabled:false},'OUTPUT_DISABLED'],
 ['wrong input',{selectedInputPortId:'epson:hdmi1'},'WRONG_INPUT'],
 ['wrong cable',{cableId:'vga'},'CABLE_CONNECTOR'],
 ['HDMI to VGA without conversion',{sinkPortId:'epson:computer1'},'CONVERSION_REQUIRED'],
 ['audio socket is not a video input',{sinkPortId:'epson:audio1'},'NOT_VIDEO_PORT'],
 ['wrong device pair',{sinkPortId:'tv:hdmi-rear'},'WRONG_DEVICE']
])test(name,()=>{const r=evaluateExercise({...ready(),...patch},catalog);assert.equal(r.code,code);assert.equal(r.imageVisible,false);});
test('USB-C video is explained as an unmodeled valid route, never scored as a mistake',()=>{const r=evaluateExercise({...ready(),sourcePortId:'dell:usb-c'},catalog);assert.equal(r.status,'indeterminate');assert.equal(r.gradable,false);assert.match(r.message,/ส่งภาพได้/);});
test('software USB display and configurable output keep their specific route requirements',()=>{for(const sinkPortId of ['epson:usb-b','epson:computer2-monitor','epson:hdbaset'])assert.equal(evaluateExercise({...ready(),sinkPortId},catalog).status,'indeterminate');});
test('connecting first verifies topology independently of power settings',()=>{const s={...initialExercise(),sourcePortId:'dell:hdmi',sinkPortId:'epson:hdmi1',cableId:'hdmi'};assert.equal(evaluateExercise(s,catalog,{scope:'topology'}).status,'compatible');assert.equal(evaluateExercise({...s,connected:true},catalog).code,'POWER_OFF');});
test('changing a port or cable requires reconnecting both ends',()=>{const s=changeWiring(ready(),{sinkPortId:'epson:hdmi1'});assert.equal(s.connected,false);assert.equal(evaluateExercise(s,catalog).code,'NOT_CONNECTED');});
