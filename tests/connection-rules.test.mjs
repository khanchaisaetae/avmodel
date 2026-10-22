import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateDirectVideoLink as check} from '../src/connection-rules.mjs';
// Synthetic fixtures test rules; these are NOT verified hardware profiles.
function fixture() {
 const common={capability_status:'verified',assessment_enabled:true,video_capable:true,connector:'hdmi',signal:'hdmi_video',supported_modes:['1920x1080@60']};
 return {source:{...common,id:'synthetic-source:out',direction:'out'},sink:{...common,id:'synthetic-screen:in-a',direction:'in'},cable:{verification_status:'verified',kind:'direct',connectors:['hdmi','hdmi'],signals:['hdmi_video'],supported_modes:['1920x1080@60']},state:{occupiedPortIds:[],sourcePowered:true,sinkPowered:true,sourceVideoEnabled:true,selectedInputPortId:'synthetic-screen:in-a',mode:'1920x1080@60',linkHealthy:true}};
}
function scenario(name,edit,code,status) {test(name,()=>{const f=fixture();edit(f);const r=check(f);assert.equal(r.code,code);assert.equal(r.status,status);assert.equal(r.gradable,status!=='indeterminate');});}
scenario('compatible configured direct link',()=>{},'DIRECT_VIDEO_READY','ready');
scenario('OUT to OUT rejected',f=>f.sink.direction='out','DIRECTION','invalid');
scenario('IN to IN rejected',f=>f.source.direction='in','DIRECTION','invalid');
scenario('HDMI audio-only cannot carry the requested video',f=>f.source.video_capable=false,'NO_VIDEO','invalid');
scenario('HDMI to VGA requires conversion',f=>f.sink.connector='vga','CONVERSION_REQUIRED','invalid');
scenario('wrong cable connector',f=>f.cable.connectors=['usb_a','usb_a'],'CABLE_CONNECTOR','invalid');
scenario('different signal types',f=>f.sink.signal='analog_rgb','SIGNAL_MISMATCH','invalid');
scenario('occupied socket cannot silently split',f=>f.state.occupiedPortIds=[f.source.id],'PORT_OCCUPIED','invalid');
scenario('correct wiring but wrong selected Input',f=>f.state.selectedInputPortId='synthetic-screen:in-b','WRONG_INPUT','no_image');
scenario('output disabled',f=>f.state.sourceVideoEnabled=false,'OUTPUT_DISABLED','no_image');
scenario('screen off',f=>f.state.sinkPowered=false,'POWER_OFF','no_image');
scenario('mode beyond sink capability',f=>f.sink.supported_modes=['1280x720@60'],'MODE_UNSUPPORTED','no_image');
scenario('faulty cable',f=>f.state.linkHealthy=false,'LINK_FAULT','no_image');
scenario('unknown format is not marked incorrect',f=>f.sink.supported_modes=null,'MODE_UNKNOWN','indeterminate');
scenario('unverified direction cannot enter scoring',f=>f.source.capability_status='unverified','UNVERIFIED_PORT','indeterminate');
scenario('unverified cable cannot enter scoring',f=>f.cable.verification_status='unverified','UNVERIFIED_CABLE','indeterminate');
scenario('missing input state is not guessed',f=>delete f.state.selectedInputPortId,'INPUT_UNKNOWN','indeterminate');
scenario('adapter routes deferred',f=>f.cable.kind='active_converter','CONVERTER_ROUTE_REQUIRED','indeterminate');
test('all catalog candidates have geometry evidence and remain outside assessment',()=>{
 const c=JSON.parse(readFileSync(new URL('../data/port-catalog.json',import.meta.url)));assert.equal(c.devices.length,5);
 const ids=new Set();for(const d of c.devices){assert.equal(d.hardware_identity_status,'unresolved');for(const p of d.ports){assert.ok(!ids.has(p.id));ids.add(p.id);assert.equal(p.assessment_enabled,false);assert.equal(p.direction,null);assert.equal(p.socket_anchor_scene,null);assert.equal(p.geometry_center_scene.length,3);assert.ok(p.geometry_center_scene.every(Number.isFinite));assert.equal(check({source:p,sink:p,cable:{}}).status,'indeterminate');}}
 assert.equal(ids.size,35);
});
test('evidence matches source assets and distinct HDMI parts have distinct bounds',()=>{
 const c=JSON.parse(readFileSync(new URL('../data/port-catalog.json',import.meta.url)));
 for(const d of c.devices){
  const bytes=readFileSync(new URL('../'+d.asset_path,import.meta.url));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),d.sha256);
  const gltf=JSON.parse(bytes);
  for(const p of d.ports){
   assert.equal(gltf.nodes[p.node_index].name,p.node_name);
   p.geometry_center_scene.forEach((v,i)=>assert.ok(v>=p.geometry_bounds_scene.min[i]&&v<=p.geometry_bounds_scene.max[i]));
  }
  const hdmi=d.ports.filter(p=>p.connector_candidate==='hdmi');
  assert.equal(new Set(hdmi.map(p=>JSON.stringify(p.geometry_center_scene))).size,hdmi.length);
 }
});
