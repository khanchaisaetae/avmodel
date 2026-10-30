import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {checkDiagramCable,DIAGRAM_CABLE_LABELS} from '../src/diagram-cable-rules.mjs';
import {WIRE_CHOICES} from '../src/lesson-cables.mjs';
import {reviewDiagram} from '../src/diagram-review.mjs';
const catalog=JSON.parse(readFileSync(new URL('../data/port-catalog.json',import.meta.url)));
const ports=new Map(catalog.devices.flatMap(d=>d.ports.map(p=>[p.id,p])));
const check=(c,a,b)=>checkDiagramCable({cableId:c,from:a.split(':')[0],to:b.split(':')[0]},ports.get(a),ports.get(b));
for(const [c,a,b,status] of [
 ['composite','vertex:v-out','epson:video','compatible'],['composite','bluray:coax','epson:video','invalid'],
 ['s-video','vertex:svideo-out','epson:video','invalid'],['s-video','vertex:svideo-out','vertex:svideo-in','compatible'],
 ['usb','dell:usb-a-1','epson:usb-b','compatible'],['usb','dell:usb-a-1','vertex:usb-b','indeterminate'],
 ['hdmi-vga','dell:hdmi','epson:computer1','compatible'],['hdmi-vga','vertex:rgb-out1','epson:hdmi1','invalid'],
 ['hdmi-vga','bluray:hdmi2','epson:computer1','invalid'],
 ['lan','dell:lan','epson:lan','indeterminate'],['lan','dell:lan','epson:hdbaset','invalid'],
 ['hdbaset','dell:lan','epson:hdbaset','invalid'],
 ['displayport','dell:hdmi','epson:hdmi1','invalid'],['usb-c-video','dell:usb-c','epson:usb-b','invalid'],['usb-c-dp','dell:usb-c','epson:hdmi1','invalid'],
 ['rca-audio','bluray:coax','epson:audio-l','invalid'],['audio-3.5','tv:headphone','epson:audio1','no_image'],
 ['phone-6.35','vertex:audio-out','vertex:mic','indeterminate'],['coax-audio','bluray:coax','epson:audio-l','invalid'],['optical-audio','tv:digital-audio','epson:audio1','invalid']
])test(`${c}: ${a} to ${b}`,()=>assert.equal(check(c,a,b)?.status,status));
test('every dropdown choice has a precise UC3 status',()=>{for(const c of WIRE_CHOICES)assert.ok(DIAGRAM_CABLE_LABELS[c.id]);});
function drawing(source,port,cable,input){return {taskId:'free',reason:'',nodes:[{id:source,power:true,enabled:true},{id:'epson',power:true,input}],links:[{id:'w1',from:source,to:'epson',sourcePortId:port,sinkPortId:input,cableId:cable}]};}
test('USB wiring never invents installed software',()=>assert.equal(reviewDiagram(drawing('dell','dell:usb-a-1','usb','epson:usb-b'),catalog).displayResults[0].code,'SOFTWARE_STATE_UNKNOWN'));
test('Blu-ray converter never promises an HDCP picture',()=>assert.equal(reviewDiagram(drawing('bluray','bluray:hdmi1','hdmi-vga','epson:computer1'),catalog).displayResults[0].code,'HDCP_UNKNOWN'));
test('composite connector success does not invent Vertex output routing',()=>{const d=drawing('vertex','vertex:v-out','composite','epson:video');d.nodes[0].source='CAMERA';assert.equal(reviewDiagram(d,catalog).displayResults[0].code,'ANALOG_SOURCE_MODE');});
