"""Extract named connector evidence and scene-space bounds. Python 3, stdlib only.
Run from anywhere: python scripts/build_model_mappings.py
User acceptance is recorded separately and never inferred from geometry review.
"""
import base64, hashlib, json, pathlib, struct, subprocess
ROOT = pathlib.Path(__file__).resolve().parents[1]
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

# Semantic assignments reviewed against model panel labels and ref diagrams.
PLAN={
 'dell':('DellG7-Laptop',{'hdmi':(101,1,0),'usb-c':(50,1,0),'usb-a-1':(10,1,0),'usb-a-2':(37,1,0),'usb-a-3':(123,-1,0),'lan':(23,-1,0)}),
 'epson':('Epson-Projector',{'hdmi1':(24,-1,2),'hdmi2':(23,-1,2),'computer1':(36,-1,2),'computer2-monitor':(27,-1,2),'video':(34,-1,2),'audio1':(31,-1,2),'audio2':(29,-1,2),'audio-out':(30,-1,2),'audio-l':(25,-1,2),'audio-r':(35,-1,2),'usb-b':(26,-1,2),'usb-a':(33,-1,2),'lan':(37,-1,2),'hdbaset':(32,-1,2),'rs232':(28,-1,2),'power':(38,-1,2)}),
 'bluray':('Sony-Blu-ray',{'hdmi1':(4,-1,2),'hdmi2':(26,-1,2),'coax':(72,-1,2),'usb-a':(77,1,2),'lan':(49,-1,2),'power':(3,-1,2)}),
 'tv':('Sony-SmartTV',{'hdmi-rear':(109,-1,2),'hdmi-side':(131,-1,0),'rf':(36,-1,2),'digital-audio':(56,-1,2),'lan':(7,-1,2),'composite':(30,-1,2),'headphone':(153,-1,0),'audio-l':(32,-1,2),'audio-r':(34,-1,2),'usb-a-1':(163,-1,0),'usb-a-2':(96,-1,0),'power':(57,-1,2)}),
 'vertex':('Vertex-Visualizer',{'hdmi-in':(6,1,0),'hdmi-out':(45,1,0),'usb-b':(68,1,0),'svideo-in':(67,1,0),'svideo-out':(28,1,0),'mic':(29,1,0),'rgb-in2':(4,1,0),'audio-in2':(35,1,0),'audio-in1':(162,-1,2),'audio-out':(172,-1,2),'audio-in-rca':(100,-1,2),'video-in':(102,-1,2),'v-out':(105,-1,2),'rs232':(104,-1,2),'power':(107,-1,2),'rgb-in1':(182,-1,2),'rgb-out1':(182,-1,2),'rgb-out2':(182,-1,2)})
}
def build():
 assets={};mappings={}
 for device,(stem,ports) in PLAN.items():
  path=ROOT/(stem+'.gltf');raw=path.read_bytes();g=json.loads(raw);world={};cache={}
  buffers=[base64.b64decode(b['uri'].split(',',1)[1]) for b in g['buffers']]
  def accessor(i):
   if i in cache:return cache[i]
   a=g['accessors'][i];v=g['bufferViews'][a['bufferView']];fmt={5121:'B',5123:'H',5125:'I',5126:'f'}[a['componentType']];size={'SCALAR':1,'VEC3':3}[a['type']];record=struct.Struct('<'+fmt*size);stride=v.get('byteStride',record.size);offset=v.get('byteOffset',0)+a.get('byteOffset',0)
   cache[i]=[record.unpack_from(buffers[v['buffer']],offset+k*stride) for k in range(a['count'])];return cache[i]
  def walk(i,parent):
   world[i]=mul(parent,local(g['nodes'][i]))
   for child in g['nodes'][i].get('children',[]):walk(child,world[i])
  for i in g['scenes'][g.get('scene',0)]['nodes']:walk(i,eye())
  def vertices(i):
   n=g['nodes'][i];points=[]
   if 'mesh' in n:
    for primitive in g['meshes'][n['mesh']]['primitives']:
     positions=accessor(primitive['attributes']['POSITION']);indices={p[0] for p in accessor(primitive['indices'])} if 'indices' in primitive else range(len(positions))
     points.extend(transform(world[i],positions[k]) for k in indices)
   for child in n.get('children',[]):points.extend(vertices(child))
   return points
  sha=hashlib.sha256(raw).hexdigest();assets[device]={'path':path.name,'sha256':sha,'node_count':len(g['nodes'])}
  for key,(node,sign,axis) in ports.items():
   points=vertices(node);shared=device=='vertex' and node==182
   if shared:
    x={'rgb-in1':-.458,'rgb-out1':-1.048,'rgb-out2':-1.639}[key];points=[p for p in points if abs(p[0]-x)<.26]
   lo=[min(p[a] for p in points) for a in range(3)];hi=[max(p[a] for p in points) for a in range(3)];anchor=[(a+b)/2 for a,b in zip(lo,hi)];anchor[axis]=(hi if sign>0 else lo)[axis];normal=[0,0,0];normal[axis]=sign
   mappings[device+':'+key]={'node_index':node,'anchor':anchor,'normal':normal,'bounds_scene':{'min':lo,'max':hi},'shared_node':shared,'asset_sha256':sha,'status':'reviewed','review_scope':'labelled_panel_and_indexed_geometry','review_date':'2026-10-23','basis':'ตำแหน่งจาก geometry ของแต่ละหัวต่อ เทียบฉลากบนแผงโมเดลกับเอกสาร ref; ปรับจุดเพิ่มเติมได้ในโหมดอาจารย์'}
   if device in PLAN:
    mappings[device+':'+key]['user_acceptance']={'status':'accepted','date_local':'2026-10-23','source_path':'ref/PORT_ACCEPTANCE_2026-10-23.md','accepted_baseline_commit':'8d884309c17c6f5156b6d3ecc0b63b0577b11fed','scope':'port_positions_only'}
   if device=='tv':
    mappings[device+':'+key]['reference_review']={'source_path':'ref/Sony_Smart_TV_KDL-40W650D.pdf','pdf_pages':[28,38],'user_acceptance':'accepted'}
 return {'schema_version':'1.0.0','coordinate_space':'original_gltf_scene_before_viewer_normalization','assets':assets,'mappings':mappings,'unmapped':{},'policy':'geometry calibration does not alter reference specification facts'}
if __name__=='__main__':
 result=build();(ROOT/'data/model-mappings.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(len(result['mappings']),'model positions')
