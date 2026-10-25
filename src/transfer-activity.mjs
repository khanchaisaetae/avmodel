import { SCENARIOS, DEVICE_NAMES, SOURCE_NAMES } from './scenario-catalog.mjs';
import { parseReference,sampleReference,compareTransfer,drawingSignature,documentSignature,
  transferReadiness,transferReport,installationRows,INCOMING_TRANSFER_KEY } from './transfer-model.mjs';

export function createTransferActivity(scope){
 let reference,inspected=[],checkedSignature=null,confirmedSignature=null,selector,sourceList,progress,result,confirm,summary;
 const references=SCENARIOS.map(t=>sampleReference(t,scope.catalog));
 const metaKey=()=> 'av-port-lab.transfer.notes.v1.'+reference.id;
 const task=()=>SCENARIOS.find(t=>t.id===reference.taskId);
 function loadMeta(){
  inspected=[];checkedSignature=null;confirmedSignature=null;
  try{
   const raw=localStorage.getItem(metaKey());if(!raw||raw.length>50000)return;
   const saved=JSON.parse(raw);
   inspected=Array.isArray(saved.inspected)?[...new Set(saved.inspected.filter(id=>task().devices.includes(id)))]:[];
   checkedSignature=typeof saved.checkedSignature==='string'?saved.checkedSignature.slice(0,16000):null;
   confirmedSignature=typeof saved.confirmedSignature==='string'?saved.confirmedSignature.slice(0,16000):null;
  }catch{}
 }
 function saveMeta(){
  try{localStorage.setItem(metaKey(),JSON.stringify({inspected,checkedSignature,confirmedSignature}));}
  catch{scope.notice('บันทึกผลสำรวจไม่ได้ กรุณาดาวน์โหลดรายงานส่งต่อเพื่อเก็บงาน');}
 }
 function model(id,portId){
  scope.$('model-title').textContent='ระบบอ้างอิง · '+DEVICE_NAMES[id];
  scope.$('model-frame').src='index.html?embedded=1&device='+encodeURIComponent(id)+(portId?'&port='+encodeURIComponent(portId):'');
  scope.$('model-preview').showModal();
 }
 function renderSources(){
  sourceList.replaceChildren();
  for(const id of task().devices){
   const card=scope.el('article',undefined,'reference-device');
   card.append(scope.el('h3',DEVICE_NAMES[id]),scope.el('p','เครื่อง: '+(reference.state.power[id]?'เปิด':'ปิด')));
   if(Object.hasOwn(reference.state.sourceEnabled,id))card.append(scope.el('p','เล่น / ส่งภาพ: '+(reference.state.sourceEnabled[id]?'เปิด':'ปิด')));
   if(id==='vertex')card.append(scope.el('p','SOURCE: '+reference.state.vertexSource));
   if(id===task().displayId)card.append(scope.el('p','Input: '+scope.ports.get(reference.state.displayInput)?.label));
   task().segments.forEach((seg,i)=>{
    if(![seg.from,seg.to].includes(id))return;
    const side=seg.from===id?'OUT':'IN',portId=reference.state.links[i][side==='OUT'?'sourcePortId':'sinkPortId'];
    card.append(scope.button('C'+(i+1)+' · '+side+' · '+scope.ports.get(portId).label+' ↗',()=>model(id,portId)));
   });
   card.append(scope.button('สำรวจโมเดล 3 มิติ ↗',()=>model(id)));
   const label=scope.el('label',undefined,'reference-check'),check=scope.el('input');check.type='checkbox';check.checked=inspected.includes(id);
   check.dataset.inspected=id;
   check.addEventListener('change',()=>{inspected=check.checked?[...new Set([...inspected,id])]:inspected.filter(x=>x!==id);saveMeta();renderActivity();});
   label.append(check,document.createTextNode('ฉันตรวจพอร์ตและการตั้งค่าของเครื่องนี้แล้ว'));card.append(label);sourceList.append(card);
  }
 }
 function activate(next,loadDrawing=true){
  reference=next;scope.storagePrefix='av-port-lab.transfer.diagram.v1.'+reference.id+'.';loadMeta();
  if(loadDrawing){scope.state=scope.loadTask(reference.taskId);scope.history.length=0;scope.future.length=0;scope.selection=null;scope.pending=null;scope.review=null;}
  selector.value=reference.id;renderSources();
  summary.textContent='เป้าหมาย: '+SOURCE_NAMES[reference.state.requestedSource]+' → '+DEVICE_NAMES[task().displayId]+' · '+
    (reference.origin==='practice'?'สำเนาจากหน้าฝึกเชื่อมต่อ':'ระบบตัวอย่างที่พร้อมแสดงภาพ');
  if(loadDrawing)scope.render();
 }
 function renderActivity(){
  if(!scope.state)return;
  const r=transferReadiness(reference,scope.state,scope.catalog,inspected,checkedSignature);
  const signed=r.ready&&confirmedSignature===documentSignature(reference,scope.state,inspected);
  progress.textContent='สำรวจแล้ว '+inspected.length+'/'+task().devices.length+' เครื่อง · ผังของผู้เรียนเริ่มจากพื้นที่ว่าง';
  result.replaceChildren();
  if(r.checked){
   result.append(scope.el('p',r.comparison.matches?'✓ พอร์ต สาย และการตั้งค่าตรงระบบอ้างอิง':'ผังยังต่างจากระบบอ้างอิง','transfer-match'));
   for(const issue of r.comparison.issues)result.append(scope.el('p',issue,'result-item'));
  }else result.append(scope.el('p','เขียนผังจากสิ่งที่สำรวจ แล้วกดตรวจผังเทียบระบบอ้างอิง'));
  const pending=[...(!r.observed?['ยืนยันการสำรวจอุปกรณ์ให้ครบ']:[]),...(!r.reason?['อธิบายการติดตั้งอย่างน้อย 10 ตัวอักษร']:[]),...(!r.checked?['กดตรวจผังฉบับปัจจุบัน']:[])];
  if(pending.length)result.append(scope.el('p',pending.join(' · '),'small'));
  confirm.disabled=!r.ready||signed;confirm.textContent=signed?'✓ ยืนยันเอกสารส่งต่อแล้ว':'ยืนยันเอกสารส่งต่อ';
  if(signed)result.prepend(scope.el('strong','พร้อมส่งต่อ: ผังตรงระบบอ้างอิงและมีคำอธิบายแล้ว'));
 }
 function printInstructions(output){
  const section=scope.el('section',undefined,'transfer-print');section.append(scope.el('h2','ตารางติดตั้งตามผังของผู้เรียน'));
  const table=scope.el('table'),head=scope.el('thead'),hr=scope.el('tr');
  for(const label of ['สาย','ต้นทาง / OUT','ปลายทาง / IN','ชนิดสาย'])hr.append(scope.el('th',label));head.append(hr);table.append(head);
  const body=scope.el('tbody');for(const row of installationRows(scope.state,scope.catalog)){
   const tr=scope.el('tr');for(const text of [row.wire,row.from+' · '+row.out,row.to+' · '+row.in,row.cable])tr.append(scope.el('td',text));body.append(tr);
  }table.append(body);section.append(table);
  section.append(scope.el('h3','การตั้งค่าอุปกรณ์'));
  for(const n of scope.state.nodes){let text=DEVICE_NAMES[n.id]+' · เครื่อง '+(n.power?'เปิด':'ปิด');
   if(task().sources.includes(n.id)&&n.id!=='vertex')text+=' · เล่น / ส่งภาพ '+(n.enabled?'เปิด':'ปิด');
   if(n.id==='vertex')text+=' · SOURCE '+n.source;
   if(n.id===task().displayId)text+=' · Input '+(scope.ports.get(n.input)?.label||'ยังไม่ระบุ');section.append(scope.el('p',text));
  }
  const report=transferReport(reference,scope.state,scope.catalog,inspected,checkedSignature,confirmedSignature);
  section.append(scope.el('p',report.confirmed?'ตรวจตรงระบบอ้างอิงและยืนยันเอกสารแล้ว':'ฉบับร่าง · ยังไม่ได้ยืนยันเอกสารส่งต่อ'),
    scope.el('p','เป้าหมายภาพ: '+SOURCE_NAMES[reference.state.requestedSource]),scope.el('p',report.note));output.append(section);
 }
 return {
  get initialTaskId(){return reference.taskId;},
  mount(){
   try{const raw=localStorage.getItem(INCOMING_TRANSFER_KEY);if(raw&&raw.length<1000000)references.push(parseReference(JSON.parse(raw),scope.catalog));}
   catch(e){scope.notice('ระบบที่ส่งมาใช้ไม่ได้: '+e.message+' ใช้ระบบตัวอย่างแทน');}
   const library=document.querySelector('.library');library.querySelector('h1').textContent='จากโมเดลสู่ผังระบบ';
   library.querySelector('.eyebrow').textContent='ยูสเคส 6 · สำรวจและถ่ายทอดระบบ';
   scope.$('diagram-task').hidden=true;library.querySelector('label[for="diagram-task"]').hidden=true;scope.$('diagram-goal').hidden=true;
   const panel=scope.el('section',undefined,'transfer-reference');const label=scope.el('label','เลือกระบบอ้างอิง');label.htmlFor='transfer-reference';
   selector=scope.el('select');selector.id='transfer-reference';
   for(const ref of references){const option=scope.el('option',(ref.origin==='practice'?'ระบบที่ส่งมา · ':'ตัวอย่าง '+ref.taskId+' · ')+SCENARIOS.find(t=>t.id===ref.taskId).title);option.value=ref.id;selector.append(option);}
   selector.addEventListener('change',()=>activate(references.find(r=>r.id===selector.value)));
   summary=scope.el('p');summary.id='transfer-summary';progress=scope.el('p');progress.id='transfer-observed';progress.setAttribute('role','status');
   const details=scope.el('details');details.open=true;details.append(scope.el('summary','สำรวจระบบอ้างอิง'));
   details.append(scope.el('p','C1, C2… คือป้ายสายของระบบอ้างอิง จับคู่ปลายสายจากแต่ละเครื่อง คลิกชื่อพอร์ตเพื่อดูตำแหน่งบนโมเดล'));
   sourceList=scope.el('div');sourceList.id='reference-devices';details.append(sourceList);
   panel.append(label,selector,summary,progress,details);library.querySelector('h1').after(panel);
   scope.$('diagram-review').textContent='ตรวจผังเทียบระบบอ้างอิง';
   scope.$('diagram-json').textContent='↓ ผังสำหรับเปิดแก้ไข (JSON)';
   scope.$('diagram-reason').placeholder='ต่อสายจาก… เข้าช่อง… ตั้ง SOURCE / Input… แล้วตรวจว่าได้ภาพจาก…';
   const handoff=scope.el('section',undefined,'transfer-handoff');handoff.append(scope.el('h2','เอกสารสำหรับติดตั้งซ้ำ'));
   result=scope.el('div');result.id='transfer-result';result.setAttribute('role','status');result.setAttribute('aria-live','polite');
   confirm=scope.button('ยืนยันเอกสารส่งต่อ',()=>{if(!transferReadiness(reference,scope.state,scope.catalog,inspected,checkedSignature).ready)return;confirmedSignature=documentSignature(reference,scope.state,inspected);saveMeta();renderActivity();},'primary');confirm.id='transfer-confirm';
   const exportButton=scope.button('↓ รายงานรวมและตารางติดตั้ง (JSON)',()=>scope.download('AV-transfer-'+reference.taskId+'.json',
     JSON.stringify(transferReport(reference,scope.state,scope.catalog,inspected,checkedSignature,confirmedSignature),null,2),'application/json'));
   exportButton.id='transfer-report';
   handoff.append(result,confirm,exportButton,scope.el('p','ใช้เมนูบันทึกเดิมเพื่อดาวน์โหลดผัง JSON / SVG หรือพิมพ์พร้อมตารางติดตั้ง ไม่มีคะแนน ผู้สอนตรวจเนื้อหาเหตุผลก่อนใช้จริง','small'));
   document.querySelector('.review-section').after(handoff);
   const incoming=new URLSearchParams(location.search).get('incoming')==='1';
   const first=incoming?references.find(r=>r.origin==='practice')||references[0]:references[0];
   if(incoming&&first.origin!=='practice')scope.notice('ไม่พบระบบที่ส่งมา เปิดระบบตัวอย่างให้แทน');
   activate(first,false);
  },
  render:renderActivity,
  renderReview(){if(scope.review){checkedSignature=drawingSignature(reference,scope.state);saveMeta();}renderActivity();},
  appendPrint:printInstructions,
 };
}
