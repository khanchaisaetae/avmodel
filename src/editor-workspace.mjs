import {mountActivityNavigation,createWorkspaceTabs,openDetails,element} from './workspace-ui.mjs';
import {canvasBounds,fitCanvas,arrangeDevices} from './workspace-geometry.mjs';
export function mountEditorWorkspace(scope){
 mountActivityNavigation();
 const project=document.body.dataset.activity==='project',transfer=document.body.dataset.activity==='transfer';
 const props=document.querySelector('.properties'),stage=document.querySelector('.design-space'),canvas=scope.$('diagram-canvas'),scroll=document.querySelector('.canvas-scroll');
 const heading=props.querySelector('h2'),selection=scope.$('diagram-selection'),dock=element('section',undefined,'selection-dock');dock.setAttribute('aria-label','แก้ไขรายการในผัง');
 const close=element('button','ปิด ×','selection-close');close.type='button';close.setAttribute('aria-label','ยกเลิกการเลือกรายการ');close.addEventListener('click',()=>{scope.selection=null;scope.render();});
 dock.append(selection,close);heading.remove();document.querySelector('.canvas-toolbar').after(dock);
 const reason=document.querySelector('.reason-panel'),review=document.querySelector('.review-section'),files=document.querySelector('.file-panel');
 const documents=[reason],delivery=[];let tabs;
 if(project){
  const group=document.querySelector('.project-delivery');documents.push(group.querySelector('.project-documents'));
  for(const n of [...group.children])if(n!==documents[1])delivery.push(n);group.remove();delivery.push(files);
  tabs=createWorkspaceTabs(props,[['ทดลอง',[review]],['เอกสาร',documents],['ส่งมอบ',delivery]],'ขั้นตอนโครงการ');
 }else{
  const handoff=document.querySelector('.transfer-handoff');const report=document.getElementById('transfer-report');
  if(report)files.prepend(report);
  tabs=createWorkspaceTabs(props,[['ตรวจผัง',[review,handoff]],['เหตุผล',documents],['ไฟล์',[files]]],'แผงทำงาน');
 }
 openDetails(props);
 if(project){files.classList.remove("workspace-unfolded");files.open=false;files.querySelector("summary").textContent="ผัง SVG / JSON และพิมพ์";}
 for(const d of props.querySelectorAll('.project-documents,.project-checklist')){d.open=true;d.classList.add('workspace-unfolded');}
 const footer=element('div',undefined,'workspace-actions'),reviewButton=scope.$('diagram-review'),confirm=scope.$(project?'project-confirm':'transfer-confirm');
 footer.append(reviewButton);if(confirm)footer.append(confirm);props.append(footer);
 reviewButton.addEventListener('click',()=>tabs.select(0));
 function updateActions(){reviewButton.hidden=project&&tabs.active===2;if(confirm)confirm.hidden=project&&tabs.active!==2;}
 props.addEventListener('workspace-tab-change',updateActions);
 const canvasTools=element('div',undefined,'canvas-view-tools');canvasTools.setAttribute('aria-label','มุมมองผัง');
 const fit=element('button','พอดีจอ'),minus=element('button','−'),zoom=element('span','100%'),plus=element('button','＋'),arrange=element('button','จัดเรียงอุปกรณ์');
 fit.id='canvas-fit';minus.id='canvas-zoom-out';plus.id='canvas-zoom-in';zoom.id='canvas-zoom';arrange.id='canvas-arrange';
 minus.setAttribute('aria-label','ย่อผัง');plus.setAttribute('aria-label','ขยายผัง');for(const b of [fit,minus,plus,arrange])b.type='button';canvasTools.append(fit,minus,zoom,plus,arrange);
 document.querySelector('.canvas-help').replaceWith(canvasTools);
 const wrapper=element('div',undefined,'canvas-scaled-area');canvas.before(wrapper);wrapper.append(canvas);
 let scale=1,autoFit=true,bounds={x:0,y:0,width:1200,height:1100},frame;
 function apply(){
  frame=null;const nodes=[...document.querySelectorAll('#diagram-nodes .diagram-node,#diagram-wire-labels button')].map(n=>({x:n.offsetLeft,y:n.offsetTop,width:n.offsetWidth,height:n.offsetHeight}));
  bounds=canvasBounds(nodes);if(autoFit)scale=fitCanvas(bounds,scroll.clientWidth,scroll.clientHeight);
  canvas.style.transformOrigin='0 0';canvas.style.transform='scale('+scale+')';canvas.style.position='absolute';canvas.style.left=-bounds.x*scale+'px';canvas.style.top=-bounds.y*scale+'px';
  wrapper.style.width=bounds.width*scale+'px';wrapper.style.height=bounds.height*scale+'px';zoom.textContent=Math.round(scale*100)+'%';
  wrapper.scrollTop=0;wrapper.scrollLeft=0;fit.setAttribute('aria-pressed',String(autoFit));scope.drawWires();
 }
 function schedule(){if(!frame)frame=requestAnimationFrame(apply);}
 fit.addEventListener('click',()=>{autoFit=true;schedule();scroll.scrollTo({left:0,top:0});});
 minus.addEventListener('click',()=>{autoFit=false;scale=Math.max(.1,scale-.1);schedule();});plus.addEventListener('click',()=>{autoFit=false;scale=Math.min(1.6,scale+.1);schedule();});
 arrange.addEventListener('click',()=>{autoFit=true;scope.commit({...scope.state,nodes:arrangeDevices(scope.state.nodes)});});
 window.addEventListener('resize',schedule);const observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(schedule):null;observer?.observe(scroll);
 const library=document.querySelector('.library'),deviceBox=scope.$('diagram-devices');deviceBox.classList.add('compact-devices');
 if(transfer){
  const reference=library.querySelector('.transfer-reference'),catalog=element('div');const deviceHeading=deviceBox.previousElementSibling;catalog.append(deviceHeading,deviceBox);
  const leftRoot=element('div',undefined,'library-switch');reference.before(leftRoot);createWorkspaceTabs(leftRoot,[['สำรวจระบบ',[reference]],['เพิ่มอุปกรณ์',[catalog]]],'ระบบอ้างอิงและอุปกรณ์');
 }
 if(project){const brief=scope.$('project-brief'),details=element('details',undefined,'mission-details');details.append(element('summary','รายละเอียดภารกิจ'),brief);document.querySelector('.project-brief select').after(details);}
 scope.$('diagram-json').textContent='↓ ผังสำหรับเปิดแก้ไข (JSON)';scope.$('diagram-svg').textContent='↓ ภาพผัง SVG';
 const hint=element('p','ลากชื่อเพื่อย้าย · คลิกสายเพื่อเลือกชนิด · ใช้ ＋ เพื่อขยายพอร์ต','workspace-help');stage.append(hint);
 return {get scale(){return scale;},render(){
  const state=scope.state;dock.hidden=!scope.selection;arrange.disabled=!state.nodes.length;
  if(!scope.pending){const incomplete=state.links.filter(l=>!l.cableId).length;scope.$('drawing-instruction').textContent=!state.nodes.length?'เริ่มจากเพิ่มอุปกรณ์ทางซ้าย':state.nodes.length<2?'เพิ่มอีกอุปกรณ์เพื่อเริ่มเชื่อมต่อ':!state.links.length?'เลือกเอาท์พุตพอร์ต แล้วเลือกอินพุตพอร์ตของปลายทาง':incomplete?'คลิกสายที่ยังไม่ครบ เพื่อเลือกชนิดสาย':'ตั้งค่าบนอุปกรณ์ แล้วทดลองภาพในแผงด้านขวา';}
  reviewButton.disabled=state.nodes.length<2&&state.taskId!=='analysis-01';
  reviewButton.hidden=project&&tabs.active===2;if(confirm)confirm.hidden=project&&tabs.active!==2;
  schedule();
 },showSelection(){dock.hidden=!scope.selection;},focusPanel(){tabs.focus();},tabs};
}
