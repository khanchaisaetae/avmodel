import {mountActivityNavigation,createWorkspaceTabs,openDetails,element} from './workspace-ui.mjs?v=20261027-nav';
export function mountLessonWorkspace(scope){
 mountActivityNavigation();
 const pane=scope.pane,footer=element('div',undefined,'workspace-actions');let tabs;
  const panel=pane.querySelector('.trouble-panel'),form=element('div',undefined,'trouble-form'),observe=element('div'),files=pane.querySelector('.trouble-files');
  const hint=panel.querySelector('.trouble-help'),heading=scope.$('trouble-case'),instruction=scope.$('trouble-instruction'),screen=scope.$('lesson-screen');
  observe.append(heading,screen,instruction,hint);
  const confirm=scope.$('trouble-confirm');footer.append(confirm);
  for(const n of [...panel.children]){if(n.matches('.tiny-title'))n.remove();else form.append(n);}
  tabs=createWorkspaceTabs(panel,[['ผลภาพ',[observe]],['บันทึกตรวจ',[form]],['รายงาน',[files]]],'ขั้นตอนตรวจปัญหา');panel.append(footer);
 tabs.panels[0].append(scope.$("go-issue"),scope.$("why-feedback"));
 footer.prepend(scope.$("trouble-instruction"));
 footer.querySelector("button").addEventListener("click",()=>tabs.select(0));
 footer.append(scope.$("next-scenario"));
 openDetails(pane);
 for(const el of pane.querySelectorAll('.result-tip,.lesson-assumption'))el.classList.add('workspace-secondary');
 scope.$('mode-guidance').classList.add('workspace-redundant');
 const assumptions=pane.querySelector('.lesson-assumption');if(assumptions)tabs.panels.at(-1).append(assumptions);
 const progress=scope.$('image-progress');progress.setAttribute('role','status');
 return {render(){
  const s=scope.getState(),ready=scope.$('trouble-confirm');
   tabs.buttons[1].textContent='บันทึกตรวจ'+(s.troubleshoot.checks.length?' · '+s.troubleshoot.checks.length:'');
   footer.dataset.ready=String(!ready.disabled);
 },focusPanel(){tabs.focus();},tabs};
}
