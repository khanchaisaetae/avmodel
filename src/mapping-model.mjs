// Pure validation for calibration files. Specification facts are never imported.
export function validateCalibration(payload, catalog, baseline) {
 if (!payload || payload.schema_version !== '1.0.0' || !payload.mappings || typeof payload.mappings !== 'object' || Array.isArray(payload.mappings)) throw new Error('รูปแบบไฟล์ปรับเทียบไม่ถูกต้อง');
 const ports=new Map(catalog.devices.flatMap(d=>d.ports.map(p=>[p.id,{port:p,device:d}])));
 const accepted={};
 const vector=v=>Array.isArray(v)&&v.length===3&&v.every(n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<1e5);
 for(const [id,m] of Object.entries(payload.mappings)){
  const entry=ports.get(id); if(!entry) throw new Error('พบพอร์ตที่ไม่อยู่ในฐานข้อมูล: '+id);
  const asset=baseline.assets[entry.device.id];
  if(!m || m.asset_sha256!==asset.sha256)throw new Error('ไฟล์โมเดลไม่ตรงกับผลปรับเทียบ: '+id);
  if(!Number.isSafeInteger(m.node_index)||m.node_index<0||m.node_index>=asset.node_count)throw new Error('หมายเลขชิ้นส่วนไม่ถูกต้อง: '+id);
  if(!vector(m.anchor)||!vector(m.normal))throw new Error('พิกัดหรือทิศทางพอร์ตไม่ถูกต้อง: '+id);
  const length=Math.hypot(...m.normal);if(length<.9||length>1.1)throw new Error('ทิศทางหน้าพอร์ตต้องเป็นเวกเตอร์หน่วย: '+id);
  if(!['candidate','local_draft','local_reviewed','reviewed'].includes(m.status))throw new Error('สถานะผลตรวจไม่ถูกต้อง');
  // Imported approvals are local, not repository-level approvals.
  let bounds;
  if(m.bounds_scene){
   if(!vector(m.bounds_scene.min)||!vector(m.bounds_scene.max)||m.bounds_scene.min.some((n,i)=>n>m.bounds_scene.max[i]))throw new Error('ขอบเขตชิ้นส่วนไม่ถูกต้อง: '+id);
   bounds={min:[...m.bounds_scene.min],max:[...m.bounds_scene.max]};
  }
  accepted[id]={node_index:m.node_index,anchor:[...m.anchor],normal:m.normal.map(n=>n/length),asset_sha256:m.asset_sha256,status:m.status.includes('reviewed')?'local_reviewed':'local_draft',...(bounds?{bounds_scene:bounds}:{}),shared_node:m.shared_node===true};
 }
 return accepted;
}
export function mappingCounts(ports,getMapping){
 const result={total:ports.length,located:0,reviewed:0};
 for(const p of ports){const m=getMapping(p.id);if(m){result.located++;if(['reviewed','local_reviewed'].includes(m.status))result.reviewed++;}}
 return result;
}
