export function canvasBounds(items,padding=32){
 if(!items.length)return {x:0,y:0,width:900,height:640};
 const x=Math.max(0,Math.min(...items.map(b=>b.x))-padding),y=Math.max(0,Math.min(...items.map(b=>b.y))-padding);
 return {x,y,width:Math.max(360,Math.max(...items.map(b=>b.x+b.width))+padding-x),height:Math.max(300,Math.max(...items.map(b=>b.y+b.height))+padding-y)};
}
export function fitCanvas(bounds,width,height){return Math.max(.1,Math.min(1,(width-16)/bounds.width,(height-16)/bounds.height));}
export function worldDelta(delta,scale=1){return delta/scale;}
export function arrangeDevices(nodes){
 const positions=[[30,30],[280,30],[530,30],[30,430],[530,430]];
 return nodes.map((n,i)=>({...n,x:positions[i][0],y:positions[i][1]}));
}
