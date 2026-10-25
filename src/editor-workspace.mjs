import {mountActivityNavigation,createWorkspaceTabs,openDetails,element} from './workspace-ui.mjs?v=20261025-four';
import {canvasBounds,fitCanvas,arrangeDevices} from './workspace-geometry.mjs';
export function mountEditorWorkspace(scope){
 mountActivityNavigation();
 const props=document.querySelector('.properties'),stage=document.querySelector('.design-space'),canvas=scope.$('diagram-canvas'),scroll=document.querySelector('.canvas-scroll');
 const heading=props.querySelector('h2'),selection=scope.$('diagram-selection'),dock=element('section',undefined,'selection-dock');dock.setAttribute('aria-label','แก้ไขรายการในผัง');
 const close=element('button','ปิด ×','selection-close');close.type='button';close.setAttribute('aria-label','ยกเลิกการเลือกรายการ');close.addEventListener('click',()=>{scope.selection=null;scope.render();});
 dock.append(selection,close);heading.remove();document.querySelector('.canvas-toolbar').after(dock);
 const reason=document.querySelector('.reason-panel'),review=document.querySelector('.review-section'),files=document.querySelector('.file-panel');
 const tabs=createWorkspaceTabs(props,[['ตรวจผัง',[review]],['เหตุผล',[reason]],['ไฟล์',[files]]],'แผงทำงาน');
 openDetails(props);
 const footer=element('div',undefined,'workspace-actions'),reviewButton=scope.$('diagram-review');
 footer.append(reviewButton);props.append(footer);
 reviewButton.addEventListener('click',()=>tabs.select(0));
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
 scope.$('diagram-json').textContent='↓ ผังสำหรับเปิดแก้ไข (JSON)';scope.$('diagram-svg').textContent='↓ ภาพผัง SVG';
 const hint=element('p','ลากชื่อเพื่อย้าย · คลิกสายเพื่อเลือกชนิด · ใช้ ＋ เพื่อขยายพอร์ต','workspace-help');stage.append(hint);
 return {get scale(){return scale;},render(){
  const state=scope.state;dock.hidden=!scope.selection;arrange.disabled=!state.nodes.length;
  if(!scope.pending){const incomplete=state.links.filter(l=>!l.cableId).length;scope.$('drawing-instruction').textContent=!state.nodes.length?'เริ่มจากเพิ่มอุปกรณ์ด้านบน':state.nodes.length<2?'เพิ่มอีกอุปกรณ์เพื่อเริ่มเชื่อมต่อ':!state.links.length?'เลือกเอาท์พุตพอร์ต แล้วเลือกอินพุตพอร์ตของปลายทาง':incomplete?'คลิกสายที่ยังไม่ครบ เพื่อเลือกชนิดสาย':'ตั้งค่าบนอุปกรณ์ แล้วทดลองภาพในแผงด้านขวา';}
  reviewButton.disabled=state.nodes.length<2&&state.taskId!=='analysis-01';
  schedule();
 },showSelection(){dock.hidden=!scope.selection;},focusPanel(){tabs.focus();},tabs};
}
