export const ACTIVITIES=[['index.html','1 · สำรวจพอร์ต'],['index.html?mode=practice','2 · ฝึกเชื่อมต่อ'],['diagram.html','3 · เขียนผังระบบ'],['troubleshoot.html','5 · แก้ปัญหาภาพ']];
export function element(tag,text,cls){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;}
export function mountActivityNavigation(){
 document.body.classList.add('ux-workspace');
 const header=document.querySelector('.topbar'),old=header.querySelector('nav');if(old)old.hidden=true;
 const nav=element('nav',undefined,'activity-navigation');nav.setAttribute('aria-label','เปลี่ยนกิจกรรม');
 const label=element('label','กิจกรรม');label.htmlFor='workspace-activity';const select=element('select');select.id='workspace-activity';
 const current=location.pathname.split('/').pop()||'index.html';
 for(const[url,title]of ACTIVITIES){const option=element('option',title);option.value=url;select.append(option);}select.value=current;
 select.addEventListener('change',()=>{if(ACTIVITIES.some(([url])=>url===select.value))location.assign(select.value);});nav.append(label,select);header.append(nav);
}
let tabCounter=0;
export function createWorkspaceTabs(root,definitions,label){
 const prefix='workspace-tabs-'+(++tabCounter),bar=element('div',undefined,'workspace-tabs');bar.setAttribute('role','tablist');bar.setAttribute('aria-label',label);
 const buttons=[],panels=[];let active=0;
 definitions.forEach(([title,nodes],i)=>{
  const button=element('button',title);button.type='button';button.id=prefix+'-tab-'+i;button.setAttribute('role','tab');button.setAttribute('aria-controls',prefix+'-panel-'+i);
  const panel=element('section',undefined,'workspace-tab-panel');panel.id=prefix+'-panel-'+i;panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',button.id);panel.tabIndex=-1;
  for(const n of nodes.filter(Boolean))panel.append(n);
  button.addEventListener('click',()=>select(i));button.addEventListener('keydown',e=>{
   let target;if(e.key==='ArrowRight')target=(active+1)%definitions.length;if(e.key==='ArrowLeft')target=(active+definitions.length-1)%definitions.length;if(e.key==='Home')target=0;if(e.key==='End')target=definitions.length-1;
   if(target!==undefined){e.preventDefault();select(target);buttons[target].focus();}
  });buttons.push(button);panels.push(panel);bar.append(button);
 });
 root.append(bar,...panels);
 function select(i){active=i;buttons.forEach((b,j)=>{b.setAttribute('aria-selected',String(i===j));b.tabIndex=i===j?0:-1;panels[j].hidden=i!==j;});root.dispatchEvent(new CustomEvent('workspace-tab-change',{bubbles:true}));}
 select(0);return {select,panels,buttons,get active(){return active;},focus(){panels[active].focus();}};
}
export function openDetails(root){for(const d of root.querySelectorAll('details')){if(d.matches('.file-panel,.reason-panel,.trouble-files')){d.open=true;d.classList.add('workspace-unfolded');}}}
