import {projectPackage} from './project-model.mjs';
import {PROJECT_FIELDS} from './project-catalog.mjs';
import {DEVICE_NAMES} from './scenario-catalog.mjs';
import {exportDiagramSvg} from './diagram-export.mjs';
const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
function table(head,rows){return '<table><thead><tr>'+head.map(x=>'<th>'+esc(x)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map(x=>'<td>'+esc(x)+'</td>').join('')+'</tr>').join('')+'</tbody></table>';}
export function projectBody(mission,d,catalog,meta,includeDiagram=true){
 const p=projectPackage(mission,d,catalog,meta),ports=new Map(catalog.devices.flatMap(x=>x.ports.map(y=>[y.id,y])));
 let body='<h1>'+esc(mission.title)+'</h1><p>'+esc(mission.brief)+'</p><p><strong>'+ (p.confirmed?'ยืนยันแฟ้มส่งมอบแล้ว':'ฉบับร่าง · ยังไม่ยืนยันส่งมอบ')+'</strong></p>';
 if(includeDiagram)body+='<figure>'+exportDiagramSvg(d,catalog,{includeReason:false})+'</figure>';
 body+='<h2>เหตุผลการออกแบบ</h2><p class="text">'+esc(d.reason)+'</p>';
 for(const[id,label]of PROJECT_FIELDS)body+='<h2>'+esc(label)+'</h2><p class="text">'+esc(p.meta.notes[id]||'ยังไม่ได้ระบุ')+'</p>';
 body+='<h2>รายการอุปกรณ์และสาย</h2>'+table(['รายการ','จำนวน'],[...p.inventory.devices,...p.inventory.cables].map(x=>[x.name,x.quantity]));
 body+='<h2>ตารางติดตั้งสาย</h2>'+table(['สาย','ต้นทาง / OUT','ปลายทาง / IN','ชนิดสาย'],p.inventory.wires.map(w=>[w.wire,w.from+' · '+w.out,w.to+' · '+w.in,w.cable]));
 body+='<h2>ผลทดสอบและตารางเลือกแหล่งภาพ</h2>'+table(['การทดสอบ','ผล','Input ของจอขณะทดสอบ','SOURCE ของ Vertex','เวลา'],mission.tests.map(t=>{
  const proof=p.meta.proofs[t.id],nodes=proof?.diagram.nodes||[];return [t.title,proof?'ผ่านตามกฎจำลอง':'ยังไม่ทดสอบ',ports.get(nodes.find(n=>n.id===t.displayId)?.input)?.label||'—',nodes.find(n=>n.id==='vertex')?.source||'—',proof?.timestamp||'—'];
 }));
 body+='<h2>สถานะเครื่องในฉบับส่งมอบ</h2>'+table(['อุปกรณ์','เครื่อง','เล่น / ส่งภาพ','Input / SOURCE'],d.nodes.map(n=>[DEVICE_NAMES[n.id],n.power?'เปิด':'ปิด',['dell','bluray'].includes(n.id)?(n.enabled?'เปิด':'ปิด'):'—',n.id==='vertex'?n.source:ports.get(n.input)?.label||'—']));
 if(p.pending.length)body+='<h2>รายการที่ยังไม่ครบ</h2><ul>'+p.pending.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>';
 return body+'<p class="note">'+esc(p.note)+'</p>';
}
export function projectHtml(mission,d,catalog,meta){
 return '<!doctype html><html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+esc(mission.title)+'</title><style>body{font-family:Tahoma,system-ui,sans-serif;max-width:1050px;margin:30px auto;padding:0 22px;color:#243d4a;line-height:1.8}h1{font-size:25px}h2{font-size:18px;margin-top:30px}table{border-collapse:collapse;width:100%;font-size:12px}th,td{border:1px solid #b9ccd0;padding:8px;text-align:left;vertical-align:top;overflow-wrap:anywhere}th{background:#edf4f3}.text{white-space:pre-wrap;overflow-wrap:anywhere}figure{margin:20px 0}svg{width:100%;height:auto}.note{font-size:11px;color:#607681}@media print{body{margin:0;font-size:11px}tr{break-inside:avoid}thead{display:table-header-group}h2{break-after:avoid}figure{break-inside:avoid}}</style></head><body>'+projectBody(mission,d,catalog,meta)+'</body></html>';
}
