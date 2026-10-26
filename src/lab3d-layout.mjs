// Table coordinates are independent of signal settings and port calibration.
export const LAB_TABLE_LIMIT=12;
export function defaultLabPositions(task){
 return Object.fromEntries(task.devices.map((id,i)=>[id,{x:(i-(task.devices.length-1)/2)*4.1,z:0}]));
}
export function parseLabPositions(value,task){
 if(value===undefined)return defaultLabPositions(task);
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(id=>!task.devices.includes(id)))throw Error('ตำแหน่งอุปกรณ์ไม่ตรงโจทย์');
 const result=defaultLabPositions(task);
 for(const id of task.devices){const p=value[id];if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.z)||Math.abs(p.x)>LAB_TABLE_LIMIT||Math.abs(p.z)>LAB_TABLE_LIMIT)throw Error('ตำแหน่งอุปกรณ์อยู่นอกโต๊ะทดลอง');result[id]={x:p.x,z:p.z};}
 return result;
}
export function moveLabDevice(state,task,id,x,z){
 if(!task.devices.includes(id)||!Number.isFinite(x)||!Number.isFinite(z))throw Error('ไม่สามารถย้ายอุปกรณ์นี้ได้');
 const clamp=n=>Math.round(Math.max(-LAB_TABLE_LIMIT,Math.min(LAB_TABLE_LIMIT,n))*1000)/1000;
 return {...state,positions:{...parseLabPositions(state.positions,task),[id]:{x:clamp(x),z:clamp(z)}}};
}
