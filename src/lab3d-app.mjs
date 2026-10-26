import {defaultLabPositions,parseLabPositions,moveLabDevice} from './lab3d-layout.mjs?v=20261026-move';
import {SCENARIOS,DEVICE_NAMES,SOURCE_NAMES} from './scenario-catalog.mjs';
import {initialScenario,evaluateScenario,checkScenario,validateSegment} from './scenario-engine.mjs';
import {WIRE_CHOICES,portDirection,portFunction,portSupportsSide} from './lesson-cables.mjs';
import {LAB3D_KEY,selectLabPort,selectLabCable,labPackage,parseLabPackage} from './lab3d-model.mjs?v=20261026-move';
import {createLabScene} from './lab3d-scene.mjs?v=20261026-move';
const $=id=>document.getElementById(id),el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
let catalog,mappings,scene,task=SCENARIOS[0],state,segment=0,side='out',timer,loading=true,loadToken=0,arrangeMode=false;
const layoutHistory=[];
const freshLabState=t=>({...initialScenario(t),positions:defaultLabPositions(t)});
const portById=new Map();
function notice(text){$('lab-notice').textContent=text;clearTimeout(timer);timer=setTimeout(()=>$('lab-notice').textContent='',5000);}
function option(parent,value,text){const n=el('option',text);n.value=value;parent.append(n);}
function save(){try{localStorage.setItem(LAB3D_KEY+task.id,JSON.stringify(labPackage(task,state)));$('save-status').textContent='✓ บันทึกงานสามมิติแล้ว';}catch{$('save-status').textContent='บันทึกในเบราว์เซอร์ไม่ได้ · ดาวน์โหลด JSON เพื่อสำรอง';}}
function restore(t){try{const raw=localStorage.getItem(LAB3D_KEY+t.id);if(raw)return parseLabPackage(JSON.parse(raw),SCENARIOS,catalog).state;}catch{notice('เปิดงานเดิมไม่ได้ เริ่มด้วยโต๊ะว่าง สามารถนำเข้าไฟล์สำรองได้');}return freshLabState(t);}
function commit(next){state=next;save();render();}
function setArrange(value){
 if(loading)return;arrangeMode=!!value;document.body.classList.toggle('arrange-mode',arrangeMode);scene.setInteractionMode(arrangeMode);
 if(arrangeMode)scene.overview();render();
}
function changePosition(id,position){
 const before=parseLabPositions(state.positions,task),next=moveLabDevice(state,task,id,position.x,position.z);
 if(JSON.stringify(before)===JSON.stringify(next.positions))return;
 layoutHistory.push(structuredClone(before));if(layoutHistory.length>30)layoutHistory.shift();commit(next);
 $('layout-help').textContent='ย้าย '+DEVICE_NAMES[id]+' แล้ว · ลากเครื่องอื่นต่อได้';
}
function undoPosition(){if(!layoutHistory.length||loading)return;commit({...state,positions:layoutHistory.pop()});notice('ย้อนตำแหน่งอุปกรณ์แล้ว');}
function resetPositions(){if(loading)return;layoutHistory.push(structuredClone(parseLabPositions(state.positions,task)));if(layoutHistory.length>30)layoutHistory.shift();commit({...state,positions:defaultLabPositions(task)});scene.overview();renderDeviceControls();}

function choosePort(portId){
 if(loading||arrangeMode)return;const plan=task.segments[segment],id=portId.split(':')[0];
 const selectedSide=id===plan.from?'out':id===plan.to?'in':null;
 if(!selectedSide){notice('ช่วงสายนี้เชื่อม '+DEVICE_NAMES[plan.from]+' → '+DEVICE_NAMES[plan.to]);return;}
 try{const result=selectLabPort(task,state,segment,selectedSide,portId,catalog);side='in';commit(result.state);scene.select(portId);
  if(selectedSide==='out'){scene.focusDevice(plan.to);renderDeviceControls();renderReference();notice('เลือกต้นทางแล้ว · คลิกพอร์ตบน '+DEVICE_NAMES[plan.to]);}
 }catch(e){notice(e.message);}
}
function focusEndpoint(nextSide){if(arrangeMode)setArrange(false);side=nextSide;const plan=task.segments[segment];scene.focusDevice(plan[side==='out'?'from':'to']);render();}
function renderDeviceControls(){
 $('device-overlays').replaceChildren();
 for(const id of task.devices){
  const card=el('div');card.className='device-control';card.dataset.device=id;card.append(el('strong',DEVICE_NAMES[id]));
  const focus=el('button',(arrangeMode?'เลือกเพื่อย้าย ':'ดูและตั้งค่า ')+DEVICE_NAMES[id]);focus.type='button';focus.addEventListener('click',()=>{if(arrangeMode)scene.selectDevice(id);else scene.focusDevice(id);renderDeviceControls();renderReference();});
  focus.addEventListener('keydown',e=>{if(!arrangeMode)return;const delta={ArrowLeft:[-.25,0],ArrowRight:[.25,0],ArrowUp:[0,-.25],ArrowDown:[0,.25]}[e.key];if(!delta)return;e.preventDefault();const p=parseLabPositions(state.positions,task)[id];changePosition(id,{x:p.x+delta[0],z:p.z+delta[1]});$('device-overlays').querySelector('[data-device="'+id+'"]>button')?.focus();});card.append(focus);
  const detail=el('div');detail.className='device-settings';
  const power=el('button',state.power[id]?'⏻ เปิดอยู่':'⏻ ปิดอยู่');power.type='button';power.setAttribute('aria-label',(state.power[id]?'ปิด':'เปิด')+'เครื่อง '+DEVICE_NAMES[id]);power.setAttribute('aria-pressed',String(state.power[id]));power.addEventListener('click',()=>commit({...state,power:{...state.power,[id]:!state.power[id]}}));detail.append(power);
  if(id==='dell'||id==='bluray'){
   const enabled=state.sourceEnabled[id],button=el('button',(id==='dell'?'ส่งภาพออกจอ':'เล่น / ส่งภาพ')+': '+(enabled?'เปิด':'ปิด'));button.type='button';button.setAttribute('aria-pressed',String(enabled));button.addEventListener('click',()=>commit({...state,sourceEnabled:{...state.sourceEnabled,[id]:!enabled}}));detail.append(button);
  }
  if(id==='vertex'||id===task.displayId){
   const label=el('label',id==='vertex'?'SOURCE · แหล่งภาพ':'Input · ช่องรับภาพ'),select=el('select');select.id='lab-setting-'+id;label.htmlFor=select.id;
   if(id==='vertex'){for(const value of ['CAMERA','HDMI IN','PC1','PC2'])option(select,value,value);select.value=state.vertexSource;}
   else{option(select,'','ยังไม่เลือก Input');for(const p of catalog.devices.find(d=>d.id===id).ports.filter(p=>p.video_capable&&portSupportsSide(p,'in')))option(select,p.id,p.label);select.value=state.displayInput;}
   select.addEventListener('change',()=>commit({...state,[id==='vertex'?'vertexSource':'displayInput']:select.value}));detail.append(label,select);
  }
  card.append(detail);$('device-overlays').append(card);
 }
 scene.refresh();
}
function renderReference(){
 const id=scene.focused||task.segments[segment][side==='out'?'from':'to'];$('all-ports').replaceChildren();
 $('all-ports').append(el('strong',DEVICE_NAMES[id]));
 for(const p of catalog.devices.find(d=>d.id===id).ports){
  const row=el('div');row.className='port-row';const pick=el('button',p.label);pick.type='button';pick.append(el('small',portDirection(p)+' · '+portFunction(p)));pick.setAttribute('aria-label','เลือกพอร์ต '+DEVICE_NAMES[id]+' '+p.label);pick.disabled=loading||arrangeMode||!mappings.mappings[p.id];pick.addEventListener('click',()=>choosePort(p.id));
  const focus=el('button','ดู');focus.type='button';focus.setAttribute('aria-label','ดูตำแหน่ง '+p.label);focus.disabled=pick.disabled;focus.addEventListener('click',()=>{scene.focusPort(p.id);renderDeviceControls();notice(p.label+' · '+portDirection(p));});row.append(pick,focus);$('all-ports').append(row);
 }
}
function render(){
 if(!state||!scene)return;
 if(!loading)scene.setPositions(state.positions);
 $('mode-wire').setAttribute('aria-pressed',String(!arrangeMode));$('mode-layout').setAttribute('aria-pressed',String(arrangeMode));
 $('mode-wire').disabled=loading;$('mode-layout').disabled=loading;$('layout-undo').disabled=loading||!layoutHistory.length;
 $('layout-reset').disabled=loading||JSON.stringify(parseLabPositions(state.positions,task))===JSON.stringify(defaultLabPositions(task));
 $('layout-help').textContent=arrangeMode?'ลากตัวอุปกรณ์เพื่อย้ายบนโต๊ะ · คลิกชื่อแล้วใช้ปุ่มลูกศรได้ · Escape กลับไปเชื่อมต่อ':'คลิกพอร์ตบนตัวเครื่องเพื่อเชื่อมสาย';
 $('lab-mouse-help').textContent=arrangeMode?'ลากตัวเครื่อง: ย้าย · ลากพื้นว่าง: หมุน · ล้อเมาส์: ซูม · ลากขวา: เลื่อน':'ลากซ้าย: หมุน · ล้อเมาส์: ซูม · ลากขวา: เลื่อน · คลิกพอร์ตบนเครื่องเพื่อเลือก';
 const link=state.links[segment],plan=task.segments[segment];$('lab-task').value=task.id;$('lab-goal').textContent=task.goal;
 $('lab-segment').replaceChildren();task.segments.forEach((s,i)=>option($('lab-segment'),String(i),(i+1)+' · '+DEVICE_NAMES[s.from]+' → '+DEVICE_NAMES[s.to]));$('lab-segment').value=String(segment);
 $('pick-instruction').textContent=arrangeMode?'กำลังจัดวาง · กดเชื่อมต่อเพื่อเลือกพอร์ต':'คลิก'+(side==='out'?'เอาท์พุตพอร์ตบน '+DEVICE_NAMES[plan.from]:'อินพุตพอร์ตบน '+DEVICE_NAMES[plan.to]);
 $('out-label').textContent=portById.get(link.sourcePortId)?.label||'ยังไม่เลือก';$('in-label').textContent=portById.get(link.sinkPortId)?.label||'ยังไม่เลือก';
 $('pick-out').setAttribute('aria-pressed',String(side==='out'));$('pick-in').setAttribute('aria-pressed',String(side==='in'));$('lab-cable').value=link.cableId;
 const checked=validateSegment(task,state,segment,catalog);$('link-result').textContent=checked.message;
 const result=evaluateScenario(task,state,catalog);$('lab-result').dataset.status=result.status;$('lab-result').replaceChildren(el('strong',result.imageVisible?'ภาพจำลอง: '+SOURCE_NAMES[result.actualSource]:'ยังไม่มีภาพ'),el('div',result.message));
 $('source-progress').textContent='ตรวจภาพตามเป้าหมายแล้ว '+state.observedSources.length+' / '+task.sources.length+' แหล่ง · ไม่มีคะแนน';$('lab-source').replaceChildren();task.sources.forEach(id=>option($('lab-source'),id,SOURCE_NAMES[id]));$('lab-source').value=state.requestedSource;
 for(const id of ['lab-segment','lab-cable','pick-out','pick-in','disconnect','lab-check','lab-reset'])$(id).disabled=loading;
 $('disconnect').disabled=loading||!(link.sourcePortId||link.sinkPortId||link.cableId);
 try{$('lab-backup').hidden=!localStorage.getItem(LAB3D_KEY+'import-backup');}catch{$('lab-backup').hidden=true;}
 scene.wires(state.links,task.segments,segment);renderDeviceControls();renderReference();
}
async function openTask(id,incoming=null){
 const t=SCENARIOS.find(t=>t.id===id);if(!t)return;const token=++loadToken;task=t;state=incoming||restore(t);layoutHistory.length=0;arrangeMode=false;document.body.classList.remove('arrange-mode');scene.setInteractionMode(false);segment=0;side='out';loading=true;$('lab-loading').hidden=false;$('lab-retry').hidden=true;$('lab-task').disabled=true;render();
 $('device-tabs').replaceChildren();for(const id of t.devices){const b=el('button',DEVICE_NAMES[id]);b.type='button';b.addEventListener('click',()=>{if(arrangeMode)scene.selectDevice(id);else scene.focusDevice(id);renderDeviceControls();renderReference();});$('device-tabs').append(b);}
 try{const ready=await scene.load(t,state.positions);if(token!==loadToken||!ready)return;loading=false;$('lab-loading').hidden=true;$('lab-task').disabled=false;render();if(scene.software)notice('กำลังใช้ตัวแสดงผลสามมิติสำรอง อาจช้าบนอุปกรณ์บางรุ่น');}
 catch(e){if(token!==loadToken)return;$('loading-detail').textContent=e.message;$('lab-loading').querySelector('strong').textContent='เปิดโต๊ะทดลองไม่สำเร็จ';$('lab-retry').hidden=false;$('lab-task').disabled=false;notice(e.message);}
}
function download(name,value){const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'})),a=el('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
async function init(){
 try{
  const responses=await Promise.all([fetch('data/port-catalog.json'),fetch('data/model-mappings.json')]);if(responses.some(r=>!r.ok))throw Error('โหลดข้อมูลอุปกรณ์ไม่สำเร็จ');[catalog,mappings]=await Promise.all(responses.map(r=>r.json()));catalog.devices.forEach(d=>d.ports.forEach(p=>portById.set(p.id,p)));
  for(const t of SCENARIOS)option($('lab-task'),t.id,t.id+' · '+t.title);option($('lab-cable'),'','ยังไม่เลือกสาย');for(const c of WIRE_CHOICES)option($('lab-cable'),c.id,c.label+(c.engineSupported?'':' · ยังไม่จำลอง'));
  scene=createLabScene({canvas:$('lab-scene'),viewport:$('lab-viewport'),overlay:$('device-overlays'),catalog,mappings,onPort:choosePort,onDevice(){renderDeviceControls();renderReference();},onWire(index){segment=index;side='out';render();notice('เลือกสายช่วงที่ '+(index+1));},onHover(id,event){const tip=$('port-tooltip');tip.hidden=!id;if(id){tip.textContent=portById.get(id).label+' · '+portDirection(portById.get(id));const rect=$('lab-viewport').getBoundingClientRect();tip.style.left=Math.min(rect.width-190,Math.max(8,event.clientX-rect.left+12))+'px';tip.style.top=Math.max(8,event.clientY-rect.top-40)+'px';}},onProgress(text){$('loading-detail').textContent=text;},onMove:changePosition});
  $('mode-wire').addEventListener('click',()=>setArrange(false));$('mode-layout').addEventListener('click',()=>setArrange(true));$('layout-undo').addEventListener('click',undoPosition);$('layout-reset').addEventListener('click',resetPositions);window.addEventListener('keydown',e=>{if(e.key==='Escape'&&arrangeMode)setArrange(false);});
  $('lab-task').addEventListener('change',()=>openTask($('lab-task').value));$('lab-segment').addEventListener('change',()=>{segment=Number($('lab-segment').value);focusEndpoint('out');});
  $('pick-out').addEventListener('click',()=>focusEndpoint('out'));$('pick-in').addEventListener('click',()=>focusEndpoint('in'));
  $('lab-cable').addEventListener('change',()=>{try{commit(selectLabCable(task,state,segment,$('lab-cable').value,catalog).state);}catch(e){notice(e.message);}});
  $('disconnect').addEventListener('click',()=>{let next=selectLabCable(task,state,segment,'',catalog).state;next={...next,links:next.links.map((l,i)=>i===segment?{sourcePortId:'',sinkPortId:'',cableId:'',connected:false}:l)};side='out';commit(next);});
  $('lab-source').addEventListener('change',()=>commit({...state,requestedSource:$('lab-source').value}));
  $('lab-check').addEventListener('click',()=>{const checked=checkScenario(task,state,catalog);commit(checked.state);notice(checked.result.complete?'✓ ทดลองครบทุกแหล่งภาพของโจทย์นี้แล้ว':checked.result.message);});
  $('view-all').addEventListener('click',()=>{scene.overview();renderDeviceControls();renderReference();});for(const b of document.querySelectorAll('[data-view]'))b.addEventListener('click',()=>{scene.focusDevice(scene.focused||task.segments[segment][side==='out'?'from':'to'],b.dataset.view);renderDeviceControls();renderReference();});
  $('lab-reset').addEventListener('click',()=>$('reset-confirm').showModal());$('reset-cancel').addEventListener('click',()=>$('reset-confirm').close());$('reset-ok').addEventListener('click',()=>{$('reset-confirm').close();layoutHistory.length=0;commit(freshLabState(task));scene.overview();renderDeviceControls();});$('lab-retry').addEventListener('click',()=>openTask(task.id,state));
  $('lab-export').addEventListener('click',()=>download('AV-3D-'+task.id+'.json',labPackage(task,state)));
  $('lab-backup').addEventListener('click',()=>{try{const value=JSON.parse(localStorage.getItem(LAB3D_KEY+'import-backup'));parseLabPackage(value,SCENARIOS,catalog);download('AV-3D-before-import.json',value);}catch{notice('ไม่พบสำเนาที่เปิดได้');}});
  $('lab-import').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>1000000)throw Error('ไฟล์ใหญ่เกิน 1 MB');const imported=parseLabPackage(JSON.parse(await file.text()),SCENARIOS,catalog);const old=localStorage.getItem(LAB3D_KEY+imported.task.id);if(old)localStorage.setItem(LAB3D_KEY+'import-backup',old);await openTask(imported.task.id,imported.state);save();notice('เปิดงานสามมิติแล้ว · สำเนาก่อนนำเข้าเก็บในเบราว์เซอร์');}catch(error){notice(error.message);}e.target.value='';});
  await openTask(task.id);
 }catch(e){$('loading-detail').textContent=e.message;$('lab-loading').querySelector('strong').textContent='เริ่มกิจกรรมไม่สำเร็จ';notice(e.message);}
}
init();
