import { referenceFromScenario, INCOMING_TRANSFER_KEY } from './transfer-model.mjs';
export function mountTransferSender(scope){
 const button=scope.create('button','ถ่ายทอดระบบ →','quiet-button');button.id='send-transfer';button.type='button';
 scope.table.querySelector('.table-tools').append(button);
 button.addEventListener('click',()=>{
  try{
   const reference=referenceFromScenario(scope.task,scope.getState(),scope.catalog);
   localStorage.setItem(INCOMING_TRANSFER_KEY,JSON.stringify(reference));
   location.assign('transfer.html?incoming=1');
  }catch(e){scope.$('mode-guidance').textContent='ส่งระบบไม่ได้: '+e.message;}
 });
 return {render(){
   button.disabled=scope.learningMode!=='practice'||scope.evaluateScenario(scope.task,scope.getState(),scope.catalog).status!=='ready';
   button.title=button.disabled?'ใช้โหมดฝึกและทำให้ภาพตรงเป้าหมายก่อนส่งไปเขียนผัง':'ส่งสำเนาพอร์ต สาย และการตั้งค่าปัจจุบันไปยูสเคส 6';
 }};
}
