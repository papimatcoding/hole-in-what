import type { LevelDefinition } from "../types";

const KEY="hole-in-what-dev-map-reviews-v1";
const FORMAT="hole-in-what-map-proposal";
export type ReviewStatus="pending"|"accepted"|"rejected";
export interface MapProposal{
  format:typeof FORMAT;
  version:1;
  id:string;
  title:string;
  author:string;
  intent:string;
  createdAt:string;
  level:LevelDefinition;
  review:{status:ReviewStatus;note:string;updatedAt:string|null};
}
const clone=<T>(x:T):T=>JSON.parse(JSON.stringify(x)) as T;
const finite=(n:unknown):n is number=>typeof n==="number"&&Number.isFinite(n)&&Math.abs(n)<100000;
const point=(p:any):boolean=>p&&finite(p.x)&&finite(p.y)&&p.x>=-1000&&p.x<=2000&&p.y>=-1000&&p.y<=2000;
const rect=(r:any):boolean=>point(r)&&finite(r.w)&&finite(r.h)&&r.w>0&&r.w<=1500&&r.h>0&&r.h<=1500;
const circle=(c:any):boolean=>point(c)&&finite(c.r)&&c.r>0&&c.r<=800;
const optionalNumber=(n:unknown):boolean=>n===undefined||finite(n);
const arrays=["walls","sand","ice","voids","boosters","fans","ramps","movingWalls","popWalls","popVoids","bumpers","trampolines","movingBumpers","popBumpers","triangles","curves","portals","designPath","baitPath","fairways"] as const;

export function validateDevLevel(level:unknown):level is LevelDefinition{
  if(!level||typeof level!=="object")return false;
  const d=level as LevelDefinition;
  if(typeof d.id!=="string"||d.id.length>64||!point(d.ball)||!point(d.hole)||!finite(d.group)||!d.threeStar||!d.twoStar||!finite(d.threeStar.maxStrokes)||!finite(d.twoStar.maxStrokes)||d.mode!=="classic"&&d.mode!=="troll")return false;
  if(d.threeStar.maxStrokes!<1||d.twoStar.maxStrokes!<d.threeStar.maxStrokes!)return false;
  for(const k of arrays){const a=d[k];if(a!==undefined&&(!Array.isArray(a)||a.length>60))return false;}
  for(const k of ["walls","sand","ice","voids","boosters","fans","ramps","movingWalls","popWalls","popVoids","fairways"] as const)if(!((d[k]??[]) as any[]).every(rect))return false;
  for(const k of ["bumpers","trampolines","movingBumpers","popBumpers"] as const)if(!((d[k]??[]) as any[]).every(circle))return false;
  for(const k of ["popWalls","popVoids","popBumpers"] as const)if(!((d[k]??[]) as any[]).every(t=>point({x:t.triggerX,y:t.triggerY})&&finite(t.triggerRadius)&&t.triggerRadius>0&&t.triggerRadius<=800))return false;
  if(!(d.triangles??[]).every(t=>point(t.a)&&point(t.b)&&point(t.c))||!(d.curves??[]).every(c=>point(c)&&finite(c.r)&&c.r>0&&c.r<=800&&finite(c.startAngle)&&finite(c.endAngle)&&optionalNumber(c.thickness)))return false;
  if(!(d.portals??[]).every(p=>point(p.a)&&point(p.b)&&optionalNumber(p.a.r)&&optionalNumber(p.b.r))||!(d.designPath??[]).every(point)||!(d.baitPath??[]).every(point))return false;
  for(const k of ["boosters","fans","ramps"] as const)if(!(d[k]??[]).every(v=>finite(v.dx)&&finite(v.dy)))return false;
  for(const k of ["movingWalls","movingBumpers"] as const)if(!(d[k]??[]).every(v=>(v.axis==="x"||v.axis==="y")&&finite(v.amplitude)&&optionalNumber(v.speed)&&optionalNumber(v.phase)))return false;
  if(!(d.boosters??[]).every(v=>optionalNumber(v.power))||!(d.fans??[]).every(v=>optionalNumber(v.strength))||!(d.ramps??[]).every(v=>optionalNumber(v.lift)&&optionalNumber(v.boost))||!(d.trampolines??[]).every(v=>optionalNumber(v.power)))return false;
  return true;
}

function read():MapProposal[]{
  try{const data=JSON.parse(localStorage.getItem(KEY)??"[]") as MapProposal[];return Array.isArray(data)?data.filter(x=>x?.format===FORMAT&&validateDevLevel(x.level)).slice(0,40):[];}catch{return[];}
}
function save(items:MapProposal[]):void{localStorage.setItem(KEY,JSON.stringify(items.slice(0,40)));}
function parse(raw:string):MapProposal{
  if(raw.length>150000)throw Error("Archivo demasiado grande");
  const x=JSON.parse(raw) as MapProposal;
  if(x?.format!==FORMAT||x.version!==1||typeof x.id!=="string"||x.id.length>100||typeof x.title!=="string"||typeof x.author!=="string"||typeof x.intent!=="string"||!validateDevLevel(x.level))throw Error("Propuesta no válida");
  return{format:FORMAT,version:1,id:x.id,title:x.title.slice(0,60),author:x.author.slice(0,48),intent:x.intent.slice(0,500),createdAt:typeof x.createdAt==="string"?x.createdAt:new Date().toISOString(),level:clone(x.level),review:{status:"pending",note:"",updatedAt:null}};
}
export const DevMapReviews={
  list:read,
  create(level:LevelDefinition,title:string,author:string,intent:string):MapProposal{
    if(!validateDevLevel(level))throw Error("Mapa incompleto");
    return{format:FORMAT,version:1,id:crypto.randomUUID(),title:title.trim().slice(0,60)||"Mapa sin título",author:author.trim().slice(0,48)||"Anónimo",intent:intent.trim().slice(0,500),createdAt:new Date().toISOString(),level:clone(level),review:{status:"pending",note:"",updatedAt:null}};
  },
  import(raw:string):MapProposal{const item=parse(raw),items=read();if(items.some(x=>x.id===item.id))throw Error("Propuesta ya importada");items.unshift(item);save(items);return item;},
  review(id:string,status:ReviewStatus,note:string):MapProposal|null{const items=read(),item=items.find(x=>x.id===id);if(!item)return null;item.review={status,note:note.trim().slice(0,500),updatedAt:new Date().toISOString()};save(items);return item;},
  download(item:MapProposal):void{
    const blob=new Blob([JSON.stringify(item,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");
    a.href=url;a.download=`hole-in-what-${item.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").slice(0,40)}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
};
