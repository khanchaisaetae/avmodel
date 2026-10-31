import {DEVICE_NAMES} from './scenario-catalog.mjs';
export function printTroubleshootReport(report,catalog){
 document.getElementById('trouble-print-report')?.remove();
 if(!document.getElementById('trouble-print-style')){
  const style=document.createElement('style');style.id='trouble-print-style';
  style.textContent=`#trouble-print-report{display:none}@media print{@page{size:A4 portrait;margin:15mm}body>*{display:none!important}body>#trouble-print-report{display:block!important;color:#111;font:11pt/1.6 "Noto Sans Thai",Tahoma,sans-serif}#trouble-print-report h1{font-size:18pt}#trouble-print-report h2{font-size:13pt;break-after:avoid}#trouble-print-report p{font-size:11pt;white-space:pre-wrap;overflow-wrap:anywhere}#trouble-print-report table{width:100%;border-collapse:collapse;font-size:10pt}#trouble-print-report th,#trouble-print-report td{border:1px solid #999;padding:5px;text-align:left;overflow-wrap:anywhere}#trouble-print-report tr{break-inside:avoid}#trouble-print-report thead{display:table-header-group}}`;
  document.head.append(style);
 }
 const root=document.createElement('section');root.id='trouble-print-report';
 const add=(tag,text,parent=root)=>{const el=document.createElement(tag);el.textContent=text;parent.append(el);return el;};
 add('h1','VIRTUAL AV LAB · LAB4 แก้ปัญหาภาพ');
 add('p',report.taskId+' · '+report.title);add('p','ชื่อ–สกุล ........................................ รหัสนิสิต ........................................');
 add('p','สถานการณ์: '+report.symptom);
 add('p',`จำนวนครั้งที่กดตรวจ: ${report.attemptCount} ครั้ง · คำใบ้ที่ใช้: ${report.hintsUsed} ระดับ`);
 add('p','ผลตรวจล่าสุด: '+report.currentResult.message);
 add('h2','ประวัติการกดตรวจ');
 const table=add('table',''),head=add('thead','',table),hr=add('tr','',head);for(const label of ['ครั้ง','วัน–เวลา','ผลตรวจ'])add('th',label,hr);
 const body=add('tbody','',table);
 for(const attempt of report.attemptLog){const row=add('tr','',body);for(const text of [attempt.number,new Date(attempt.timestamp).toLocaleString('th-TH',{timeZone:'Asia/Bangkok'}),attempt.result.message])add('td',text,row);}
 
 report.checks.forEach((check,i)=>add('p',`${i+1}. ${check.observation}`));
 add('h2','สิ่งที่พบจากการตรวจ/สรุปสาเหตุและวิธีแก้');add('p',report.conclusion||'ยังไม่ได้ระบุ');
 add('h2','การเชื่อมต่อสุดท้าย');
 const ports=new Map(catalog.devices.flatMap(d=>d.ports.map(p=>[p.id,p.label])));
 report.links.forEach((l,i)=>add('p',`${i+1}. ${DEVICE_NAMES[l.sourcePortId?.split(':')[0]]||''} / ${ports.get(l.sourcePortId)||'ยังไม่เลือก'} → ${DEVICE_NAMES[l.sinkPortId?.split(':')[0]]||''} / ${ports.get(l.sinkPortId)||'ยังไม่เลือก'} · ${l.cableId||'ยังไม่เลือกสาย'}`));
 add('p','รหัสรอบ: '+report.runId);add('p',report.note);
 document.body.append(root);window.print();
}
