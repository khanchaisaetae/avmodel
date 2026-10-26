import {parseLabPositions,LAB_TABLE_LIMIT} from './lab3d-layout.mjs?v=20261026-move';
import {assetHash} from './asset-hash.mjs';
import {SoftwareRenderer} from './software-view.mjs';
export function createLabScene({canvas,viewport,overlay,catalog,mappings,onPort,onDevice,onWire,onHover,onProgress,onMove=()=>{}}){
 const T=window.THREE;if(!T)throw Error('โหลดเครื่องมือสามมิติไม่สำเร็จ');
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(38,1,.01,150),actors=new Map(),cache=new Map(),ray=new T.Raycaster();
 let renderer;try{renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true});}catch{renderer=new SoftwareRenderer(canvas);}
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputEncoding=T.sRGBEncoding;renderer.setClearColor(0xdde6ea,0);
 scene.add(new T.HemisphereLight(0xffffff,0x70818c,1.3));const light=new T.DirectionalLight(0xffffff,1.15);light.position.set(3,8,-5);scene.add(light);const fill=new T.DirectionalLight(0xe4efff,.7);fill.position.set(-5,4,7);scene.add(fill);
 const grid=new T.GridHelper(32,64,0xabbec8,0xc4d1d8);scene.add(grid);
 const controls=new T.OrbitControls(camera,canvas);controls.enableDamping=!renderer.isSoftware;controls.minDistance=.18;controls.maxDistance=45;controls.maxPolarAngle=Math.PI*.92;controls.screenSpacePanning=true;
 let serial=0,focused=null,selectedPort=null,down=null,wireMeshes=[],task=null,disposed=false,viewMode="overview",deviceView="back",moveMode=false,drag=null,wireConfig=null,wiresDirty=false;
 const marker=new T.Mesh(new T.SphereGeometry(.045,12,8),new T.MeshBasicMaterial({color:0x09978b,depthTest:false}));marker.renderOrder=999;marker.visible=false;scene.add(marker);
 const halo=new T.Mesh(new T.TorusGeometry(1.7,.025,6,48),new T.MeshBasicMaterial({color:0x258d80}));halo.rotation.x=Math.PI/2;halo.visible=false;scene.add(halo);
 const plane=new T.Plane(new T.Vector3(0,1,0),0);
 function updateHalo(){const a=actors.get(focused);halo.visible=moveMode&&!!a;if(a){halo.position.set(a.group.position.x,.04,a.group.position.z);const radius=Math.max(a.size.x,a.size.z)/2+.15;halo.scale.setScalar(radius/1.7);}}
 function invalidate(){if(renderer.isSoftware)renderer.lastKey='';}
 function setPositions(value){const positions=parseLabPositions(value,task);for(const[id,a]of actors){const p=positions[id];a.group.position.set(p.x,0,p.z);a.group.updateMatrixWorld(true);}if(selectedPort)select(selectedPort);updateHalo();updateOverlays();if(wireConfig)wires(wireConfig.links,wireConfig.segments,wireConfig.active);invalidate();}
 function selectDevice(id){if(!actors.has(id))return;focused=id;updateHalo();updateOverlays();}
 function setInteractionMode(arrange){if(drag)finishDrag(false);moveMode=!!arrange;marker.visible=!moveMode&&!!selectedPort;if(marker.visible)select(selectedPort);canvas.style.cursor=moveMode?'grab':'auto';updateHalo();updateOverlays();}
 function point(portId){const id=portId.split(':')[0],actor=actors.get(id),m=mappings.mappings[portId];if(!actor||!m)return null;actor.group.updateMatrixWorld(true);return actor.wrapper.localToWorld(new T.Vector3(...m.anchor));}
 function normal(portId){const actor=actors.get(portId.split(':')[0]),m=mappings.mappings[portId];return actor&&m?new T.Vector3(...m.normal).transformDirection(actor.wrapper.matrixWorld):new T.Vector3(0,0,-1);}
 async function asset(id){
  if(cache.has(id))return cache.get(id);
  const pending=(async()=>{
   const d=catalog.devices.find(d=>d.id===id);onProgress('กำลังโหลดโมเดล '+id);
   const response=await fetch(d.asset_path);if(!response.ok)throw Error('โหลดโมเดล '+id+' ไม่สำเร็จ');const raw=await response.arrayBuffer();
   if(await assetHash(raw)!==mappings.assets[id].sha256)throw Error('ไฟล์โมเดล '+id+' ไม่ตรงกับตำแหน่งพอร์ตที่ตรวจรับ');
   const gltf=await new Promise((resolve,reject)=>new T.GLTFLoader().parse(new TextDecoder().decode(raw),'./',resolve,reject));
   const nodes=await Promise.all(gltf.parser.json.nodes.map((_,i)=>gltf.parser.getDependency('node',i)));
   nodes.forEach((o,i)=>o.traverse(c=>{c.userData.labAncestors??=[];c.userData.labAncestors.push(i);c.userData.labDevice=id;}));
   const root=gltf.scene;root.updateMatrixWorld(true);const box=new T.Box3().setFromObject(root),center=box.getCenter(new T.Vector3()),size=box.getSize(new T.Vector3()),scale=3/Math.max(size.x,size.y,size.z);
   const group=new T.Group(),wrapper=new T.Group();wrapper.add(root);wrapper.scale.setScalar(scale);wrapper.position.set(-center.x*scale,-box.min.y*scale+.1,-center.z*scale);group.add(wrapper);return {group,wrapper,root,size:size.multiplyScalar(scale)};
  })();cache.set(id,pending);try{return await pending;}catch(e){cache.delete(id);throw e;}
 }
 async function load(nextTask,positions){
  if(drag)finishDrag(false);const token=++serial;task=nextTask;wireConfig=null;halo.visible=false;focused=null;selectedPort=null;marker.visible=false;clearWires();for(const a of actors.values())scene.remove(a.group);actors.clear();
  for(let i=0;i<task.devices.length;i++){
   const id=task.devices[i],loaded=await asset(id);if(token!==serial)return false;
   const position=parseLabPositions(positions,task)[id];loaded.group.position.set(position.x,0,position.z);actors.set(id,loaded);scene.add(loaded.group);loaded.group.updateMatrixWorld(true);
  }
  overview();return true;
 }
 function overview(){
  focused=null;viewMode='overview';if(!actors.size)return;
  const box=new T.Box3();for(const a of actors.values())box.expandByObject(a.group);
  const center=box.getCenter(new T.Vector3()),radius=box.getBoundingSphere(new T.Sphere()).radius;
  const halfAngle=Math.atan(Math.tan(T.MathUtils.degToRad(camera.fov/2))*Math.min(1,camera.aspect));
  const distance=radius/Math.sin(halfAngle)*1.08,direction=new T.Vector3(.12,.52,-1).normalize();
  controls.maxDistance=Math.max(45,distance*1.2);camera.far=Math.max(150,distance+radius*3);camera.updateProjectionMatrix();controls.target.copy(center);camera.position.copy(center).addScaledVector(direction,distance);controls.update();updateOverlays();
 }
 function focusDevice(id,view='back'){
  const a=actors.get(id);if(!a)return;focused=id;viewMode='device';deviceView=view;const offsets={front:[0,1.3,5.3],back:[0,1.3,-5.3],left:[-5.3,1.3,0],right:[5.3,1.3,0]};
  controls.target.copy(a.group.position).add(new T.Vector3(0,a.size.y*.45,0));const offset=new T.Vector3(...(offsets[view]||offsets.back));offset.multiplyScalar(Math.max(1,1/camera.aspect));camera.position.copy(controls.target).add(offset);controls.update();updateOverlays();
 }
 function focusPort(portId){const p=point(portId);if(!p)return;focused=portId.split(':')[0];viewMode='port';selectedPort=portId;marker.position.copy(p);marker.visible=true;controls.target.copy(p);camera.position.copy(p).addScaledVector(normal(portId),1.1).add(new T.Vector3(0,.18,0));controls.update();updateOverlays();}
 function select(portId){selectedPort=portId;const p=point(portId);marker.visible=!!p;if(p)marker.position.copy(p);}
 function clearWires(){for(const mesh of wireMeshes){scene.remove(mesh);mesh.geometry.dispose();mesh.material.dispose();}wireMeshes=[];}
 function wires(links,segments,active){
  wireConfig={links,segments,active};wiresDirty=false;clearWires();links.forEach((l,i)=>{
   if(!l.sourcePortId||!l.sinkPortId||!l.cableId)return;const a=point(l.sourcePortId),b=point(l.sinkPortId);if(!a||!b)return;
   const leadA=a.clone().addScaledVector(normal(l.sourcePortId),.3),leadB=b.clone().addScaledVector(normal(l.sinkPortId),.3),bendA=leadA.clone(),bendB=leadB.clone();bendA.y=Math.max(.12,Math.min(leadA.y,leadB.y)*.3);bendB.y=bendA.y;
   // The leads follow the verified port normals; the middle runs above the table.
   const curve=new T.CatmullRomCurve3([a,leadA,bendA,bendB,leadB,b],false,'centripetal');
   const mesh=new T.Mesh(new T.TubeGeometry(curve,48,i===active ? .035 : .025,6,false),new T.MeshStandardMaterial({color:l.connected?0x276e68:0xa7793e,roughness:.8}));mesh.userData.labWire=i;scene.add(mesh);wireMeshes.push(mesh);
  });
 }
 function meshes(){const result=[];for(const a of actors.values())a.root.traverse(o=>{if(o.isMesh)result.push(o);});return result;}
 function pick(event,includeWires=true){
  const rect=canvas.getBoundingClientRect();ray.setFromCamera(new T.Vector2((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1),camera);
  const hit=ray.intersectObjects([...meshes(),...(includeWires?wireMeshes:[])],false)[0];if(!hit)return null;
  if(hit.object.userData.labWire!==undefined)return {wire:hit.object.userData.labWire};
  const id=hit.object.userData.labDevice,a=actors.get(id),ancestors=hit.object.userData.labAncestors||[],local=a.wrapper.worldToLocal(hit.point.clone());
  const ports=catalog.devices.find(d=>d.id===id).ports.filter(p=>{const m=mappings.mappings[p.id];return m&&ancestors.includes(m.node_index);});
  ports.sort((a,b)=>new T.Vector3(...mappings.mappings[a.id].anchor).distanceToSquared(local)-new T.Vector3(...mappings.mappings[b.id].anchor).distanceToSquared(local));
  return {device:id,port:ports[0]?.id};
 }
 function tablePoint(event){const rect=canvas.getBoundingClientRect();ray.setFromCamera(new T.Vector2((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1),camera);return ray.ray.intersectPlane(plane,new T.Vector3());}
 function finishDrag(commit){
  const current=drag;if(!current)return;drag=null;controls.enabled=true;canvas.style.cursor='grab';
  if(canvas.hasPointerCapture(current.pointer))canvas.releasePointerCapture(current.pointer);
  const actor=actors.get(current.id);if(!actor)return;
  if(!commit){actor.group.position.copy(current.start);actor.group.updateMatrixWorld(true);}
  updateHalo();updateOverlays();if(wireConfig)wires(wireConfig.links,wireConfig.segments,wireConfig.active);invalidate();
  if(commit&&actor.group.position.distanceTo(current.start)>.001)onMove(current.id,{x:actor.group.position.x,z:actor.group.position.z});
 }
 // Capture the device gesture before OrbitControls receives it. Empty table still rotates.
 canvas.addEventListener('pointerdown',e=>{
  if(!moveMode||e.button!==0||drag)return;const hit=pick(e,false),p=tablePoint(e);if(!hit?.device||!p)return;
  e.preventDefault();e.stopImmediatePropagation();down=null;focused=hit.device;const actor=actors.get(focused);
  drag={id:focused,pointer:e.pointerId,start:actor.group.position.clone(),offset:actor.group.position.clone().sub(p)};
  controls.enabled=false;canvas.setPointerCapture(e.pointerId);canvas.style.cursor='grabbing';onHover(null);onDevice(focused);updateHalo();
 },{capture:true});
 canvas.addEventListener('pointermove',e=>{
  if(!drag||e.pointerId!==drag.pointer)return;e.preventDefault();e.stopImmediatePropagation();const p=tablePoint(e);if(!p)return;
  p.add(drag.offset);const actor=actors.get(drag.id);actor.group.position.set(Math.max(-LAB_TABLE_LIMIT,Math.min(LAB_TABLE_LIMIT,p.x)),0,Math.max(-LAB_TABLE_LIMIT,Math.min(LAB_TABLE_LIMIT,p.z)));actor.group.updateMatrixWorld(true);
  updateHalo();updateOverlays();wiresDirty=true;invalidate();
 },{capture:true});
 for(const name of ['pointerup','pointercancel'])canvas.addEventListener(name,e=>{if(!drag||e.pointerId!==drag.pointer)return;e.preventDefault();e.stopImmediatePropagation();finishDrag(name==='pointerup');},{capture:true});
 canvas.addEventListener('lostpointercapture',()=>{if(drag)finishDrag(false);});
 canvas.addEventListener('pointerdown',e=>{down=e.button===0?[e.clientX,e.clientY]:null;});
 canvas.addEventListener('pointerup',e=>{if(e.button!==0||!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>5)return;down=null;const hit=pick(e,!moveMode);if(moveMode){if(hit?.device){selectDevice(hit.device);onDevice(hit.device);}return;}if(hit?.wire!==undefined)onWire(hit.wire);else if(hit?.port){select(hit.port);onPort(hit.port);}else if(hit?.device){focusDevice(hit.device);onDevice(hit.device);}});
 canvas.addEventListener('pointermove',e=>{if(e.buttons||drag)return;const hit=pick(e,!moveMode);canvas.style.cursor=moveMode?(hit?.device?'grab':'auto'):(hit?.port||hit?.wire!==undefined?'pointer':'grab');onHover(moveMode?null:hit?.port||null,e);});
 canvas.addEventListener('pointerleave',()=>onHover(null));
 function updateOverlays(){
  updateHalo();if(!viewport.clientWidth)return;camera.updateMatrixWorld();
  for(const[id,a]of actors){const el=overlay.querySelector('[data-device="'+id+'"]');if(!el)continue;const v=a.group.position.clone().add(new T.Vector3(0,a.size.y+.15,0)).project(camera);const x=(v.x+1)*viewport.clientWidth/2,y=(-v.y+1)*viewport.clientHeight/2;
   el.hidden=v.z< -1||v.z>1||x< -100||x>viewport.clientWidth+100||y< -200||y>viewport.clientHeight+200;
   el.classList.toggle('compact',moveMode||focused!==id);el.dataset.selected=String(moveMode&&focused===id);el.dataset.positionX=a.group.position.x.toFixed(3);el.dataset.positionZ=a.group.position.z.toFixed(3);el.style.left=Math.max(80,Math.min(viewport.clientWidth-80,x))+'px';el.style.top=Math.max(focused===id?155:45,Math.min(viewport.clientHeight-8,y))+'px';
  }
 }
 function resize(){const w=viewport.clientWidth,h=viewport.clientHeight;if(w<=0||h<=0)return;renderer.setSize(w,h,false);const changed=Math.abs(camera.aspect-w/h)>.01;camera.aspect=w/h;camera.updateProjectionMatrix();if(changed&&actors.size){if(viewMode==='overview')overview();else if(viewMode==='device')focusDevice(focused,deviceView);}updateOverlays();}
 const observer=new ResizeObserver(resize);observer.observe(viewport);controls.addEventListener('change',updateOverlays);
 function animate(){if(disposed)return;requestAnimationFrame(animate);if(document.hidden)return;if(!drag)controls.update();if(wiresDirty&&wireConfig)wires(wireConfig.links,wireConfig.segments,wireConfig.active);renderer.render(scene,camera);}
 resize();overview();animate();
 return {load,overview,focusDevice,focusPort,select,wires,setPositions,setInteractionMode,selectDevice,refresh:updateOverlays,get focused(){return focused;},get software(){return !!renderer.isSoftware;},dispose(){disposed=true;serial++;observer.disconnect();controls.dispose();clearWires();renderer.dispose?.();}};
}
