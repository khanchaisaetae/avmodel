// Presentation helpers read lesson state; they never decide electrical compatibility.
export function systemLayout(task) {
 const source=task.sources[0],display=task.displayId;
 if(task.type==='direct')return {[source]:[220,245],[display]:[780,245]};
 if(task.type==='pass')return {[source]:[140,245],vertex:[475,245],[display]:[835,245]};
 if(task.type==='dual')return {[source]:[185,130],[task.sources[1]]:[185,365],[display]:[815,245]};
 return {[source]:[140,130],vertex:[470,130],[task.sources[1]]:[140,365],[display]:[835,245]};
}
export function visibleSignalSegments(task,state,live) {
 if(!live.imageVisible)return [];
 if(live.actualSource==='vertex')return task.segments.flatMap((s,i)=>s.from==='vertex'&&state.links[i].connected&&state.links[i].sinkPortId===state.displayInput?[i]:[]);
 const route=task.routes.find(r=>r.source===live.actualSource);
 return route?route.segments.filter(i=>state.links[i].connected):[];
}
export function issueLocation(task,state,result,activeSegment=0) {
 if(!result||['ready','compatible'].includes(result.status))return null;
 const wireCodes=['MISSING_SELECTION','UNSIMULATED_CABLE','WRONG_DEVICE','NO_VIDEO','OCCUPIED_PORT','PORT_OCCUPIED','WRONG_CABLE','CABLE_CONNECTOR_MISMATCH','CONNECTOR_MISMATCH','DIRECTION_MISMATCH','SPECIAL_ROUTE_REQUIRED','CONVERSION_REQUIRED'];
 if(result.code==='INCOMPLETE_SYSTEM')return {step:0,segment:state.links.findIndex(l=>!l.connected)};
 if(wireCodes.includes(result.code)||result.status==='invalid')return {step:0,segment:activeSegment};
 if(result.code==='WRONG_SOURCE') {
  const route=task.routes.find(r=>r.source===state.requestedSource),last=route?.segments.at(-1);
  const onTargetInput=last!==undefined&&state.links[last].sinkPortId===state.displayInput;
  return {step:1,device:onTargetInput&&task.segments[last].from==='vertex'?'vertex':task.displayId};
 }
 if(result.code?.startsWith('VERTEX_'))return {step:1,device:'vertex'};
 if(result.code==='POWER_OFF')return {step:1,device:task.devices.find(id=>!state.power[id])||task.displayId};
 if(result.code==='SOURCE_DISABLED')return {step:1,device:state.requestedSource==='vertex'?task.sources.find(id=>id!=='vertex'):state.requestedSource};
 return {step:1,device:task.displayId};
}
