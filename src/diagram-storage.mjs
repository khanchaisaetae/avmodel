import {createWorkSession} from './work-session.mjs?v=20261026-resume';
// Dependencies are injected by the entry controller; importing this module has no UI side effects.
export function createDiagramStorage(scope) {
 let expectedTask=null;
 const session=createWorkSession({storage:{getItem:key=>localStorage.getItem(key),setItem:(key,value)=>localStorage.setItem(key,value)},parse:value=>{const saved=scope.parseDiagram(value,scope.catalog);if(saved.taskId!==expectedTask)throw Error('งานไม่ตรงโจทย์');return saved;},hasWork:s=>s.nodes.length>0||s.links.length>0||!!s.reason?.trim()||s.conclusion!=='unsure'});
 function button(){scope.$('diagram-resume').hidden=!session.available;}
 function save(){
  try{const written=session.save(scope.state);scope.$('save-state').textContent=written?'✓ บันทึกอัตโนมัติในเบราว์เซอร์นี้แล้ว':'มีงานเดิมอยู่ · กดทำงานเดิมต่อเพื่อกู้คืน';}
  catch{scope.$('save-state').textContent='บันทึกในเบราว์เซอร์ไม่ได้ กรุณาดาวน์โหลด JSON เพื่อเก็บงาน';}button();
 }
 function loadTask(id){expectedTask=id;session.open(scope.storagePrefix+id);button();scope.$('save-state').textContent=session.available?'เริ่มผังว่าง · มีงานเดิมให้กู้คืน':'เริ่มผังว่าง · บันทึกเมื่อแก้ไข';return scope.emptyDiagram(id);}
 function resumeTask(){
  const saved=session.resume();if(!saved)return;scope.state=saved;scope.selection=null;scope.pending=null;scope.review=null;scope.history.length=0;scope.future.length=0;button();scope.render();scope.$('save-state').textContent='กู้คืนผังเดิมแล้ว · บันทึกเมื่อแก้ไข';scope.notice('กู้คืนงานเดิมแล้ว');
 }
 return {save,loadTask,resumeTask};
}
