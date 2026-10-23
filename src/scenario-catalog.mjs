export const DEVICE_NAMES={dell:'Dell G7 7588',epson:'Epson EB-2165W',bluray:'Sony UBP-X700',tv:'Sony KDL-40W650D',vertex:'Vertex D-1420HW'};
export const SOURCE_NAMES={...DEVICE_NAMES,vertex:'กล้อง Vertex'};
const segment=(from,to)=>({from,to});
function scenario(id,type,a,out,b){
 const segments=type==='direct'?[segment(a,out)]:type==='pass'?[segment(a,'vertex'),segment('vertex',out)]:type==='dual'?[segment(a,out),segment(b,out)]:[segment(a,'vertex'),segment('vertex',out),segment(b,out)];
 const sources=b?[a,b]:[a],devices=[...new Set(segments.flatMap(s=>[s.from,s.to]))];
 const routes=type==='direct'||type==='dual'?sources.map((source,i)=>({source,segments:[i]})):[{source:a,segments:[0,1]},...(b?[{source:b,segments:[2]}]:[])];
 const short=id=>({dell:'Dell',bluray:'Blu-ray',vertex:'กล้อง Vertex',tv:'Sony TV',epson:'Epson'}[id]);
 const title=type==='direct'?`${short(a)} → ${short(out)}`:type==='pass'?`${short(a)} → Vertex → ${short(out)}`:type==='dual'?`${short(a)} และ ${short(b)} → ${short(out)}`:`${short(a)} ผ่าน Vertex / ${short(b)} ตรง → ${short(out)}`;
 return {id,type,title,devices,sources,displayId:out,segments,routes,mode:id==='2-01'?'1280x800@60':'1920x1080@60',goal:b?'แสดงภาพจากทั้งสองแหล่งทีละแหล่ง โดยไม่ถอดสาย':`แสดงภาพจาก ${short(a)} บน ${short(out)}${type==='pass'?' ผ่าน Vertex':''}`};
}
export const SCENARIOS=[
 scenario('2-01','direct','dell','epson'),scenario('2-02','direct','dell','tv'),scenario('2-03','direct','bluray','epson'),scenario('2-04','direct','bluray','tv'),
 scenario('3-01','pass','dell','epson'),scenario('3-02','pass','dell','tv'),scenario('3-03','pass','bluray','epson'),scenario('3-04','pass','bluray','tv'),
 scenario('3-05','dual','dell','epson','bluray'),scenario('3-06','dual','dell','tv','bluray'),scenario('3-07','dual','dell','epson','vertex'),scenario('3-08','dual','dell','tv','vertex'),scenario('3-09','dual','bluray','epson','vertex'),scenario('3-10','dual','bluray','tv','vertex'),
 scenario('4-01','merge','dell','epson','bluray'),scenario('4-02','merge','dell','tv','bluray'),scenario('4-03','merge','bluray','epson','dell'),scenario('4-04','merge','bluray','tv','dell')
];
