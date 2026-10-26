// Opening a page only reads a recovery snapshot. It never replaces that snapshot with an empty draft.
export function createWorkSession({storage,parse,hasWork}){
 let key=null,pending=null,assessment=false;
 return {
  open(nextKey,{assessment:exam=false}={}){
   key=nextKey;assessment=exam;pending=null;
   if(!assessment)try{const raw=storage.getItem(key);if(raw){const value=parse(JSON.parse(raw));if(hasWork(value))pending=structuredClone(value);}}catch{}
  },
  get available(){return !assessment&&pending!==null;},
  resume(){if(assessment||pending===null)return null;const value=structuredClone(pending);pending=null;return value;},
  save(value,{force=false}={}){
   if(assessment)return false;
   // A blank check or initial render cannot destroy a previous unfinished assignment.
   if(!force&&pending!==null&&!hasWork(parse(value)))return false;
   storage.setItem(key,JSON.stringify(value));pending=null;return true;
  }
 };
}
