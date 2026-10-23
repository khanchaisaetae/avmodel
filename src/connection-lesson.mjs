import {CABLES,initialExercise,evaluateExercise,changeWiring} from './connection-exercise.mjs';
const $=id=>document.getElementById(id);
export function mountConnectionLesson({catalog,viewPort,viewDevice,updateCable}){
 let state=initialExercise(),active=false,lastResult=null;
 const ports=new Map(catalog.devices.flatMap(d=>d.ports.map(p=>[p.id,p])));
 const pane=$('lesson-pane');
 pane.innerHTML=`<div class="lesson-heading"><span class="tiny-title">ยูสเคส 2 / ภารกิจที่ 1</span><h3>Dell → Epson</h3><p>เชื่อมโน้ตบุ๊กให้โปรเจกเตอร์แสดงภาพได้</p></div>
 <ol class="lesson-progress" aria-label="ความคืบหน้ากิจกรรม"><li id="step-select">เลือก</li><li id="step-wire">เชื่อม</li><li id="step-display">แสดงภาพ</li></ol>
 <section class="lesson-section"><h4>1. เลือกพอร์ต</h4><p class="lesson-tip">คลิกช่องต่อบนโมเดล หรือเลือกจากรายการ แล้วสลับดูอีกเครื่อง</p>
 <div class="endpoint"><div><label for="lesson-source">ต้นทาง · Dell</label><button type="button" id="view-source">ดูโมเดล ↗</button></div><select id="lesson-source"><option value="">เลือกพอร์ตต้นทาง</option></select></div>
 <div class="endpoint"><div><label for="lesson-sink">ปลายทาง · Epson</label><button type="button" id="view-sink">ดูโมเดล ↗</button></div><select id="lesson-sink"><option value="">เลือกพอร์ตปลายทาง</option></select></div></section>
 <section class="lesson-section"><h4>2. เลือกและเชื่อมสาย</h4><fieldset class="cable-choices"><legend class="sr-only">ชนิดสายเชื่อมต่อ</legend>${CABLES.map(c=>`<label class="cable-choice"><input type="radio" name="lesson-cable" value="${c.id}"><span><strong>${c.label}</strong><small>${c.description}</small></span></label>`).join('')}</fieldset><div class="lesson-actions"><button type="button" class="primary" id="connect-cable">เชื่อมสาย</button><button type="button" class="outline" id="disconnect-cable">ถอดสาย</button></div></section>
 <section class="lesson-section"><h4>3. เตรียมเครื่องให้พร้อม</h4><label class="lesson-switch"><input type="checkbox" id="lesson-source-power">เปิด Dell</label><label class="lesson-switch"><input type="checkbox" id="lesson-sink-power">เปิด Epson</label><label class="lesson-switch"><input type="checkbox" id="lesson-output">Dell ส่งภาพออกจอภายนอก</label><div class="lesson-input"><label for="lesson-input">Input ของ Epson</label><select id="lesson-input"><option value="">ยังไม่เลือก Input</option><option value="epson:hdmi1">HDMI1/MHL</option><option value="epson:hdmi2">HDMI2</option><option value="epson:computer1">Computer1</option><option value="epson:video">Video</option></select></div><button type="button" class="primary" id="check-connection">ตรวจผลการเชื่อมต่อ</button></section>
 <div id="lesson-feedback" class="lesson-feedback" role="status" aria-live="polite" hidden></div><button type="button" class="lesson-reset" id="reset-lesson">↺ เริ่มกิจกรรมใหม่</button><details class="lesson-assumption"><summary>เงื่อนไขของโจทย์จำลอง</summary><p>กำหนดให้ Dell และสายภาพที่เลือกไว้ในชุดฝึกรองรับ 1280 × 800 ที่ 60 Hz และสายอยู่ในสภาพดี ใช้ข้อมูลคู่มือยืนยันหน้าที่พอร์ตของอุปกรณ์ ผลนี้เป็นการจำลอง ไม่รับรองว่าภาพจากอุปกรณ์จริงจะขึ้นในทุกเงื่อนไข</p><p>ยังไม่จำลองอะแดปเตอร์ USB-C, USB Display, HDBaseT หรือ EDID/HDCP เส้นทางที่ข้อมูลไม่ครบจะอธิบายข้อจำกัด โดยไม่ตัดสินว่าผู้เรียนทำผิด</p></details>`;
 for(const [id,deviceId]of [['lesson-source','dell'],['lesson-sink','epson']]){
  for(const p of catalog.devices.find(d=>d.id===deviceId).ports){const option=document.createElement('option');option.value=p.id;option.textContent=p.label;$(id).append(option);}
  $(id).addEventListener('change',()=>{const portId=$(id).value;setPort(deviceId,portId);if(portId)viewPort(portId);});
 }
 $('view-source').addEventListener('click',()=>state.sourcePortId?viewPort(state.sourcePortId):viewDevice('dell'));
 $('view-sink').addEventListener('click',()=>state.sinkPortId?viewPort(state.sinkPortId):viewDevice('epson'));
 for(const radio of pane.querySelectorAll('[name="lesson-cable"]'))radio.addEventListener('change',()=>{state.cableId=radio.value;invalidateWiring();});
 for(const [id,key]of [['lesson-source-power','sourcePowered'],['lesson-sink-power','sinkPowered'],['lesson-output','sourceVideoEnabled']])$(id).addEventListener('change',()=>{state[key]=$(id).checked;lastResult=null;render();});
 $('lesson-input').addEventListener('change',()=>{state.selectedInputPortId=$('lesson-input').value;lastResult=null;render();});
 $('connect-cable').addEventListener('click',()=>{const result=evaluateExercise(state,catalog,{scope:'topology'});state.connected=result.status==='compatible';lastResult=result.status==='compatible'?{...result,message:'เสียบสายครบสองปลายแล้ว ตรวจการเปิดเครื่อง การส่งภาพ และ Input ให้ตรงกับช่องที่ต่อ'}:result;render();});
 $('disconnect-cable').addEventListener('click',()=>{state.connected=false;lastResult=null;render();});
 $('check-connection').addEventListener('click',()=>{state.attempts++;lastResult=evaluateExercise(state,catalog);render();$('lesson-feedback').scrollIntoView({block:'nearest',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});});
 $('reset-lesson').addEventListener('click',()=>{state=initialExercise();lastResult=null;render();viewDevice('dell');});
 function invalidateWiring(){state=changeWiring(state,{});lastResult=null;render();}
 function setPort(deviceId,id){const key=deviceId==='dell'?'sourcePortId':'sinkPortId';if(state[key]===id)return;state[key]=id;invalidateWiring();}
 function render(){
  $('lesson-source').value=state.sourcePortId;$('lesson-sink').value=state.sinkPortId;
  for(const r of pane.querySelectorAll('[name="lesson-cable"]'))r.checked=r.value===state.cableId;
  for(const[id,key]of [['lesson-source-power','sourcePowered'],['lesson-sink-power','sinkPowered'],['lesson-output','sourceVideoEnabled']])$(id).checked=state[key];
  $('lesson-input').value=state.selectedInputPortId;
  $('connect-cable').disabled=!state.sourcePortId||!state.sinkPortId||!state.cableId||state.connected;
  $('disconnect-cable').disabled=!state.connected;
  const live=evaluateExercise(state,catalog),done=lastResult?.status==='ready';
  $('step-select').classList.toggle('done',Boolean(state.sourcePortId&&state.sinkPortId&&state.cableId));$('step-wire').classList.toggle('done',state.connected);$('step-display').classList.toggle('done',done);
  const feedback=$('lesson-feedback');feedback.hidden=!lastResult;feedback.className='lesson-feedback '+(lastResult?.status||'');
  if(lastResult){feedback.replaceChildren();const title=document.createElement('strong');title.textContent=done?'สำเร็จ · แสดงภาพได้ตามโจทย์':lastResult.status==='indeterminate'?'เส้นทางนี้ยังไม่อยู่ในกิจกรรม':lastResult.status==='compatible'?'เชื่อมสายแล้ว':'ยังไม่แสดงภาพ';const message=document.createElement('p');message.textContent=lastResult.message;feedback.append(title,message);if(done){const p=document.createElement('p');p.textContent='ภาพส่งจาก HDMI OUT ของ Dell ผ่านสาย HDMI เข้าช่อง '+ports.get(state.sinkPortId).label+' ของ Epson และเลือก Input ตรงกัน';feedback.append(p);}}
  $('signal-source-port').textContent=ports.get(state.sourcePortId)?.label||'ยังไม่เลือกพอร์ต';$('signal-sink-port').textContent=ports.get(state.sinkPortId)?.label||'ยังไม่เลือกพอร์ต';$('signal-cable').textContent=state.connected?(CABLES.find(c=>c.id===state.cableId)?.label||''):'ยังไม่เชื่อมสาย';$('signal-diagram').dataset.connected=String(state.connected);
  const screen=$('lesson-screen');screen.dataset.visible=String(live.imageVisible);$('screen-status').textContent=live.imageVisible?'ภาพจาก Dell · 1280 × 800 / 60 Hz':'ไม่มีสัญญาณภาพ';$('screen-detail').textContent=live.imageVisible?'ผลจำลองตามเงื่อนไขโจทย์':!state.connected?'ยังไม่ได้เชื่อมสาย':!state.sourcePowered||!state.sinkPowered?'ตรวจการเปิดเครื่องทั้งสองฝั่ง':!state.sourceVideoEnabled?'Dell ยังไม่ได้ส่งภาพออกจอภายนอก':'ตรวจ Input ของ Epson';
  $('lesson-attempts').textContent='ตรวจผล '+state.attempts+' ครั้ง';
  updateCable(active&&state.connected?{...state,color:CABLES.find(c=>c.id===state.cableId).color}:null);
 }
 return {
  enter(){active=true;render();},leave(){active=false;updateCable(null);},
  onPortSelected(port){if(active&&(port.id.startsWith('dell:')||port.id.startsWith('epson:')))setPort(port.id.split(':')[0],port.id);},
  onDeviceChanged(){if(active)render();},
  get active(){return active;}
 };
}
