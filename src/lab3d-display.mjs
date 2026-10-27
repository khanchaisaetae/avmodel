import {evaluateScenario,validateSegment} from './scenario-engine.mjs';
import {SOURCE_NAMES} from './scenario-catalog.mjs';
// UC4 observes the signal on the selected input, independently of lesson targets or unused branches.
export function evaluateLabDisplay(task,state,catalog){
 const evaluated=evaluateScenario(task,state,catalog);
 if(evaluated.imageVisible)return {...evaluated,status:'signal',code:'DISPLAY_SIGNAL',complete:false,message:'กำลังแสดงภาพจาก '+SOURCE_NAMES[evaluated.actualSource]};
 if(!state.power[task.displayId])return {...evaluated,status:'off',message:'อุปกรณ์แสดงผลปิดอยู่'};
 if(evaluated.code==='WRONG_INPUT'){
  const i=task.segments.findIndex((s,i)=>s.to===task.displayId&&state.links[i].sinkPortId===state.displayInput);
  if(i>=0){const checked=validateSegment(task,state,i,catalog);if(['invalid','indeterminate'].includes(checked.status))return {...checked,imageVisible:false,complete:false};}
 }
 return {...evaluated,complete:false};
}
export function renderLabDisplay({root,caption,screen,status,input},task,state,catalog,{loading=false}={}){
 const result=loading?{status:'loading',imageVisible:false,message:'กำลังเตรียมอุปกรณ์…'}:evaluateLabDisplay(task,state,catalog);
 const make=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 root.dataset.device=task.displayId;root.dataset.status=result.status;root.dataset.source=result.actualSource||'';
 caption.textContent=task.displayId==='tv'?'หน้าจอ Sony TV':'ภาพฉาย Epson Projector';
 input.textContent='Input · '+(catalog.devices.find(d=>d.id===task.displayId).ports.find(p=>p.id===state.displayInput)?.label||'ยังไม่เลือก');
 screen.replaceChildren();
 if(result.imageVisible){
  const source=result.actualSource,visual=make('div',undefined,'sim-picture sim-'+source);visual.setAttribute('aria-hidden','true');
  if(source==='dell'){
   const window=make('div',undefined,'sim-window');window.append(make('div','● ● ●','sim-window-bar'),make('strong','VIRTUAL AV LAB'),make('span','สื่อการเรียนรู้','sim-document-title'));visual.append(window,make('div','▦    ▰    ▧','sim-taskbar'));
  }else if(source==='bluray'){
   visual.append(make('div','▶','sim-play'),make('span','Blu-ray · กำลังเล่น','sim-video-label'));
  }else{
   const page=make('div',undefined,'sim-paper');page.append(make('strong','เอกสารสาธิต'),make('div','▧','sim-document-image'),make('div','━━━━━━\n━━━━━━━━\n━━━━━','sim-paper-lines'));visual.append(page);
  }
  screen.append(visual,make('span',SOURCE_NAMES[source],'sim-source-name'));
 }else{
  const title=result.status==='loading'?'กำลังโหลด':result.status==='off'?'ปิดเครื่อง':result.status==='indeterminate'?(result.code==='MISSING_SELECTION'?'ยังต่อสายไม่ครบ':'ยังไม่จำลองเส้นทางนี้'):'ไม่มีสัญญาณภาพ';
  const empty=make('div',undefined,'sim-no-signal');empty.append(make('span',result.status==='off'?'⏻':'▣','sim-screen-icon'),make('strong',title));screen.append(empty);
 }
 screen.setAttribute('aria-label',(task.displayId==='tv'?'Sony TV':'Epson Projector')+' · '+(result.imageVisible?result.message:screen.textContent));
 status.textContent=result.message;return result;
}
