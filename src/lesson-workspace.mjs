import {mountActivityNavigation,createWorkspaceTabs,openDetails,element} from './workspace-ui.mjs?v=20261027-nav';
export function mountLessonWorkspace(scope){
 mountActivityNavigation();
 const pane=scope.pane,panel=pane.querySelector('.trouble-panel');
 const observe=element('div'),form=element('div',undefined,'trouble-form'),finish=element('div');
 const hint=panel.querySelector('.trouble-help'),heading=scope.$('trouble-case'),instruction=scope.$('trouble-instruction');
 observe.append(heading,scope.$('lesson-screen'),instruction,scope.$('trouble-run-check'),scope.$('trouble-attempt-count'),element('p','ปรับอุปกรณ์แล้วกดตรวจภาพ ทุกการกดนับ 1 ครั้ง การเขียนบันทึกและจบงานไม่นับเพิ่ม','small'),hint);
 const conclusion=scope.$('trouble-conclusion'),label=panel.querySelector('label[for="trouble-conclusion"]'),confirm=scope.$('trouble-confirm'),files=pane.querySelector('.trouble-files');
 const requirements=element('p','','small');requirements.id='trouble-finish-requirements';requirements.setAttribute('role','status');
 finish.append(element('h2','สรุปและจบงาน'),label,conclusion,requirements,confirm,element('p','จบงานเป็นการบันทึกว่าฝึกเสร็จ ไม่ใช่การตรวจภาพซ้ำหรือส่งงานให้ผู้สอน','small'),files);
 for(const n of [...panel.children]){if(n.matches('.tiny-title,small'))n.remove();else form.append(n);}
 form.prepend(element('p','บันทึกสิ่งที่ตรวจพบและสิ่งที่แก้ไข เพิ่มได้หลายรายการ โดยไม่เพิ่มจำนวนครั้งที่กดตรวจภาพ','small'));
 const tabs=createWorkspaceTabs(panel,[['1 ตรวจภาพ',[observe]],['2 บันทึก',[form]],['3 จบงาน',[finish]]],'ขั้นตอนตรวจปัญหา');
 const goNotes=element('button','ถัดไป: บันทึกสิ่งที่พบ','quiet-button full-width');goNotes.type='button';goNotes.addEventListener('click',()=>tabs.select(1));observe.append(goNotes);
 const goFinish=element('button','ถัดไป: สรุปและจบงาน','quiet-button full-width');goFinish.type='button';goFinish.addEventListener('click',()=>tabs.select(2));form.append(goFinish);
 finish.append(scope.$('next-scenario'));
 tabs.panels[0].append(scope.$('go-issue'),scope.$('why-feedback'));
 openDetails(pane);
 for(const el of pane.querySelectorAll('.result-tip,.lesson-assumption'))el.classList.add('workspace-secondary');
 scope.$('mode-guidance').classList.add('workspace-redundant');
 const assumptions=pane.querySelector('.lesson-assumption');if(assumptions)finish.append(assumptions);
 scope.$('image-progress').setAttribute('role','status');
 return {render(){
  const s=scope.getState(),n=s.troubleshoot,last=n.attemptLog?.at(-1);
  tabs.buttons[1].textContent='2 บันทึก'+(n.checks.length?' · '+n.checks.length:'');
  const fresh=last?.settingsSignature===JSON.stringify([s.links,s.power,s.sourceEnabled,s.displayInput,s.vertexSource,s.requestedSource]);
  const missing=[...(!fresh||last?.result.status!=='ready'?['กลับไปขั้น 1 และตรวจภาพให้ตรงเป้าหมาย']:[]),...(!n.checks.length?['เพิ่มบันทึกในขั้น 2 อย่างน้อย 1 รายการ']:[]),...(n.conclusion.trim().length<10?['เขียนสรุปอย่างน้อย 10 ตัวอักษร']:[])];
  requirements.textContent=missing.length?'ก่อนจบงาน: '+missing.join(' · '):'ครบแล้ว สามารถบันทึกจบงานและดาวน์โหลดรายงานได้';
 },focusPanel(){tabs.focus();},tabs};
}
