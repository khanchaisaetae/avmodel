import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateDirectVideoLink as check} from '../src/connection-rules.mjs';
// Synthetic fixtures test rules; these are NOT verified hardware profiles.
function fixture() {
 const common={capability_status:'verified_reference',connection_kind:'native_video',supported_modes_complete:true,assessment_enabled:true,video_capable:true,connector:'hdmi',signal:'hdmi_video',supported_modes:['1920x1080@60']};
 return {source:{...common,id:'synthetic-source:out',direction:'out'},sink:{...common,id:'synthetic-screen:in-a',direction:'in'},cable:{verification_status:'verified',kind:'direct',supported_modes_complete:true,connectors:['hdmi','hdmi'],signals:['hdmi_video'],supported_modes:['1920x1080@60']},state:{occupiedPortIds:[],sourcePowered:true,sinkPowered:true,sourceVideoEnabled:true,selectedInputPortId:'synthetic-screen:in-a',mode:'1920x1080@60',linkHealthy:true}};
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

scenario('legacy confirmation is revoked',f=>f.source.capability_status='verified','UNVERIFIED_PORT','indeterminate');
scenario('partial format list cannot prove unsupported',f=>{f.sink.supported_modes=['1280x720@60'];f.sink.supported_modes_complete=false;},'MODE_NOT_DOCUMENTED','indeterminate');
scenario('USB video requires software route',f=>f.source.connection_kind='software_video','SPECIAL_ROUTE_REQUIRED','indeterminate');
scenario('configurable monitor port requires mode-aware route',f=>f.source.connection_kind='configurable_video','SPECIAL_ROUTE_REQUIRED','indeterminate');
scenario('topology compatibility does not imply visible image',f=>{f.scope='topology';f.state={occupiedPortIds:[]};},'NATIVE_TOPOLOGY_COMPATIBLE','compatible');
const catalog=JSON.parse(readFileSync(new URL('../data/port-catalog.json',import.meta.url)));
const ports=Object.fromEntries(catalog.devices.flatMap(d=>d.ports.map(p=>[p.id,p])));
test('v1 decisions replaced by v2 ref-only evidence',()=>{
 assert.equal(catalog.schema_version,'2.0.0');assert.equal(catalog.authority,'user_supplied_files_in_ref_only');assert.equal(catalog.devices.length,5);assert.equal(Object.keys(ports).length,54);
 for (const [id,s] of Object.entries(catalog.sources)){
  assert.ok(s.path.startsWith('ref/'));
  const bytes=readFileSync(new URL('../'+s.path,import.meta.url));assert.equal(createHash('sha256').update(bytes).digest('hex'),s.sha256);
 }
 for (const p of Object.values(ports)){
  assert.ok(p.evidence.length>0);assert.equal(p.model_mapping.node_index,null);assert.equal(p.model_mapping.status,'pending_new_calibration');
  for(const e of p.evidence){assert.ok(catalog.sources[e.source_id]);assert.ok(e.pdf_pages?.length || e.pixel_region_xyxy?.length===4);}
 }
});
test('reference confirms Blu-ray audio-only HDMI must reject video',()=>{
 const f=fixture();f.source=ports['bluray:hdmi2'];f.sink=ports['epson:hdmi2'];assert.equal(check({...f,scope:'topology'}).code,'NO_VIDEO');
});
test('reference confirms Blu-ray primary HDMI to Epson topology',()=>{
 const f=fixture();f.source=ports['bluray:hdmi1'];f.sink=ports['epson:hdmi2'];assert.equal(check({...f,scope:'topology'}).status,'compatible');
 assert.equal(check({...f,state:{...f.state,selectedInputPortId:f.sink.id}}).code,'MODE_UNKNOWN');
});
test('TV references contain exactly two HDMI inputs, no guessed ARC assignment',()=>{
 const d=catalog.devices.find(d=>d.id==='tv');assert.equal(d.ports.filter(p=>p.connector==='hdmi').length,2);assert.equal(d.documented_features.find(f=>f.name==='ARC').port_assignment,null);
});
test('Dell screenshot is not upgraded into confirmed USB-C video',()=>{
 assert.equal(ports['dell:usb-c'].video_capable,null);assert.equal(ports['dell:usb-c'].assessment_enabled,false);assert.equal(ports['dell:hdmi'].capability_status,'inferred_function');
});
test('Vertex image-only ports and software-dependent USB are retained',()=>{
 for(const id of ['vertex:rgb-out2','vertex:svideo-in','vertex:svideo-out'])assert.equal(ports[id].evidence[0].basis,'diagram_only');
 assert.equal(ports['vertex:usb-b'].connector,'usb_b');assert.equal(ports['vertex:usb-b'].connection_kind,'software_video');
});
test('Epson Monitor Out is not a generic HDMI-to-VGA converter',()=>{
 const p=ports['epson:computer2-monitor'];assert.equal(p.direction,null);assert.equal(p.modes[1].only_source,'epson:computer1');assert.ok(p.modes[1].blocked_sources.includes('HDMI1'));
});
