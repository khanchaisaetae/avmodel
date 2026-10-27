import test from 'node:test';
import assert from 'node:assert/strict';
import {canvasBounds,fitCanvas,worldDelta,arrangeDevices} from '../src/workspace-geometry.mjs';
import {ACTIVITIES} from '../src/workspace-ui.mjs';
test('fit includes all five devices instead of cropping the farthest node',()=>{
 const nodes=[{x:50,y:50,width:200,height:320},{x:430,y:50,width:200,height:360},{x:820,y:70,width:200,height:340},{x:50,y:430,width:200,height:320},{x:430,y:430,width:200,height:340}];
 const b=canvasBounds(nodes),scale=fitCanvas(b,700,620);
 assert.ok(b.width*scale<=700);assert.ok(b.height*scale<=620);
 for(const n of nodes){assert.ok((n.x+n.width-b.x)*scale<=700);assert.ok((n.y+n.height-b.y)*scale<=620);}
});
test('scaled pointer movement and endpoint deltas stay in world coordinates',()=>{for(const scale of [.4,.75,1,1.5]){assert.equal(worldDelta(120*scale,scale),120);assert.equal(worldDelta(-60*scale,scale),-60);}});
test('node bounds include cable labels and maintain a comfortable edge',()=>{const b=canvasBounds([{x:50,y:50,width:200,height:300},{x:270,y:220,width:140,height:40}],32);assert.equal(b.x,18);assert.ok(b.width>=424);assert.ok(b.height>=364-18);});
test('arranging is geometry only and preserves port choices, power and object identity outside the new positions',()=>{
 const old=[{id:'dell',x:800,y:600,power:true},{id:'epson',x:0,y:0,input:'epson:hdmi2'}],snapshot=JSON.stringify(old),next=arrangeDevices(old);
 assert.equal(JSON.stringify(old),snapshot);assert.equal(next[0].power,true);assert.equal(next[1].input,'epson:hdmi2');assert.notEqual(next[0],old[0]);assert.ok(next.every(n=>n.x>=0&&n.x<=960&&n.y>=0&&n.y<=680));
});
test('empty canvas and narrow screens produce bounded, usable scale values',()=>{assert.equal(fitCanvas(canvasBounds([]),2000,2000),1);const b=canvasBounds([]),scale=fitCanvas(b,120,100);assert.ok(scale>=.1&&b.width*scale<=120&&b.height*scale<=100);});
test('activity navigation has one stable route per use case',()=>{assert.deepEqual(ACTIVITIES.map(([url])=>url),['index.html','lab3d.html','diagram.html','troubleshoot.html']);assert.equal(new Set(ACTIVITIES.map(([url])=>url)).size,4);});
