import {plugTypes,plugLabel} from './lab3d-plugs.mjs?v=20261026-plugs';
export function plugIcon(type){
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 64 40');svg.setAttribute('aria-hidden','true');
 const round=['rca','mini_jack_3_5','phone_jack_6_35','mini_din4'].includes(type);
 const shape=document.createElementNS(svg.namespaceURI,round?'circle':'path');
 if(round){shape.setAttribute('cx','32');shape.setAttribute('cy','16');shape.setAttribute('r','12');}
 else shape.setAttribute('d',type==='vga'?'M8 5H56L51 26H13Z':type==='hdmi'?'M10 5H54V18L46 26H18L10 18Z':type==='usb_c'?'M17 6H47Q57 6 57 16Q57 26 47 26H17Q7 26 7 16Q7 6 17 6Z':'M13 4H51V27H13Z');
 shape.setAttribute('fill','#d5dee2');shape.setAttribute('stroke','#355b68');shape.setAttribute('stroke-width','2');svg.append(shape);
 const tail=document.createElementNS(svg.namespaceURI,'path');tail.setAttribute('d','M26 28H38V40H26Z');tail.setAttribute('fill','#355b68');svg.append(tail);return svg;
}
export function createPlugUI({tray,hint,cancel,scene,getContext,validate,drop,detach,notice,onArm,reportError=notice}){
 let armed=null,gesture=null,ghost=null,tether=null,suppressClick=false;
 function clear(){armed=null;onArm(null);cancel.hidden=true;scene.setPlugGesture(false);scene.previewPort(null);hint.hidden=true;ghost?.remove();ghost=null;tether?.remove();tether=null;gesture=null;render();}
 function arm(index,side){armed={index,side};onArm(armed);cancel.hidden=false;render();notice('เลือกหัวสายแล้ว · แตะพอร์ตบนตัวเครื่อง หรือกด Escape เพื่อยกเลิก');}
 function feedback(e){const port=scene.dropPort(e),r=validate(gesture||armed,port);hint.hidden=false;hint.textContent=r.message;hint.dataset.valid=String(r.ok);scene.previewPort(port,r.ok);if(tether){const c=getContext(),other=c.link?.[gesture.side==='out'?'sinkPortId':'sourcePortId'],p=other&&scene.screenPort(other),path=tether.querySelector('path');path.setAttribute('d',p?'M'+p.x+' '+p.y+' Q'+e.clientX+' '+p.y+' '+e.clientX+' '+e.clientY:'');}if(ghost){ghost.style.left=e.clientX+'px';ghost.style.top=e.clientY+'px';}return {port,r};}
 function start(index,side,e){if(e.button!==0||getContext().disabled)return;const c=getContext();if(!c.cable)return;clear();gesture={index,side,x:e.clientX,y:e.clientY,moved:false,pointer:e.pointerId};scene.setPlugGesture(true);e.preventDefault();e.stopImmediatePropagation();ghost=document.createElement('div');ghost.className='plug-ghost';ghost.append(plugIcon(plugTypes(c.cable)[side==='out'?0:1]));document.body.append(ghost);tether=document.createElementNS('http://www.w3.org/2000/svg','svg');tether.classList.add('plug-tether');const path=document.createElementNS(tether.namespaceURI,'path');path.setAttribute('fill','none');path.setAttribute('stroke','#416f78');path.setAttribute('stroke-width','3');path.setAttribute('stroke-dasharray','7 4');tether.append(path);document.body.append(tether);feedback(e);}
 window.addEventListener('pointermove',e=>{if(!gesture||e.pointerId!==gesture.pointer)return;e.preventDefault();e.stopImmediatePropagation();gesture.moved ||= Math.hypot(e.clientX-gesture.x,e.clientY-gesture.y)>5;feedback(e);},{capture:true,passive:false});
 window.addEventListener('pointerup',e=>{if(!gesture||e.pointerId!==gesture.pointer)return;e.preventDefault();e.stopImmediatePropagation();const current={...gesture},result=feedback(e);suppressClick=true;setTimeout(()=>suppressClick=false,0);clear();if(!current.moved){arm(current.index,current.side);return;}if(result.r.ok)drop(current,result.port);else reportError(result.r.message);},{capture:true});
 window.addEventListener('pointercancel',()=>{if(gesture)clear();},{capture:true});
 window.addEventListener('blur',()=>{if(gesture)clear();});
 window.addEventListener('keydown',e=>{if(e.key==='Escape'&&(armed||gesture)){clear();notice('ยกเลิกการเลือกหัวสายแล้ว');}});
 cancel.addEventListener('click',clear);
 function render(){const focusedSide=tray.contains(document.activeElement)?document.activeElement.dataset.side:null;const c=getContext();tray.replaceChildren();for(const side of ['out','in']){
  const wrap=document.createElement('div'),b=document.createElement('button'),type=plugTypes(c.cable)[side==='out'?0:1],portId=c.link?.[side==='out'?'sourcePortId':'sinkPortId'];
  b.type='button';b.className='plug-handle';b.dataset.side=side;b.disabled=c.disabled||!c.cable;b.setAttribute('aria-pressed',String(armed?.side===side));b.append(plugIcon(type));const label=document.createElement('span');label.textContent=(side==='out'?'ต้นทาง · ':'ปลายทาง · ')+plugLabel(type);b.append(label);const status=document.createElement('small');status.textContent=portId?'เสียบแล้ว · ลากเพื่อย้าย':'ลากไปเสียบ / แตะเพื่อเลือก';b.append(status);
  b.addEventListener('pointerdown',e=>start(c.index,side,e));b.addEventListener('click',()=>{if(!suppressClick)arm(c.index,side);});wrap.append(b);
  if(portId){const remove=document.createElement('button');remove.type='button';remove.textContent='ถอดหัว'+(side==='out'?'ต้นทาง':'ปลายทาง');remove.className='detach-plug';remove.disabled=c.disabled;remove.addEventListener('click',()=>{clear();detach(c.index,side);});wrap.append(remove);}tray.append(wrap);if(focusedSide===side&&!b.disabled)b.focus();
 }}
 return {render,clear,start,get armed(){return armed;},choose(portId){if(!armed)return false;const a={...armed},r=validate(a,portId);if(r.ok){clear();drop(a,portId);}else reportError(r.message);return true;}};
}
