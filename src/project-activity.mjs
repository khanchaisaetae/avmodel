import {PROJECT_MISSIONS,PROJECT_FIELDS,PROJECT_CHECKS} from './project-catalog.mjs';
import {normalizeProjectMeta,emptyProjectMeta,reviewProject,captureProjectTest,projectReadiness,projectSignature,projectPackage,parseProjectPackage,projectWiring} from './project-model.mjs';
import {projectHtml,projectBody} from './project-documents.mjs';
export function createProjectActivity(scope){
 let mission=PROJECT_MISSIONS[0],meta=emptyProjectMeta(),lastReview=null,selector,brief,progress,tests,testSelect,pending,confirm,notesBox,checkBox,backup;
 const fields=new Map(),checks=new Map(),key=()=> 'av-port-lab.project.notes.v1.'+mission.id;
 function save(){try{localStorage.setItem(key(),JSON.stringify(meta));}catch{scope.notice('บันทึกแฟ้มไม่ได้ กรุณาดาวน์โหลด JSON เพื่อเก็บงาน');}}
 function load(){try{const raw=localStorage.getItem(key());return raw&&raw.length<500000?JSON.parse(raw):emptyProjectMeta();}catch{return emptyProjectMeta();}}
 function activate(next,imported=null,first=false){
  mission=next;scope.storagePrefix='av-port-lab.project.diagram.v1.'+mission.id+'.';
  if(!first){scope.state=imported?.diagram||scope.loadTask('free');scope.history.length=0;scope.future.length=0;scope.selection=null;scope.pending=null;scope.review=null;}
  meta=imported?.meta||load();lastReview=null;selector.value=mission.id;brief.textContent=mission.brief;
  testSelect.replaceChildren();for(const t of mission.tests){const o=scope.el('option',t.title);o.value=t.id;testSelect.append(o);}
  if(!first){scope.save();save();scope.render();}
 }
 function renderProject(){
  if(!scope.state)return;
  const before=Object.keys(meta.proofs||{}).length;meta=normalizeProjectMeta(meta,mission,scope.state,scope.catalog);
  if(before!==Object.keys(meta.proofs).length){save();scope.notice('ผังเปลี่ยนแล้ว ต้องทดสอบแหล่งภาพของผังฉบับนี้ใหม่');}
  const r=projectReadiness(mission,scope.state,scope.catalog,meta),done=mission.tests.filter(t=>meta.proofs[t.id]).length;
  const docs=PROJECT_FIELDS.filter(([id])=>meta.notes[id].trim().length>=10).length+(scope.state.reason.trim().length>=10?1:0);
  progress.textContent='ทดสอบ '+done+'/'+mission.tests.length+' · เอกสาร '+docs+'/5 · ตรวจรายการ '+meta.checks.length+'/4';
  tests.replaceChildren();for(const t of mission.tests)tests.append(scope.el('li',(meta.proofs[t.id]?'✓ ':'○ ')+t.title));
  pending.replaceChildren();if(r.confirmed)pending.append(scope.el('strong','✓ ยืนยันแฟ้มส่งมอบแล้ว'));
  else if(r.pending.length){pending.append(scope.el('p',r.pending[0]));const details=scope.el('details');details.append(scope.el('summary','สิ่งที่ต้องทำอีก '+r.pending.length+' รายการ'));const list=scope.el('ul');for(const text of r.pending)list.append(scope.el('li',text));details.append(list);pending.append(details);}
  else pending.append(scope.el('p','ผลทดสอบ เอกสาร และสภาพเริ่มใช้งานครบ พร้อมยืนยัน'));
  confirm.disabled=!r.ready||r.confirmed;confirm.textContent=r.confirmed?'✓ ยืนยันแฟ้มส่งมอบแล้ว':'ยืนยันแฟ้มส่งมอบ';
  for(const[id,input]of fields)if(document.activeElement!==input)input.value=meta.notes[id];
  for(const[id,input]of checks)input.checked=meta.checks.includes(id);
  scope.$('diagram-title').textContent='ยูสเคส 7 · '+mission.title;
  try{backup.hidden=!localStorage.getItem('av-port-lab.project.import-backup.v1');}catch{backup.hidden=true;}
 }
 return {
  initialTaskId:'free',
  reviewDiagram(d,catalog){return reviewProject(mission,d,catalog,testSelect.value);},
  mount(){
   const {el,$,button}=scope,library=document.querySelector('.library');
   library.querySelector('.eyebrow').textContent='ยูสเคส 7 · ภารกิจบูรณาการ';library.querySelector('h1').textContent='ออกแบบและส่งมอบห้องเรียน';
   $('diagram-task').hidden=true;library.querySelector('label[for="diagram-task"]').hidden=true;$('diagram-goal').hidden=true;
   const panel=el('section',undefined,'project-brief'),label=el('label','เลือกภารกิจ');label.htmlFor='project-mission';selector=el('select');selector.id='project-mission';
   for(const m of PROJECT_MISSIONS){const o=el('option',m.title);o.value=m.id;selector.append(o);}selector.addEventListener('change',()=>activate(PROJECT_MISSIONS.find(m=>m.id===selector.value)));
   brief=el('p');brief.id='project-brief';progress=el('p',undefined,'project-progress');progress.id='project-progress';progress.setAttribute('role','status');tests=el('ul');tests.id='project-tests';
   panel.append(label,selector,brief,progress,tests,el('small','เลือกวิธีต่อได้เอง · ใช้สายชุดเดิมทดสอบทุกแหล่ง · จัดสภาพเริ่มสอนก่อนส่งมอบ'));
   library.querySelector('h1').after(panel);
   $('preview-source').hidden=true;document.querySelector('label[for="preview-source"]').hidden=true;
   const testLabel=el('label','เลือกภาพที่จะทดสอบ');testLabel.htmlFor='project-test';testSelect=el('select');testSelect.id='project-test';
   testSelect.addEventListener('change',()=>{scope.review=null;scope.renderReview();});$('diagram-review').before(testLabel,testSelect);$('diagram-review').textContent='ทดสอบภาพและบันทึกผล';
   $('diagram-json').textContent='↓ ผังสำหรับเปิดแก้ไข (JSON)';$('diagram-reason').placeholder='เหตุใดจึงเลือกอุปกรณ์ พอร์ต สาย และเส้นทางแบบนี้…';
   notesBox=el('details',undefined,'project-documents');notesBox.append(el('summary','จัดทำคู่มือและแนวทางดูแล'));
   for(const[id,text,placeholder]of PROJECT_FIELDS){const l=el('label',text);l.htmlFor='project-'+id;const input=el('textarea');input.id=l.htmlFor;input.rows=3;input.maxLength=2000;input.placeholder=placeholder;
    input.addEventListener('input',()=>{meta.notes[id]=input.value;meta.accepted=null;save();renderProject();});fields.set(id,input);notesBox.append(l,input);}
   checkBox=el('details',undefined,'project-checklist');checkBox.append(el('summary','ตรวจรายการก่อนส่งมอบ'));
   for(const[id,text]of PROJECT_CHECKS){const l=el('label'),input=el('input');input.type='checkbox';input.id='project-check-'+id;
    input.addEventListener('change',()=>{meta.checks=input.checked?[...new Set([...meta.checks,id])]:meta.checks.filter(x=>x!==id);meta.accepted=null;save();renderProject();});checks.set(id,input);l.append(input,document.createTextNode(text));checkBox.append(l);}
   const delivery=el('section',undefined,'project-delivery');delivery.append(el('h2','แฟ้มส่งมอบห้องเรียน'));pending=el('div');pending.id='project-readiness';pending.setAttribute('role','status');
   confirm=button('ยืนยันแฟ้มส่งมอบ',()=>{const r=projectReadiness(mission,scope.state,scope.catalog,meta);if(!r.ready)return;meta.accepted=projectSignature(mission,scope.state,r.meta);save();renderProject();},'primary');confirm.id='project-confirm';
   const json=button('↓ แฟ้มโครงการ JSON',()=>scope.download('AV-project-'+mission.id+'.json',JSON.stringify(projectPackage(mission,scope.state,scope.catalog,meta),null,2),'application/json'));json.id='project-json';
   const html=button('↓ เอกสารส่งมอบ HTML',()=>scope.download('AV-project-'+mission.id+'.html',projectHtml(mission,scope.state,scope.catalog,meta),'text/html'));html.id='project-html';
   const fileLabel=el('label','↑ เปิดแฟ้มโครงการ JSON','project-file'),file=el('input');file.type='file';file.accept='.json,application/json';file.id='project-import';fileLabel.append(file);
   file.addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;try{
    if(f.size>1000000)throw Error('ไฟล์ใหญ่เกิน 1 MB');const imported=parseProjectPackage(JSON.parse(await f.text()),scope.catalog);
    scope.ask('เปิดแฟ้มโครงการนี้?','จะแทนที่งานของภารกิจ '+imported.mission.id+' ในเบราว์เซอร์ สำเนาฉบับเดิมจะเก็บให้ดาวน์โหลดก่อนนำเข้า',()=>{
     try{const oldMission=mission;const oldDiagram=scope.state;const oldMeta=meta;
      const targetDiagram=imported.mission.id===mission.id?oldDiagram:(()=>{const prefix=scope.storagePrefix;scope.storagePrefix='av-port-lab.project.diagram.v1.'+imported.mission.id+'.';const d=scope.loadTask('free');scope.storagePrefix=prefix;return d;})();
      let targetMeta=oldMeta;if(imported.mission.id!==oldMission.id){const raw=localStorage.getItem('av-port-lab.project.notes.v1.'+imported.mission.id);targetMeta=raw?JSON.parse(raw):emptyProjectMeta();}
      localStorage.setItem('av-port-lab.project.import-backup.v1',JSON.stringify(projectPackage(imported.mission,targetDiagram,scope.catalog,targetMeta)));
      activate(imported.mission,imported);scope.notice('เปิดแฟ้มแล้ว ตรวจเอกสารและผลทดสอบก่อนส่งมอบ');
     }catch(err){scope.notice('นำเข้าไม่ได้: '+err.message+' กรุณาดาวน์โหลดงานเดิมก่อน');}
    });
   }catch(err){scope.notice('เปิดแฟ้มไม่ได้: '+err.message);}e.target.value='';});
   backup=button('↓ ฉบับก่อนนำเข้า',()=>{const raw=localStorage.getItem('av-port-lab.project.import-backup.v1');if(raw)scope.download('AV-project-backup.json',raw,'application/json');});backup.id='project-backup';backup.hidden=true;
   delivery.append(notesBox,checkBox,pending,confirm,json,html,fileLabel,backup,el('small','ไม่มีคะแนน · เนื้อหาคู่มือและรายการดูแลต้องให้ผู้สอนตรวจ · เก็บในเบราว์เซอร์นี้ ไม่มีการส่งผลอัตโนมัติ'));
   document.querySelector('.review-section').after(delivery);activate(mission,null,true);
  },
  render:renderProject,
  renderReview(){
   if(scope.review&&scope.review!==lastReview){lastReview=scope.review;const capture=captureProjectTest(mission,scope.state,scope.catalog,meta,testSelect.value);meta=capture.meta;save();}
   renderProject();
  },
  appendPrint(output){const section=scope.el('section',undefined,'project-print');section.innerHTML=projectBody(mission,scope.state,scope.catalog,meta,false);output.append(section);},
 };
}
