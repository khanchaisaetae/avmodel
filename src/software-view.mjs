/** Canvas fallback for browsers without WebGL. Uses the same meshes/camera/raycaster.
 * No textures or shadows; renders exact indexed triangle geometry on demand.
 */
export class SoftwareRenderer {
 constructor(canvas){this.domElement=canvas;this.ctx=canvas.getContext('2d');if(!this.ctx)throw new Error('เบราว์เซอร์ไม่รองรับการแสดงโมเดล');this.isSoftware=true;this.lastKey='';this.pixelRatio=1;}
 setPixelRatio(){this.pixelRatio=1;}
 setSize(w,h){this.domElement.width=Math.max(1,Math.floor(w));this.domElement.height=Math.max(1,Math.floor(h));this.lastKey='';}
 setClearColor(){}
 render(scene,camera){
  scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);
  const objects=[];scene.traverse(o=>{if(o.isMesh&&o.visible)objects.push(o);});
  const key=camera.matrixWorld.elements.concat(camera.projectionMatrix.elements).map(x=>x.toFixed(5)).join(',')+objects.map(o=>o.uuid+o.visible+o.position.toArray().join(',')).join('|');if(key===this.lastKey)return;this.lastKey=key;
  const T=window.THREE,ctx=this.ctx,w=this.domElement.width,h=this.domElement.height;ctx.clearRect(0,0,w,h);
  const vp=new T.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse),cache=new Map(),triangles=[];
  for(const mesh of objects){
   const g=mesh.geometry,p=g.attributes?.position;if(!p)continue;const material=Array.isArray(mesh.material)?mesh.material[0]:mesh.material;if(!material)continue;
   const matrix=new T.Matrix4().multiplyMatrices(vp,mesh.matrixWorld),e=matrix.elements,signature=mesh.matrixWorld.elements.join(',');let byMatrix=cache.get(p.array);if(!byMatrix){byMatrix=new Map();cache.set(p.array,byMatrix);}let values=byMatrix.get(signature);if(!values){values=[];byMatrix.set(signature,values);}
   const project=i=>{if(values[i])return values[i];const x=p.getX(i),y=p.getY(i),z=p.getZ(i),cw=e[3]*x+e[7]*y+e[11]*z+e[15];if(cw<=0)return null;const nz=(e[2]*x+e[6]*y+e[10]*z+e[14])/cw;return values[i]=[(e[0]*x+e[4]*y+e[8]*z+e[12])/cw*w/2+w/2,-(e[1]*x+e[5]*y+e[9]*z+e[13])/cw*h/2+h/2,nz];};
   const index=g.index,total=index?index.count:p.count;
   const color=material.color||new T.Color(0xaaaaaa),base=[color.r,color.g,color.b].map(c=>Math.pow(Math.max(c,0),1/2.2)*255);
   for(let k=0;k<total;k+=3){const ids=[0,1,2].map(a=>index?index.getX(k+a):k+a),a=project(ids[0]),b=project(ids[1]),c=project(ids[2]);if(!a||!b||!c||Math.min(a[2],b[2],c[2])>1||Math.max(a[2],b[2],c[2])< -1)continue;if(Math.max(a[0],b[0],c[0])<0||Math.min(a[0],b[0],c[0])>w||Math.max(a[1],b[1],c[1])<0||Math.min(a[1],b[1],c[1])>h)continue;
    const x1=p.getX(ids[1])-p.getX(ids[0]),y1=p.getY(ids[1])-p.getY(ids[0]),z1=p.getZ(ids[1])-p.getZ(ids[0]),x2=p.getX(ids[2])-p.getX(ids[0]),y2=p.getY(ids[2])-p.getY(ids[0]),z2=p.getZ(ids[2])-p.getZ(ids[0]);const nx=y1*z2-z1*y2,ny=z1*x2-x1*z2,nz=x1*y2-y1*x2,length=Math.hypot(nx,ny,nz)||1;const light=.58+.36*Math.abs((nx*.3+ny*.8+nz*.5)/length);const fill='rgb('+base.map(v=>Math.min(255,Math.round(v*light))).join(',')+')';triangles.push({a,b,c,z:(a[2]+b[2]+c[2])/3,fill,overlay:material.depthTest===false});
   }
  }
  triangles.sort((a,b)=>a.overlay-b.overlay||b.z-a.z);
  for(const {a,b,c,fill}of triangles){ctx.fillStyle=fill;ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.lineTo(c[0],c[1]);ctx.closePath();ctx.fill();}
 }
}
