import {evaluateScenario,checkScenario} from './scenario-engine.mjs';
// Assessment records only an explicit submission with a learner's explanation.
export function reviewLearning(task,state,catalog,mode,{submitted=false,reason=''}={}){
 if(mode==='assessment'){
  if(!submitted)return {state,result:null};
  if(reason.trim().length<10)return {state,result:null,needsReason:true};
  return checkScenario(task,state,catalog);
 }
 const result=evaluateScenario(task,state,catalog);
 if(result.status==='ready'&&!state.observedSources.includes(state.requestedSource))return checkScenario(task,state,catalog);
 return {state,result:{...result,complete:result.status==='ready'&&task.sources.every(id=>state.observedSources.includes(id))}};
}
