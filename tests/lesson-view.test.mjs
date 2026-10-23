import test from 'node:test';
import assert from 'node:assert/strict';
import {SCENARIOS} from '../src/scenario-catalog.mjs';
import {initialScenario} from '../src/scenario-engine.mjs';
import {systemLayout,visibleSignalSegments,issueLocation} from '../src/lesson-view.mjs';
const task=SCENARIOS.find(t=>t.id==='4-01');
const wired=()=>{const s=initialScenario(task);s.links=[{sourcePortId:'dell:hdmi',sinkPortId:'vertex:hdmi-in',connected:true},{sourcePortId:'vertex:hdmi-out',sinkPortId:'epson:hdmi1',connected:true},{sourcePortId:'bluray:hdmi1',sinkPortId:'epson:hdmi2',connected:true}];s.displayInput='epson:hdmi1';return s;};
test('all 18 layouts contain each physical device exactly once with distinct positions inside the board',()=>{
 for(const t of SCENARIOS){const layout=systemLayout(t);assert.deepEqual(Object.keys(layout).sort(),[...t.devices].sort());assert.equal(new Set(Object.values(layout).map(v=>v.join(','))).size,t.devices.length);for(const [x,y]of Object.values(layout)){assert.ok(x>=100&&x<=900);assert.ok(y>=100&&y<=400);}}
});
test('pass-through highlight contains both used segments but not the inactive second source cable',()=>assert.deepEqual(visibleSignalSegments(task,wired(),{imageVisible:true,actualSource:'dell'}),[0,1]));
test('switching to the direct source highlights only its actual cable',()=>{const s=wired();s.displayInput='epson:hdmi2';assert.deepEqual(visibleSignalSegments(task,s,{imageVisible:true,actualSource:'bluray'}),[2]);});
test('wrong-source CAMERA picture highlights only the Vertex output, not the Dell input cable',()=>assert.deepEqual(visibleSignalSegments(task,wired(),{imageVisible:true,actualSource:'vertex'}),[1]));
test('no image never paints a complete live route',()=>assert.deepEqual(visibleSignalSegments(task,wired(),{imageVisible:false,actualSource:'dell'}),[]));
test('wrong-source guidance points to Vertex when the display input already matches the target route',()=>assert.deepEqual(issueLocation(task,wired(),{status:'wrong_source',code:'WRONG_SOURCE'}),{step:1,device:'vertex'}));
test('wrong-source guidance points to the screen when the other input was selected',()=>{const s=wired();s.displayInput='epson:hdmi2';assert.deepEqual(issueLocation(task,s,{status:'wrong_source',code:'WRONG_SOURCE'}),{step:1,device:'epson'});});
test('incomplete wiring guidance returns the missing branch; successful signal gives no error target',()=>{const s=wired();s.links[2].connected=false;assert.deepEqual(issueLocation(task,s,{status:'no_image',code:'INCOMPLETE_SYSTEM'}),{step:0,segment:2});assert.equal(issueLocation(task,s,{status:'ready'}),null);});
