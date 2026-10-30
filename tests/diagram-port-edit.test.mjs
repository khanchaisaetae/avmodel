import test from 'node:test';
import assert from 'node:assert/strict';
import {createDiagramControls} from '../src/diagram-controls.mjs';
import {createDiagramState} from '../src/diagram-state.mjs';
import {reviewDiagram} from '../src/diagram-review.mjs';
import {readFileSync} from 'node:fs';
const catalog=JSON.parse(readFileSync(new URL('../data/port-catalog.json',import.meta.url)));
test('review, change existing endpoint, review again without adding a duplicate wire',()=>{
 const scope={catalog,state:{version:1,taskId:'2-01',reason:'',nodes:[{id:'dell',power:true,enabled:true},{id:'epson',power:true,input:'epson:hdmi1'}],links:[{id:'w1',from:'dell',to:'epson',sourcePortId:'dell:hdmi',sinkPortId:'epson:hdmi1',cableId:'hdmi'}]},history:[],future:[],copy:structuredClone,save(){},render(){},notice(){},$:()=>({close(){}})};
 scope.commit=createDiagramState(scope).commit;
 const controls=createDiagramControls(scope);
 scope.review=reviewDiagram(scope.state,catalog,'dell');assert.equal(scope.review.live.status,'ready');
 scope.picker={editLinkId:'w1'};controls.choosePort('epson','in','epson:hdmi2');
 assert.equal(scope.review,null);assert.equal(scope.state.links.length,1);assert.equal(scope.state.links[0].sinkPortId,'epson:hdmi2');
 scope.review=reviewDiagram(scope.state,catalog,'dell');assert.equal(scope.review.live.code,'WRONG_INPUT');
 scope.picker={editLinkId:'w1'};controls.choosePort('epson','in','epson:hdmi1');
 assert.equal(reviewDiagram(scope.state,catalog,'dell').live.status,'ready');assert.equal(scope.state.links.length,1);
});
