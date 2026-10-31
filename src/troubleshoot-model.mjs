import { initialScenario, evaluateScenario } from './scenario-engine.mjs';
import { CHECK_CATEGORIES } from './troubleshoot-catalog.mjs';

export function systemSignature(s) {
  return JSON.stringify([s.links,s.power,s.sourceEnabled,s.displayInput,s.vertexSource,s.requestedSource]);
}
function confirmationSignature(s) {
  return JSON.stringify([systemSignature(s),s.troubleshoot.checks,s.troubleshoot.conclusion]);
}
export function initialTroubleshoot(task) {
  const s=initialScenario(task),used={};
  for(const id of task.devices)s.power[id]=true;
  for(const id of Object.keys(s.sourceEnabled))s.sourceEnabled[id]=true;
  s.vertexSource='HDMI IN';
  s.links=task.segments.map(seg=>({
    sourcePortId:{dell:'dell:hdmi',bluray:'bluray:hdmi1',vertex:'vertex:hdmi-out'}[seg.from],
    sinkPortId:seg.to==='vertex'?'vertex:hdmi-in':seg.to==='epson'?'epson:hdmi'+(used.epson=(used.epson||0)+1):
      (used.tv=(used.tv||0)+1)===1?'tv:hdmi-rear':'tv:hdmi-side',
    cableId:'hdmi',connected:true,
  }));
  s.displayInput=s.links[task.routes[0].segments.at(-1)].sinkPortId;
  for(const fault of task.faults){
    if(fault==='display-off')s.power[task.displayId]=false;
    if(fault==='output-off'||fault==='play-off')s.sourceEnabled[task.sources[0]]=false;
    if(fault==='wrong-input')s.displayInput=task.displayId==='epson'?'epson:hdmi2':'tv:hdmi-side';
    if(fault==='unplugged')s.links[0]={...s.links[0],cableId:'',connected:false};
    if(fault==='wrong-cable')s.links[0]={...s.links[0],cableId:'vga',connected:false};
    if(fault==='audio-only')s.links[0].sourcePortId='bluray:hdmi2';
    if(fault==='middle-off')s.power.vertex=false;
    if(fault==='camera-selected')s.vertexSource='CAMERA';
    if(fault==='rgb-selected')s.vertexSource='PC1';
    if(fault==='occupied-input')s.links[1].sinkPortId=s.links[0].sinkPortId;
  }
  s.troubleshoot={runId:globalThis.crypto?.randomUUID?.() || String(Date.now())+Math.random(),attemptLog:[],checks:[],conclusion:'',hintLevel:0,confirmedSignature:null};
  return s;
}
export function lastTroubleshootResult(task,s,catalog) {
  const last=s.troubleshoot.attemptLog?.at(-1);
  if(!last || last.settingsSignature!==systemSignature(s))return {status:'pending',code:'AWAITING_CHECK',imageVisible:false,complete:false,message:'มีการแก้ไขหรือยังไม่ได้ตรวจ · กดตรวจเพื่อดูผล'};
  return structuredClone(last.result);
}
export function runTroubleshootCheck(task,s,catalog,timestamp=new Date().toISOString()) {
  const attempts=s.troubleshoot.attemptLog || [];
  const result=evaluateScenario(task,s,catalog);
  const entry={number:attempts.length+1,timestamp,settingsSignature:systemSignature(s),
    snapshot:structuredClone({links:s.links,power:s.power,sourceEnabled:s.sourceEnabled,displayInput:s.displayInput,vertexSource:s.vertexSource,requestedSource:s.requestedSource}),
    hintsUsed:s.troubleshoot.hintLevel,result:structuredClone(result)};
  return {...s,troubleshoot:{...s.troubleshoot,attemptLog:[...attempts,entry],confirmedSignature:null}};
}
export function preserveTroubleshootAttempts(previous,next) {
  if(!previous.troubleshoot)return next;
  return {...next,troubleshoot:{...next.troubleshoot,runId:previous.troubleshoot.runId,attemptLog:previous.troubleshoot.attemptLog || [],confirmedSignature:null}};
}
export function completionRequirements(task,s,catalog) {
  const live=lastTroubleshootResult(task,s,catalog),notes=s.troubleshoot;
  return {live,hasChecks:notes.checks.length>0,hasConclusion:notes.conclusion.trim().length>=10,
    ready:live.status==='ready'&&notes.checks.length>0&&notes.conclusion.trim().length>=10};
}
export function reviewTroubleshoot(task,s,catalog) {
  const r=completionRequirements(task,s,catalog);
  const complete=r.ready&&s.troubleshoot.confirmedSignature===confirmationSignature(s);
  return {state:{...s,observedSources:complete?[s.requestedSource]:[]},result:{
    ...r.live,code:r.live.status==='ready'?'PICTURE_RESTORED':'INVESTIGATE',complete,
    message:r.live.status==='ready'?'ภาพตรงเป้าหมายแล้ว บันทึกผลตรวจและสรุปสาเหตุก่อนยืนยัน':
      'สังเกตภาพและสถานะบนอุปกรณ์ แล้วตรวจเส้นทางจากต้นทางไปยังจอ ขอคำใบ้ได้เมื่อจำเป็น',
  }};
}
export function recordCheck(task,s,catalog,category,observation,timestamp=new Date().toISOString()) {
  if(!CHECK_CATEGORIES.some(([id])=>id===category)||observation.trim().length<3||s.troubleshoot.checks.length>=30)
    return {state:s,accepted:false};
  const live=lastTroubleshootResult(task,s,catalog);
  const check={category,observation:observation.trim().slice(0,1000),timestamp,
    imageVisible:live.imageVisible,actualSource:live.actualSource||null,resultCode:live.code,
    settingsSignature:systemSignature(s)};
  return {accepted:true,state:{...s,troubleshoot:{...s.troubleshoot,
    checks:[...s.troubleshoot.checks,check],conclusion:check.observation,confirmedSignature:null}}};
}
export function confirmTroubleshoot(task,s,catalog) {
  const r=completionRequirements(task,s,catalog);
  if(!r.ready)return {state:s,accepted:false};
  return {accepted:true,state:{...s,troubleshoot:{...s.troubleshoot,confirmedSignature:confirmationSignature(s)}}};
}
export function troubleHint(task,s,catalog) {
  const n=s.troubleshoot.hintLevel,r=lastTroubleshootResult(task,s,catalog);
  if(!n)return '';
  if(n===1)return 'ตรวจตามลำดับ: เปิดเครื่อง → เปิดส่งภาพ / เล่นสื่อ → พอร์ต OUT ไป IN และสาย → SOURCE ของอุปกรณ์กลาง → Input ของจอ';
  if(n===2){
    if(['DISPLAY_OFF','POWER_OFF'].includes(r.code))return 'ตรวจไฟเลี้ยงและสถานะเปิดเครื่องทุกตัวที่อยู่ในเส้นทางภาพ';
    if(r.code==='SOURCE_DISABLED')return 'ตรวจว่าต้นทางเริ่มเล่นสื่อหรือเปิดส่งภาพออกจอภายนอกแล้วหรือยัง';
    if(['WRONG_SOURCE','VERTEX_SIGNAL_TYPE','VERTEX_INPUT_MISSING'].includes(r.code))return 'เปรียบเทียบ SOURCE ของ Vertex กับสายที่ใช้ และแยกการเลือกแหล่งภาพออกจาก Input ของจอ';
    if(['WRONG_INPUT','INPUT_NOT_SELECTED'].includes(r.code))return 'เทียบชื่อ Input ที่จอเลือกอยู่กับพอร์ตที่เสียบสายจริง';
    if(r.status==='ready')return 'ภาพกลับมาแล้ว ทบทวนสิ่งที่เปลี่ยน แล้วบันทึกผลตรวจและเหตุผล';
    return 'ตรวจชื่อพอร์ต ชนิดสาย การเสียบครบ และพอร์ตเดียวมีสายซ้ำกันหรือไม่ HDMI ของ Blu-ray แต่ละช่องทำหน้าที่ต่างกัน';
  }
  return r.message;
}
export function troubleshootReport(task,s,catalog) {
  const checked=reviewTroubleshoot(task,s,catalog);
  return {schema:'av-port-lab.troubleshoot-report',version:2,runId:s.troubleshoot.runId,attemptCount:(s.troubleshoot.attemptLog||[]).length,attemptLog:structuredClone(s.troubleshoot.attemptLog||[]),taskId:task.id,title:task.title,symptom:task.symptom,
    complete:checked.result.complete,checks:structuredClone(s.troubleshoot.checks),
    conclusion:s.troubleshoot.conclusion,hintsUsed:s.troubleshoot.hintLevel,
    links:structuredClone(s.links),settings:{power:{...s.power},sourceEnabled:{...s.sourceEnabled},
      displayInput:s.displayInput,vertexSource:s.vertexSource},
    currentResult:lastTroubleshootResult(task,s,catalog),
    note:'ผลจำลองการแก้ปัญหา ไม่มีคะแนน ตรวจภาพเฉพาะเมื่อกดตรวจ จำนวนครั้งนับทุกการกดรวมการตรวจซ้ำโดยไม่แก้ไข ข้อความเหตุผลต้องตรวจโดยผู้สอน ไม่ส่งผลอัตโนมัติ'};
}
