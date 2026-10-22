"""Extract named connector evidence and scene-space bounds. Python 3, stdlib only.
Run from anywhere: python scripts/audit_models.py
Bounds are diagnostic geometry centres, NOT calibrated socket attachment points.
"""
import base64, hashlib, json, pathlib, struct, subprocess
ROOT = pathlib.Path(__file__).resolve().parents[1]
SELECTION = {
 'DellG7-Laptop': [('hdmi-a',101,'hdmi'),('usb-c',50,'usb_c'),('usb-a-a',10,'usb_a_candidate'),('usb-a-b',37,'usb_a_candidate'),('usb-a-c',123,'usb_a_candidate'),('network',23,'rj45_candidate')],
 'Epson-Projector': [('hdmi-a',23,'hdmi'),('hdmi-b',24,'hdmi'),('usb',33,'usb_unknown'),('rca-a',25,'rca_candidate'),('rca-b',34,'rca_candidate'),('rca-c',35,'rca_candidate'),('unidentified-connector',28,'unknown')],
 'Sony-Blu-ray': [('hdmi-a',4,'hdmi'),('hdmi-b',26,'hdmi'),('network',49,'rj45_candidate'),('usb-a',77,'usb_a_candidate'),('rca',72,'rca_candidate')],
 'Sony-SmartTV': [('hdmi-a',109,'hdmi'),('hdmi-b',131,'hdmi'),('usb-a-a',96,'usb_a_candidate'),('usb-a-b',163,'usb_a_candidate'),('network',7,'rj45_candidate'),('rca-a',30,'rca_candidate'),('rca-b',32,'rca_candidate'),('rca-c',34,'rca_candidate'),('coax',36,'coax_candidate'),('optical',56,'optical_candidate')],
 'Vertex-Visualizer': [('hdmi-a',6,'hdmi'),('hdmi-b',45,'hdmi'),('usb-b',72,'usb_b'),('rca-a',100,'rca_candidate'),('rca-b',102,'rca_candidate'),('rca-c',105,'rca_candidate'),('unidentified-connector',104,'unknown')]
}
def eye(): return [[int(i==j) for j in range(4)] for i in range(4)]
def mul(a,b): return [[sum(a[i][k]*b[k][j] for k in range(4)) for j in range(4)] for i in range(4)]
def local(n):
 if 'matrix' in n: return [[n['matrix'][j*4+i] for j in range(4)] for i in range(4)]
 x,y,z,w=n.get('rotation',[0,0,0,1]);s=n.get('scale',[1,1,1]);t=n.get('translation',[0,0,0])
 r=[[1-2*(y*y+z*z),2*(x*y-z*w),2*(x*z+y*w)], [2*(x*y+z*w),1-2*(x*x+z*z),2*(y*z-x*w)], [2*(x*z-y*w),2*(y*z+x*w),1-2*(x*x+y*y)]]
 m=eye()
 for i in range(3):
  for j in range(3):m[i][j]=r[i][j]*s[j]
  m[i][3]=t[i]
 return m
def transform(m,p):return [sum(m[i][j]*([*p,1][j]) for j in range(4)) for i in range(3)]
def main():
 devices=[]
 for stem,selection in SELECTION.items():
  path=ROOT/(stem+'.gltf');raw=path.read_bytes();g=json.loads(raw);world={}
  buffers=[base64.b64decode(b['uri'].split(',',1)[1]) for b in g['buffers']]
  accessor_cache={}
  def accessor(i):
   if i in accessor_cache:return accessor_cache[i]
   a=g['accessors'][i];v=g['bufferViews'][a['bufferView']]
   fmt={5120:'b',5121:'B',5122:'h',5123:'H',5125:'I',5126:'f'}[a['componentType']]
   size={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4}[a['type']]
   record=struct.Struct('<'+fmt*size);stride=v.get('byteStride',record.size);offset=v.get('byteOffset',0)+a.get('byteOffset',0)
   values=[record.unpack_from(buffers[v['buffer']],offset+k*stride) for k in range(a['count'])]
   accessor_cache[i]=values;return values
  def walk(i,parent):
   world[i]=mul(parent,local(g['nodes'][i]))
   for c in g['nodes'][i].get('children',[]):walk(c,world[i])
  for i in g['scenes'][g.get('scene',0)]['nodes']:walk(i,eye())
  def points(i):
   n=g['nodes'][i];out=[]
   if 'mesh' in n:
    for prim in g['meshes'][n['mesh']]['primitives']:
     # Exporter shares POSITION across meshes. Accessor bounds cover the whole
     # model; only vertices referenced by this primitive identify this part.
     positions=accessor(prim['attributes']['POSITION'])
     indices={p[0] for p in accessor(prim['indices'])} if 'indices' in prim else range(len(positions))
     out.extend(transform(world[i],positions[k]) for k in indices)
   for c in n.get('children',[]):out.extend(points(c))
   return out
  ports=[]
  for key,i,connector in selection:
   ps=points(i);lo=[min(p[a] for p in ps) for a in range(3)];hi=[max(p[a] for p in ps) for a in range(3)]
   ports.append({'id':stem+':'+key,'node_index':i,'node_name':g['nodes'][i].get('name'),'connector_candidate':connector,'evidence_status':'model_node_observed','geometry_bounds_scene':{'min':lo,'max':hi},'geometry_center_scene':[(a+b)/2 for a,b in zip(lo,hi)],'socket_anchor_scene':None,'socket_normal_scene':None,'anchor_status':'requires_visual_calibration','direction':None,'video_capable':None,'signal':None,'supported_modes':None,'input_selector':None,'capability_status':'unverified','evidence_refs':[f'{stem}.gltf#/nodes/{i}'],'assessment_enabled':False})
  devices.append({'id':stem,'asset_path':path.name,'sha256':hashlib.sha256(raw).hexdigest(),'asset_generator':g['asset'].get('generator'),'node_count':len(g['nodes']),'mesh_count':len(g['meshes']),'hardware_model_number':None,'hardware_identity_status':'unresolved','manual_match_status':'not_confirmed','inventory_scope':'named connector candidates only; unnamed geometry may contain other ports','ports':ports})
 result={'schema_version':'1.0.0','audit_date_local':'2026-10-22','audit_timezone':'Asia/Bangkok','source_repository':'https://github.com/khanchaisaetae/avmodel','source_commit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'policy':{'unknown_is_not_incorrect':True,'unverified_ports_are_not_gradable':True,'connector_shape_does_not_prove_video_or_direction':True,'geometry_center_is_not_socket_anchor':True},'devices':devices}
 (ROOT/'data'/'port-catalog.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'devices':len(devices),'connector_candidates':sum(len(d['ports']) for d in devices),'assessment_enabled':0}))
if __name__=='__main__':main()
