import { CHECK_CATEGORIES } from './troubleshoot-catalog.mjs';
import { initialTroubleshoot,lastTroubleshootResult,runTroubleshootCheck,preserveTroubleshootAttempts,reviewTroubleshoot,completionRequirements,recordCheck,confirmTroubleshoot,troubleHint,troubleshootReport } from './troubleshoot-model.mjs?v=20261031-manual-check';

export function createTroubleshootActivity(){
  let checkButton,attemptCount,category,observation,log,conclusion,confirm,hint,hintButton,instruction,status,caseTitle,previous,previousReport=null,currentTask=null;
  const reportKey='av-port-lab.troubleshoot-report.v1';
  const download=(scope,value)=>{
    const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'}));
    const a=scope.create('a');a.href=url;a.download='AV-troubleshoot-'+
      (scope.SCENARIOS.some(t=>t.id===value.taskId)?value.taskId:scope.task.id)+'.json';
    document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
  };
  function save(scope){
    const s=scope.getState();
    if(!s.troubleshoot.attemptLog?.length&&!s.troubleshoot.checks.length&&!s.troubleshoot.conclusion.trim())return;
    try{const value=troubleshootReport(scope.task,s,scope.catalog);localStorage.setItem(reportKey,JSON.stringify(value));
      previousReport=value;status.textContent='บันทึกรายงานล่าสุดในเบราว์เซอร์นี้แล้ว';
    }catch{status.textContent='บันทึกในเบราว์เซอร์ไม่ได้ ดาวน์โหลด JSON เพื่อเก็บผลฝึก';}
  }
  return {
    evaluate:lastTroubleshootResult,preserveHistory:preserveTroubleshootAttempts,initial:initialTroubleshoot,review:reviewTroubleshoot,issueLocation:()=>null,maskFeedback:true,
    mount(scope){
      const {create,$}=scope;
      try{const raw=localStorage.getItem(reportKey);if(raw&&raw.length<1000000){const value=JSON.parse(raw);
        if(value?.schema==='av-port-lab.troubleshoot-report'&&[1,2].includes(value.version))previousReport=value;}}catch{}
      const panel=create('section',undefined,'trouble-panel');panel.setAttribute('aria-label','บันทึกการตรวจและแก้ปัญหา');
      panel.append(create('span','ยูสเคส 5 · สังเกต → ตรวจ → แก้ → ยืนยัน','tiny-title'));
      caseTitle=create('h2');caseTitle.id='trouble-case';
      instruction=create('p');instruction.id='trouble-instruction';
      const catLabel=create('label','จุดที่ตรวจ');catLabel.htmlFor='trouble-category';
      category=create('select');category.id='trouble-category';
      for(const[id,text]of CHECK_CATEGORIES){const o=create('option',text);o.value=id;category.append(o);}
      const obsLabel=create('label','พบอะไรจากการตรวจ');obsLabel.htmlFor='trouble-observation';
      observation=create('textarea');observation.id='trouble-observation';observation.rows=2;observation.maxLength=1000;
      observation.placeholder='เช่น ตรวจชื่อช่องรับภาพเทียบกับสายที่เสียบ พบว่า…';
      const add=create('button','＋ บันทึกผลตรวจ','quiet-button full-width');add.id='trouble-add-check';add.type='button';
      const logStatus=create('p','','small');logStatus.id='trouble-log-status';logStatus.setAttribute('role','status');
      add.addEventListener('click',()=>{
        const checked=recordCheck(scope.task,scope.getState(),scope.catalog,category.value,observation.value);
        if(!checked.accepted){logStatus.textContent='เขียนสิ่งที่พบอย่างน้อย 3 ตัวอักษร (บันทึกได้สูงสุด 30 รายการ)';return;}
        observation.value='';logStatus.textContent='บันทึกผลตรวจแล้ว';scope.mutate(checked.state);
      });
      const logDetails=create('details');logDetails.append(create('summary','รายการที่ตรวจแล้ว'));log=create('ol');log.id='trouble-checks';logDetails.append(log);
      const reasonLabel=create('label','สรุปสาเหตุและวิธีแก้');reasonLabel.htmlFor='trouble-conclusion';
      conclusion=create('textarea');conclusion.id='trouble-conclusion';conclusion.rows=3;conclusion.maxLength=2000;
      conclusion.placeholder='สาเหตุที่พบคือ… แก้โดย… ตรวจซ้ำแล้วภาพจาก…';
      conclusion.addEventListener('input',()=>{
        const s=scope.getState();scope.put({...s,troubleshoot:{...s.troubleshoot,conclusion:conclusion.value,confirmedSignature:null}});scope.render();
      });
      confirm=create('button','ยืนยันการแก้ปัญหา','primary full-width');confirm.id='trouble-confirm';confirm.type='button';
      confirm.addEventListener('click',()=>{const checked=confirmTroubleshoot(scope.task,scope.getState(),scope.catalog);
        if(checked.accepted){scope.closeContext();scope.mutate(checked.state);}});
      checkButton=create('button','ตรวจ','primary full-width');checkButton.id='trouble-run-check';checkButton.type='button';
      attemptCount=create('p','','small');attemptCount.id='trouble-attempt-count';attemptCount.setAttribute('role','status');
      checkButton.addEventListener('click',()=>{scope.put(runTroubleshootCheck(scope.task,scope.getState(),scope.catalog));scope.render();});
      const note=create('small','ตรวจภาพเมื่อกดปุ่มตรวจเท่านั้น · ทุกการกดนับเป็น 1 ครั้ง รวมการตรวจซ้ำโดยไม่แก้ไข · ข้อความสาเหตุเก็บให้ผู้สอนตรวจ ไม่ได้ตัดสินความถูกต้องของข้อความหรือให้คะแนน');
      panel.append(caseTitle,scope.$('lesson-screen'),instruction,checkButton,attemptCount,catLabel,category,obsLabel,observation,add,logStatus,logDetails,reasonLabel,conclusion,confirm,note);
      scope.pane.prepend(panel);
      const help=create('section',undefined,'trouble-help');
      hintButton=create('button','ขอคำใบ้ 1/3','quiet-button full-width');hintButton.id='trouble-hint';hintButton.type='button';
      hint=create('p');hint.id='trouble-hint-text';hint.setAttribute('role','status');
      hintButton.addEventListener('click',()=>{const s=scope.getState();scope.mutate({...s,troubleshoot:{...s.troubleshoot,hintLevel:Math.min(3,s.troubleshoot.hintLevel+1)}});});
      help.append(hintButton,hint);panel.insertBefore(help,catLabel);
      const files=create('details',undefined,'trouble-files');files.append(create('summary','รายงานและประวัติการฝึก'));
      const saveButton=create('button','↓ ดาวน์โหลดรายงาน JSON','quiet-button full-width');saveButton.type='button';saveButton.id='trouble-download';
      saveButton.addEventListener('click',()=>download(scope,troubleshootReport(scope.task,scope.getState(),scope.catalog)));
      previous=create('button','↓ รายงานที่บันทึกไว้ล่าสุด','quiet-button full-width');previous.type='button';previous.id='trouble-saved-report';
      previous.addEventListener('click',()=>{if(previousReport)download(scope,previousReport);});
      status=create('p','','small');status.id='trouble-save-state';status.setAttribute('role','status');
      files.append(saveButton,previous,status,create('p','เก็บรหัสโจทย์สำเร็จและรายงานล่าสุดในเครื่องนี้ สถานะการฝึกเริ่มใหม่เมื่อโหลดหน้า ดาวน์โหลดก่อนเปลี่ยนโจทย์ ไม่มีคะแนนหรือการส่งผลอัตโนมัติ','small'));
      scope.pane.append(files);
      $('learning-mode').disabled=true;
      scope.picker.querySelector('.tiny-title').textContent='ยูสเคส 5 · แก้ปัญหาภาพ';$('task-title').textContent='เลือกสถานการณ์แก้ปัญหา';
      scope.reset.querySelector('#reset-title').textContent='เริ่มตรวจสถานการณ์นี้ใหม่?';
      scope.reset.querySelector('p').textContent='คืนสภาพปัญหาตั้งต้น และล้างบันทึกการตรวจของรอบนี้ สามารถย้อนกลับการแก้ไขก่อนกดเริ่มใหม่ได้';
      scope.pane.querySelector('.result-heading').hidden=true;
    },
    render(scope,live){
      const {$,create}=scope,s=scope.getState(),n=s.troubleshoot,r=completionRequirements(scope.task,s,scope.catalog);
      if(currentTask!==scope.task.id){currentTask=scope.task.id;observation.value='';category.value=CHECK_CATEGORIES[0][0];scope.$('trouble-log-status').textContent='';}
      attemptCount.textContent='ตรวจแล้ว '+(n.attemptLog?.length||0)+' ครั้ง';
      const complete=reviewTroubleshoot(scope.task,s,scope.catalog).result.complete;
      caseTitle.textContent=scope.task.level+' · '+scope.short(s.requestedSource)+' → '+scope.short(scope.task.displayId);
      const remaining=[...(!r.hasChecks?['บันทึกผลตรวจอย่างน้อย 1 รายการ']:[]),...(!r.hasConclusion?['สรุปสาเหตุและวิธีแก้อย่างน้อย 10 ตัวอักษร']:[])];
      instruction.textContent=complete?'✓ ยืนยันคืนภาพแล้ว ทบทวนบันทึกและดาวน์โหลดรายงานได้':
        live.status==='pending'?'แก้ไขที่อุปกรณ์แล้วกดตรวจเพื่อบันทึกผลครั้งถัดไป':live.status==='ready'?(remaining.length?'ภาพกลับมาแล้ว · '+remaining.join(' · '):'ภาพตรงเป้าหมายแล้ว กดยืนยันการแก้ปัญหา'):
        'ตรวจจากต้นทางไปปลายทาง แล้วปรับที่อุปกรณ์บนผัง บันทึกสิ่งที่พบก่อนหรือหลังแก้ได้';
      confirm.disabled=complete||!r.ready;confirm.textContent=complete?'✓ ยืนยันการแก้ปัญหาแล้ว':'ยืนยันการแก้ปัญหา';
      if(document.activeElement!==conclusion)conclusion.value=n.conclusion;
      log.replaceChildren();for(const check of n.checks){const item=create('li');
        item.append(create('strong',CHECK_CATEGORIES.find(([id])=>id===check.category)?.[1]||''),
          create('p',check.observation),create('small',check.resultCode==='AWAITING_CHECK'?'ยังไม่ได้กดตรวจสถานะนี้':check.imageVisible?'พบภาพบนจอ':'ยังไม่มีภาพบนจอ'));log.append(item);}
      hintButton.disabled=n.hintLevel>=3;hintButton.textContent=n.hintLevel>=3?'เปิดคำใบ้ครบ 3 ระดับแล้ว':'ขอคำใบ้ '+(n.hintLevel+1)+'/3';
      hint.textContent=troubleHint(scope.task,s,scope.catalog);hint.hidden=!n.hintLevel;
      $('mode-guidance').textContent='สถานการณ์มีปัญหาเตรียมไว้แล้ว · ตรวจและแก้ที่อุปกรณ์ · คำใบ้เปิดเมื่อขอ · ไม่มีคะแนน';
      $('image-progress').textContent=complete?'ยืนยันแล้ว':'รอตรวจยืนยัน';
      $('screen-status').textContent=live.status==='pending'?'○ รอกดตรวจ':complete?'✓ คืนภาพและยืนยันแล้ว':live.status==='ready'?'✓ ภาพกลับมาแล้ว · รอยืนยัน':live.imageVisible?'▶ มีภาพ · ตรวจว่าใช่แหล่งเป้าหมายหรือไม่':'○ ยังไม่มีภาพ';
      $('next-source').hidden=true;$('go-issue').hidden=true;$('why-feedback').hidden=true;
      for(const node of scope.table.querySelectorAll('.issue'))node.classList.remove('issue');
      previous.hidden=!previousReport;previous.textContent='↓ รายงานล่าสุด ('+(previousReport?.taskId||'')+')';
      save(scope);
      if(!n.attemptLog?.length&&!n.checks.length&&!n.conclusion.trim())status.textContent=previousReport?'รายงานครั้งก่อนยังอยู่ เริ่มบันทึกผลตรวจเพื่อเก็บรายงานใหม่':'รายงานจะบันทึกเมื่อกดตรวจ เพิ่มบันทึก หรือสรุปสาเหตุ';
    },
  };
}
