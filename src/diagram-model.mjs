import {SCENARIOS,DEVICE_NAMES} from './scenario-catalog.mjs';
import {WIRE_CHOICES} from './lesson-cables.mjs';
import {validateSegment,evaluateScenario} from './scenario-engine.mjs';
export const DIAGRAM_TASKS=[...SCENARIOS,{id:'free',title:'ออกแบบระบบอิสระ',goal:'สร้างผัง เลือกอุปกรณ์และอธิบายความต้องการใช้งานของระบบ',devices:[],sources:[],displayId:null},{id:'analysis-01',title:'วิเคราะห์ข้อจำกัดของ Vertex',goal:'Dell เข้า HDMI IN ของ Vertex แล้วต้องการภาพเดียวกันออก HDMI OUT และ RGB OUT พร้อมกันไปยัง Sony TV และ Epson โดยไม่มี Matrix หรืออุปกรณ์แยกภาพ ทำได้หรือไม่? อธิบายเหตุผล ไม่จำเป็นต้องวาดระบบที่ทำไม่ได้',devices:[],sources:[],displayId:null}];
export const getDiagramTask=id=>DIAGRAM_TASKS.find(t=>t.id===id);
export function emptyDiagram(taskId='2-01'){return {version:1,taskId,nodes:[],links:[],reason:'',conclusion:'unsure'};}
export function parseDiagram(value,catalog){
 if(!value||value.version!==1||!getDiagramTask(value.taskId)||!Array.isArray(value.nodes)||!Array.isArray(value.links)||value.nodes.length>5||value.links.length>20)throw Error('รูปแบบไฟล์ผังไม่รองรับ');
 const portIds=new Set(catalog.devices.flatMap(d=>d.ports.map(p=>p.id))),ids=new Set(),nodeIds=new Set();
 const nodes=value.nodes.map(n=>{if(!Object.hasOwn(DEVICE_NAMES,n.id)||nodeIds.has(n.id)||!Number.isFinite(n.x)||!Number.isFinite(n.y)||n.x<0||n.x>960||n.y<0||n.y>680)throw Error('ข้อมูลอุปกรณ์หรือตำแหน่งไม่ถูกต้อง');nodeIds.add(n.id);return {id:n.id,x:n.x,y:n.y,power:n.power===true,enabled:n.enabled===true,input:typeof n.input==='string'&&portIds.has(n.input)&&n.input.startsWith(n.id+':')?n.input:'',source:['CAMERA','HDMI IN','PC1','PC2'].includes(n.source)?n.source:'CAMERA'};});
 const links=value.links.map(l=>{if(typeof l.id!=='string'||!/^w[\w-]{1,60}$/.test(l.id)||ids.has(l.id)||!nodeIds.has(l.from)||!nodeIds.has(l.to)||l.from===l.to||!portIds.has(l.sourcePortId)||!portIds.has(l.sinkPortId)||!l.sourcePortId.startsWith(l.from+':')||!l.sinkPortId.startsWith(l.to+':')||!(l.cableId===''||WIRE_CHOICES.some(c=>c.id===l.cableId)))throw Error('ข้อมูลสายหรือพอร์ตไม่ถูกต้อง');ids.add(l.id);return {id:l.id,from:l.from,to:l.to,sourcePortId:l.sourcePortId,sinkPortId:l.sinkPortId,cableId:l.cableId};});
 return {version:1,taskId:value.taskId,nodes,links,reason:typeof value.reason==='string'?value.reason.slice(0,4000):'',conclusion:['possible','impossible','unsure'].includes(value.conclusion)?value.conclusion:'unsure'};
}
export function diagramRoutes(diagram,source,display){
 const routes=[];function walk(id,path,seen){if(id===display){routes.push(path);return;}for(let i=0;i<diagram.links.length;i++){const l=diagram.links[i];if(l.from===id&&!seen.has(l.to))walk(l.to,[...path,i],new Set([...seen,l.to]));}}walk(source,[],new Set([source]));return routes;
}
export function reviewDiagram(diagram,catalog,sourceId){
 const task=getDiagramTask(diagram.taskId),issues=[],ports=new Map(catalog.devices.flatMap(d=>d.ports.map(p=>[p.id,p]))),segments=diagram.links.map(l=>({from:l.from,to:l.to})),dynamic={...task,mode:task.mode||'1920x1080@60',segments},state={links:diagram.links.map(l=>({...l,connected:false})),power:Object.fromEntries(diagram.nodes.map(n=>[n.id,n.power])),sourceEnabled:Object.fromEntries(diagram.nodes.map(n=>[n.id,n.enabled])),displayInput:diagram.nodes.find(n=>n.id===task.displayId)?.input||'',vertexSource:diagram.nodes.find(n=>n.id==='vertex')?.source||'CAMERA',requestedSource:sourceId||task.sources[0],observedSources:[],attempts:0};
 // Check each submitted cable independently, then flag all sides of a conflict.
 const use=new Map();diagram.links.forEach((l,i)=>{for(const id of [l.sourcePortId,l.sinkPortId])use.set(id,[...(use.get(id)||[]),i]);});
 const linkResults=diagram.links.map((l,i)=>{let r=validateSegment(dynamic,state,i,catalog);if([l.sourcePortId,l.sinkPortId].some(id=>use.get(id).length>1))r={status:'invalid',code:'PORT_OCCUPIED',message:'พอร์ตเดียวมีสายมากกว่าหนึ่งเส้น ต้องใช้พอร์ตหรืออุปกรณ์ที่รองรับ'};if(r.status!=='compatible')issues.push({kind:r.status,linkId:l.id,message:'สาย '+(i+1)+': '+r.message});return r;});state.links=state.links.map((l,i)=>({...l,connected:linkResults[i].status==='compatible'}));
 if(task.id==='analysis-01')return {issues,linkResults,state,live:null,structureReady:false,message:diagram.conclusion==='impossible'?'ข้อสรุปสอดคล้องกับเงื่อนไข: Vertex ไม่แปลง HDMI IN ออก RGB/VGA พร้อม HDMI OUT ให้เขียนเหตุผลประกอบ':'พิจารณาฟังก์ชัน Source Switch: HDMI IN ส่งออก HDMI OUT ส่วน RGB IN ส่งออก RGB OUT ไม่แปลงข้ามประเภท'};
 if(task.id==='free')return {issues,linkResults,state,live:null,structureReady:false,message:'ตรวจพอร์ตและสายรายช่วงแล้ว ผังอิสระยังไม่ตรวจเป้าหมายภาพทั้งระบบ ให้ระบุความต้องการในเหตุผลประกอบ'};
 const missing=task.devices.filter(id=>!diagram.nodes.some(n=>n.id===id)),extra=diagram.nodes.filter(n=>!task.devices.includes(n.id));for(const id of missing)issues.push({kind:'missing',message:'ยังไม่มี '+DEVICE_NAMES[id]+' ในผัง'});for(const n of extra)issues.push({kind:'extra',message:DEVICE_NAMES[n.id]+' ไม่อยู่ในเงื่อนไขโจทย์นี้'});
 const actual=segments.map(l=>l.from+'>'+l.to),expected=task.segments.map(l=>l.from+'>'+l.to),same=actual.length===expected.length&&expected.every(e=>actual.filter(a=>a===e).length===expected.filter(a=>a===e).length);
 if(!same)issues.push({kind:'topology',message:'เส้นทางยังไม่ครบตามเงื่อนไขโจทย์ ตรวจว่าจะส่งตรง ผ่าน Vertex หรือใช้หลายแหล่งภาพ'});
 const routes=task.sources.map(source=>({source,segments:diagramRoutes(diagram,source,task.displayId)[0]||[]}));for(const route of routes)if(diagramRoutes(diagram,route.source,task.displayId).length>1)issues.push({kind:'topology',message:'พบมากกว่าหนึ่งเส้นทางจาก '+DEVICE_NAMES[route.source]+' ไปยังจอ ตรวจความซ้ำซ้อนของผัง'});
 const structureReady=!missing.length&&!extra.length&&same&&issues.length===0;
 const live=evaluateScenario({...dynamic,routes},state,catalog);
 return {issues,linkResults,state,live,structureReady,message:structureReady?(live.status==='ready'?'ผังครบและภาพตรงตามแหล่งที่เลือก':live.message):'ทบทวนรายการในผังด้านล่าง แล้วตรวจใหม่ได้ ไม่มีคะแนน'};
}
const xml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
// Wrap graphemes rather than cutting Thai vowels/marks off their base characters.
export function wrapDiagramText(value,limit=80){
 const segmenter=new Intl.Segmenter('th',{granularity:'grapheme'}),lines=[];
 for(const paragraph of String(value).replace(/\r\n?/g,'\n').split('\n')){const chars=[...segmenter.segment(paragraph)].map(s=>s.segment);if(!chars.length)lines.push('');for(let i=0;i<chars.length;i+=limit)lines.push(chars.slice(i,i+limit).join(''));}return lines;
}
export function exportDiagramSvg(d,catalog,{includeReason=true}={}){
 const task=getDiagramTask(d.taskId),ports=new Map(catalog.devices.flatMap(dev=>dev.ports.map(p=>[p.id,p]))),nodeMap=new Map(),lines=[],width=Math.max(760,...d.nodes.map(n=>n.x+260)),titleLines=wrapDiagramText('AV Port Lab · '+task.id+' '+task.title,Math.floor((width-60)/13)),headerHeight=35+titleLines.length*27;
 for(const node of d.nodes){const x=node.x+30,y=node.y+headerHeight,rows=[],anchors=new Map();let offset=25;
  const add=(text,bold=false)=>{for(const line of wrapDiagramText(text,bold?24:30)){rows.push({text:line,y:offset,bold});offset+=bold?20:17;}};
  add(DEVICE_NAMES[node.id],true);offset+=5;add(node.power?'เปิดเครื่อง':'ปิดเครื่อง');
  if(['dell','bluray'].includes(node.id))add(node.enabled?'ส่งภาพ: เปิด':'ส่งภาพ: ปิด');
  if(node.id==='vertex')add('SOURCE: '+node.source);else if(['epson','tv'].includes(node.id))add('Input: '+(ports.get(node.input)?.label||'ยังไม่เลือก'));
  offset+=7;d.links.forEach((link,i)=>{if(link.from===node.id||link.to===node.id){const out=link.from===node.id;anchors.set(link.id,y+offset-4);add((i+1)+'. '+(out?'OUT → ':'→ IN ')+(ports.get(out?link.sourcePortId:link.sinkPortId)?.label||'ยังไม่เลือก'));offset+=3;}});
  nodeMap.set(node.id,{x,y,rows,anchors,height:Math.max(160,offset+12)});
 }
 const bottom=Math.max(headerHeight+190,...[...nodeMap.values()].map(n=>n.y+n.height+30)),reasonLines=wrapDiagramText(d.reason||'ยังไม่ได้ระบุ',Math.floor((width-60)/8)),conclusion=task.id==='analysis-01'?'ข้อสรุป: '+({possible:'ทำได้ตามเงื่อนไข',impossible:'ทำไม่ได้ตามเงื่อนไข',unsure:'ยังไม่สรุป'}[d.conclusion]||'ยังไม่สรุป'):null,reasonTop=bottom+25,height=includeReason?reasonTop+45+(reasonLines.length+(conclusion?2:0))*22:bottom+15;
 lines.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img"><title>${xml(task.title)}</title><rect width="${width}" height="${height}" fill="#f5f8f9"/><style>text{font-family:Tahoma,Arial,sans-serif;fill:#243f50;font-size:13px}</style><defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="#437c85"/></marker></defs>`);
 titleLines.forEach((text,i)=>lines.push(`<text x="30" y="${32+i*27}" style="font-size:22px;font-weight:bold">${xml(text)}</text>`));
 d.links.forEach((link,i)=>{const a=nodeMap.get(link.from),b=nodeMap.get(link.to),x=a.x+200,y=a.anchors.get(link.id),tx=b.x,ty=b.anchors.get(link.id),mx=(x+tx)/2,my=(y+ty)/2,label=wrapDiagramText((i+1)+'. '+(WIRE_CHOICES.find(c=>c.id===link.cableId)?.label||'ยังไม่เลือกสาย'),22),labelHeight=label.length*16+12;
  lines.push(`<path d="M${x} ${y} C${mx} ${y} ${mx} ${ty} ${tx} ${ty}" fill="none" stroke="#437c85" stroke-width="2" marker-end="url(#arr)"/><rect x="${mx-88}" y="${my-labelHeight-3}" width="176" height="${labelHeight}" rx="5" fill="#fff" stroke="#d5e3e7"/>`);label.forEach((text,j)=>lines.push(`<text x="${mx}" y="${my-labelHeight+14+j*16}" text-anchor="middle" style="font-size:11px">${xml(text)}</text>`));
 });
 for(const n of nodeMap.values()){lines.push(`<rect x="${n.x}" y="${n.y}" width="200" height="${n.height}" rx="12" fill="#fff" stroke="#abc4cb"/>`);for(const row of n.rows)lines.push(`<text x="${n.x+12}" y="${n.y+row.y}" style="font-size:${row.bold?14:11}px;${row.bold?'font-weight:bold':''}">${xml(row.text)}</text>`);}
 if(includeReason){lines.push(`<text x="30" y="${reasonTop}" style="font-weight:bold">เหตุผลประกอบ (ฉบับผู้เรียน · ไม่มีคะแนน)</text>`);let y=reasonTop+26;if(conclusion){lines.push(`<text x="30" y="${y}">${xml(conclusion)}</text>`);y+=35;}reasonLines.forEach((text,i)=>lines.push(`<text x="30" y="${y+i*22}" xml:space="preserve">${xml(text)}</text>`));}
 lines.push('</svg>');return lines.join('');
}
