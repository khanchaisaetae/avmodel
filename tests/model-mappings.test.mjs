import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateCalibration,mappingCounts} from '../src/mapping-model.mjs';
import {sha256Fallback} from '../src/asset-hash.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url));
const baseline=JSON.parse(read('data/model-mappings.json')),catalog=JSON.parse(read('data/port-catalog.json'));
const sample=()=>({schema_version:'1.0.0',mappings:{'vertex:rgb-out2':structuredClone(baseline.mappings['vertex:rgb-out2'])}});
test('53 port positions belong to reference ports; only internal WLAN is unexposed',()=>{
 const ids=new Set(catalog.devices.flatMap(d=>d.ports.map(p=>p.id)));assert.equal(Object.keys(baseline.mappings).length,53);
 const unmatched=[...ids].filter(id=>!baseline.mappings[id]);assert.deepEqual(unmatched,['epson:usb-wlan']);assert.equal(baseline.unmapped[unmatched[0]].status,'not_exposed_in_model');
 for(const[id,m]of Object.entries(baseline.mappings)){assert.ok(ids.has(id));const asset=baseline.assets[id.split(':')[0]];assert.equal(m.asset_sha256,asset.sha256);assert.ok(m.node_index>=0&&m.node_index<asset.node_count);assert.ok(m.anchor.every(Number.isFinite));assert.equal(Math.hypot(...m.normal),1);m.anchor.forEach((v,i)=>assert.ok(v>=m.bounds_scene.min[i]-1e-9&&v<=m.bounds_scene.max[i]+1e-9));assert.ok(m.review_scope);}
});
test('calibrations are pinned to exact GLTF assets',()=>{for(const a of Object.values(baseline.assets))assert.equal(createHash('sha256').update(read(a.path)).digest('hex'),a.sha256);});
test('VGA sockets sharing a mesh retain separate positions and bounds',()=>{
 const items=['rgb-in1','rgb-out1','rgb-out2'].map(id=>baseline.mappings['vertex:'+id]);assert.ok(items.every(m=>m.node_index===182&&m.shared_node));assert.equal(new Set(items.map(m=>m.anchor[0])).size,3);assert.ok(items[0].bounds_scene.min[0]>items[1].bounds_scene.max[0]);assert.ok(items[1].bounds_scene.min[0]>items[2].bounds_scene.max[0]);
});
test('calibration import preserves geometry but cannot overwrite port capability',()=>{const p=sample();p.mappings['vertex:rgb-out2'].video_capable=false;const r=validateCalibration(p,catalog,baseline)['vertex:rgb-out2'];assert.equal(r.status,'local_reviewed');assert.equal(r.video_capable,undefined);assert.deepEqual(r.bounds_scene,p.mappings['vertex:rgb-out2'].bounds_scene);assert.equal(r.shared_node,true);});
for(const[name,edit]of Object.entries({
 'asset mismatch':p=>p.mappings['vertex:rgb-out2'].asset_sha256='wrong',
 'out of range node':p=>p.mappings['vertex:rgb-out2'].node_index=9999,
 'invalid normal':p=>p.mappings['vertex:rgb-out2'].normal=[0,0,0],
 'nonfinite coordinates':p=>p.mappings['vertex:rgb-out2'].anchor=[NaN,0,0],
 'reversed bounds':p=>p.mappings['vertex:rgb-out2'].bounds_scene={min:[2,2,2],max:[1,1,1]},
 'unknown port':p=>p.mappings.unknown=p.mappings['vertex:rgb-out2']
}))test('reject '+name,()=>{const p=sample();edit(p);assert.throws(()=>validateCalibration(p,catalog,baseline));});
test('source confirmation and local review counts stay separate',()=>{
 const ports=catalog.devices.find(d=>d.id==='epson').ports;const n=mappingCounts(ports,id=>baseline.mappings[id]);assert.equal(n.total,17);assert.equal(n.located,16);assert.equal(n.reviewed,16);
});
test('SHA-256 fallback handles empty, short, multi-block and GLTF bytes',()=>{for(const b of [Buffer.from(''),Buffer.from('abc'),Buffer.alloc(10000,117),read('DellG7-Laptop.gltf')])assert.equal(sha256Fallback(b),createHash('sha256').update(b).digest('hex'));});
