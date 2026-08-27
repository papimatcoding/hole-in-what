import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { levelsForMode } from "../src/data/campaign";
import type { CurveDef, LevelDefinition, TriangleDef, Vec2 } from "../src/types";

type AuditStatus="PASS"|"REVIEW"|"BLOCKER";
interface ProfileResult{name:string;successRate:number;voidRate:number;medianEndDistance:number;}
interface NaiveTrapResult{triggerRate:number;punishRate:number;sampleCount:number;}
interface RecoveryResult{sampleCount:number;recoverableRate:number;movingTimeoutRate:number;}
interface AuditRow{
  id:string;mode:string;target:number;
  learnedStrokes:number|null;humanStrokes?:number|null;humanRouteDelta?:number|null;
  naiveStrokes:number|null;explorerStrokes:number|null;routeFamilies:number;
  profiles:ProfileResult[];minShotTolerance:number|null;naiveTrap:NaiveTrapResult|null;mechanicRelevant:boolean|null;recovery:RecoveryResult;
  minRestEdgeDistance:number|null;flags:string[];status:AuditStatus;
}
interface AuditReport{generatedAt:string;mode:string;rows:AuditRow[];}
interface FeedbackLevel{
  levelId:string;sampleSize:number;avgFun?:number|null;avgOriginality?:number|null;avgDifficulty?:number|null;bugRate?:number|null;avgCaught?:number|null;themes?:string[];
}
interface FeedbackSnapshot{buildId?:string;generatedAt?:string;levels:FeedbackLevel[];}
interface DesignRow{
  id:string;mode:string;authoredOrder:number;
  difficulty:number;difficultyRank:number;modeRank:number;
  originality:number;originalityRank:number;
  confidence:"LOW"|"MEDIUM"|"HIGH";
  pacingFlags:string[];auditFlags:string[];feedback:FeedbackLevel|null;recommendations:string[];
}

const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
const reportPath=process.env.AUDIT2_REPORT_FILE??"artifacts/audit2-report.json";
const feedbackPath=process.env.AUDIT2_FEEDBACK_FILE??"artifacts/audit2-feedback.json";
if(!existsSync(reportPath))throw new Error(`Audit 2.0 report not found: ${reportPath}`);
const report=JSON.parse(readFileSync(reportPath,"utf8")) as AuditReport;
const feedback:FeedbackSnapshot|null=existsSync(feedbackPath)?JSON.parse(readFileSync(feedbackPath,"utf8")) as FeedbackSnapshot:null;
const feedbackById=new Map((feedback?.levels??[]).map(x=>[x.levelId,x]));
const levels=[...levelsForMode("classic"),...levelsForMode("troll")];
const levelById=new Map(levels.map((level,index)=>[level.id,{level,index}]));

function complexity(level:LevelDefinition):number{
  return Math.min(12,(level.walls?.length??0)*.6)
    +(level.triangles?.length??0)*1.2+(level.curves?.length??0)*1.8+(level.bumpers?.length??0)*1.4
    +(level.sand?.length??0)*1.1+(level.ice?.length??0)*1.2+(level.boosters?.length??0)*1.5+(level.fans?.length??0)*1.7
    +(level.portals?.length??0)*2.2+(level.movingWalls?.length??0)*2.5+(level.movingBumpers?.length??0)*2.5
    +(level.voids?.length??0)*2+(level.ramps?.length??0)*2.1+(level.trampolines?.length??0)*2.1
    +(level.popWalls?.length??0)*2.4+(level.popBumpers?.length??0)*2.4+(level.popVoids?.length??0)*2.8;
}
function profile(row:AuditRow,name:string):ProfileResult{return row.profiles.find(x=>x.name===name)??{name,successRate:0,voidRate:0,medianEndDistance:9999};}
function difficultyRaw(row:AuditRow,level:LevelDefinition):number{
  const touch=profile(row,"touch"),casual=profile(row,"casual");
  const strokes=row.humanStrokes??row.learnedStrokes??Math.max(5,row.target+2);
  const precision=1-(row.minShotTolerance??0),recoveryRisk=1-row.recovery.recoverableRate;
  const edgeRisk=row.minRestEdgeDistance===null?0:clamp((32-row.minRestEdgeDistance)/32,0,1);
  const execution=(1-touch.successRate)*18+(1-casual.successRate)*8+precision*14+recoveryRisk*8+edgeRisk*5;
  const trap=level.mode==="troll"?(row.naiveTrap?.punishRate??0)*5:0,routes=row.routeFamilies<=1?4:row.routeFamilies>=4?-2:0;
  return clamp(strokes*11+complexity(level)*.7+execution+trap+routes,0,100);
}
function rating5(raw:number):number{return Number(clamp(1+raw/25,1,5).toFixed(1));}

const FIELD={left:28,right:512,top:28,bottom:932};
const COLS=18,ROWS=30;
function pointInTriangle(p:Vec2,t:TriangleDef):boolean{
  const sign=(p1:Vec2,p2:Vec2,p3:Vec2)=>(p1.x-p3.x)*(p2.y-p3.y)-(p2.x-p3.x)*(p1.y-p3.y);
  const d1=sign(p,t.a,t.b),d2=sign(p,t.b,t.c),d3=sign(p,t.c,t.a),neg=d1<0||d2<0||d3<0,pos=d1>0||d2>0||d3>0;return!(neg&&pos);
}
function normAngle(a:number):number{const tau=Math.PI*2;return((a%tau)+tau)%tau;}
function inArc(a:number,c:CurveDef):boolean{const x=normAngle(a),s=normAngle(c.startAngle),e=normAngle(c.endAngle);return s<=e?x>=s&&x<=e:x>=s||x<=e;}
function structuralAt(level:LevelDefinition,p:Vec2):boolean{
  if((level.walls??[]).some(w=>p.x>=w.x&&p.x<=w.x+w.w&&p.y>=w.y&&p.y<=w.y+w.h))return true;
  if((level.voids??[]).some(w=>p.x>=w.x&&p.x<=w.x+w.w&&p.y>=w.y&&p.y<=w.y+w.h))return true;
  if((level.popVoids??[]).some(w=>p.x>=w.x&&p.x<=w.x+w.w&&p.y>=w.y&&p.y<=w.y+w.h))return true;
  if((level.triangles??[]).some(t=>pointInTriangle(p,t)))return true;
  if((level.curves??[]).some(c=>{const dx=p.x-c.x,dy=p.y-c.y,d=Math.hypot(dx,dy),half=(c.thickness??22)/2+6;return Math.abs(d-c.r)<=half&&inArc(Math.atan2(dy,dx),c);} ))return true;
  return false;
}
function raster(level:LevelDefinition,mirror=false):Set<number>{
  const out=new Set<number>();for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){let px=FIELD.left+(x+.5)*(FIELD.right-FIELD.left)/COLS;const py=FIELD.top+(y+.5)*(FIELD.bottom-FIELD.top)/ROWS;if(mirror)px=FIELD.left+FIELD.right-px;if(structuralAt(level,{x:px,y:py}))out.add(y*COLS+x);}return out;
}
function jaccard(a:Set<number>,b:Set<number>):number{if(a.size===0||b.size===0)return 0;let inter=0;for(const x of a)if(b.has(x))inter++;return inter/(a.size+b.size-inter);}
function endpointSimilarity(a:LevelDefinition,b:LevelDefinition,mirror=false):number{
  const mx=(x:number)=>mirror?FIELD.left+FIELD.right-x:x,diag=Math.hypot(FIELD.right-FIELD.left,FIELD.bottom-FIELD.top);
  const bd=Math.hypot(a.ball.x-mx(b.ball.x),a.ball.y-b.ball.y)/diag,hd=Math.hypot(a.hole.x-mx(b.hole.x),a.hole.y-b.hole.y)/diag;return Math.max(0,1-(bd+hd)*1.8);
}
function similarity(a:LevelDefinition,b:LevelDefinition):number{
  const ar=raster(a),directR=raster(b),mirrorR=raster(b,true),direct=jaccard(ar,directR)*.82+endpointSimilarity(a,b)*.18,mirrored=jaccard(ar,mirrorR)*.82+endpointSimilarity(a,b,true)*.18;return Math.max(direct,mirrored);
}
function mechanics(level:LevelDefinition):string[]{
  const out:string[]=[];if(level.bumpers?.length||level.popBumpers?.length)out.push("bumper");if(level.sand?.length)out.push("sand");if(level.ice?.length)out.push("ice");if(level.boosters?.length)out.push("booster");if(level.fans?.length)out.push("fan");if(level.curves?.length)out.push("curve");if(level.portals?.length)out.push("portal");if(level.movingWalls?.length||level.movingBumpers?.length)out.push("moving");if(level.voids?.length||level.popVoids?.length)out.push("void");if(level.ramps?.length)out.push("ramp");if(level.trampolines?.length)out.push("trampoline");if(level.popWalls?.length)out.push("pop-wall");return out;
}
function originalityRaw(level:LevelDefinition,row:AuditRow):number{
  const peers=levels.filter(x=>x.mode===level.mode&&x.id!==level.id),nearest=peers.length?Math.max(...peers.map(x=>similarity(level,x))):0;
  const geometryNovelty=(1-nearest)*55;
  const ownMechanics=mechanics(level),modeLevels=levels.filter(x=>x.mode===level.mode);
  let mechanicNovelty=ownMechanics.length?0:8;
  for(const m of ownMechanics){const prevalence=modeLevels.filter(x=>mechanics(x).includes(m)).length/modeLevels.length;mechanicNovelty+=(1-prevalence)*12;}
  mechanicNovelty=Math.min(28,mechanicNovelty);
  const routeNovelty=clamp((row.routeFamilies-1)*5,0,12),trapBonus=level.mode==="troll"?clamp((row.naiveTrap?.punishRate??0)*8,0,8):0;
  return clamp(geometryNovelty+mechanicNovelty+routeNovelty+trapBonus,0,100);
}
function confidence(row:AuditRow,fb:FeedbackLevel|null):"LOW"|"MEDIUM"|"HIGH"{if((fb?.sampleSize??0)>=5)return"HIGH";if((fb?.sampleSize??0)>=2)return"MEDIUM";return profile(row,"touch").successRate>0&&(row.humanStrokes??row.learnedStrokes)!==null?"MEDIUM":"LOW";}
function recommendations(row:AuditRow,level:LevelDefinition,fb:FeedbackLevel|null,pacingFlags:string[],difficulty:number,originality:number):string[]{
  const out:string[]=[];const touch=profile(row,"touch"),tol=row.minShotTolerance??0;
  if(row.status==="BLOCKER")out.push("Corregir primero el blocker técnico/de jugabilidad antes de balancear el nivel.");
  if(touch.successRate<.25||tol<.22)out.push("Aumentar margen de ejecución: ensanchar pasos, reducir precisión obligatoria o crear una zona de aterrizaje más tolerante; no solucionarlo con pistas visuales solamente.");
  if((row.humanRouteDelta??0)>0)out.push("La línea récord es más estrecha que la ruta humana: conservarla como mastery line solo si la alternativa tolerante sigue siendo clara y divertida.");
  if(row.recovery.recoverableRate<.75)out.push("Añadir una salida o posición de recuperación para que un tiro mediocre cueste golpes sin convertir la run en un softlock.");
  if(row.routeFamilies<=1&&level.mode==="classic")out.push("Añadir una segunda familia de ruta o una decisión riesgo/recompensa; evitar que el nivel sea una única línea correcta.");
  if(row.routeFamilies<=1&&level.mode==="troll")out.push("Mantener una lectura troll clara, pero permitir más de una ejecución aprendida para que la solución no sea una contraseña de ángulo/potencia.");
  if(level.mode==="troll"&&(row.naiveTrap?.punishRate??0)<.22)out.push("Hacer que la trampa cambie realmente el resultado de la lectura ingenua; activarse visualmente sin alterar la run no cuenta.");
  if(level.mode==="troll"&&(row.naiveTrap?.triggerRate??0)<.25)out.push("Hacer más atractiva la ruta-cebo para que una primera lectura natural tenga opciones reales de activar la trampa.");
  if(row.mechanicRelevant===false)out.push("Recolocar o rediseñar la mecánica principal para que afecte a una ruta competitiva y no sea decoración evitable.");
  if(row.minRestEdgeDistance!==null&&row.minRestEdgeDistance<24)out.push("Evitar que la ruta buena deje la bola pegada al borde; desplazar la zona de reposo o ampliar el espacio del siguiente tiro.");
  if(pacingFlags.some(x=>x.startsWith("SPIKE")))out.push("Suavizar el pico de dificultad o mover este nivel más tarde si su mecánica todavía no se ha enseñado.");
  if(pacingFlags.some(x=>x.startsWith("DIP")))out.push("Si el descanso no es intencional, aumentar la decisión estratégica antes que exigir más precisión.");
  if(originality<=2.2)out.push("Originalidad de simulación baja: cambiar la silueta, la pregunta estratégica o la combinación de mecánicas; no basta con recolocar paredes.");
  if(difficulty<=1.8&&level.group>2)out.push("El modelo lo considera muy fácil para su posición: añadir decisión/riesgo antes de añadir precisión mecánica.");
  if(fb){
    const fun=fb.avgFun??null,fbOrig=fb.avgOriginality??null,fbDiff=fb.avgDifficulty??null,bugs=fb.bugRate??0,caught=fb.avgCaught??null;
    if(bugs>=.20)out.unshift("Prioridad: reproducir y clasificar los bugs reportados antes de interpretar las notas de diversión/dificultad.");
    if(fun!==null&&fun<=2.5&&fbDiff!==null&&fbDiff<=2.5)out.push("Feedback: poco divertido y fácil. Añadir una decisión memorable, interacción de mecánicas o riesgo/recompensa; no subir dificultad estrechando pasillos.");
    if(fun!==null&&fun<=2.5&&fbDiff!==null&&fbDiff>=4)out.push("Feedback: poco divertido y difícil. Reducir fricción/precisión y hacer más legible la intención antes de añadir contenido nuevo.");
    if(fun!==null&&fun<=2.5&&fbDiff!==null&&fbDiff>2.5&&fbDiff<4)out.push("Feedback: dificultad razonable pero diversión baja. Rediseñar la pregunta estratégica/silueta; el problema probablemente no es el balance numérico.");
    if(fbOrig!==null&&fbOrig<=2.5)out.push("Feedback: originalidad baja. Introducir una interacción o silueta propia que no repita la solución de niveles vecinos.");
    if(level.mode==="troll"&&caught!==null&&caught<=2.5)out.push("Feedback HARD: sorpresa baja. Mejorar el cebo o la consecuencia sin ocultar información necesaria para la solución aprendida.");
    if(fbDiff!==null&&Math.abs(difficulty-fbDiff)>=1.5)out.push(`Dificultad audit ${difficulty.toFixed(1)}/5 vs feedback ${fbDiff.toFixed(1)}/5: revisar legibilidad, controles o conocimiento previo antes de retocar geometría.`);
    if(fbOrig!==null&&Math.abs(originality-fbOrig)>=1.5)out.push(`Originalidad audit ${originality.toFixed(1)}/5 vs feedback ${fbOrig.toFixed(1)}/5: revisar si la novedad matemática se percibe realmente durante la partida.`);
    for(const theme of fb.themes??[])out.push(`Feedback recurrente: ${theme}`);
  }
  if(!out.length)out.push("Sin intervención clara: conservar y recoger más feedback antes de tocar el diseño.");
  return [...new Set(out)];
}

const base=report.rows.map(row=>{const found=levelById.get(row.id);if(!found)throw new Error(`Unknown level in audit report: ${row.id}`);const rawDiff=difficultyRaw(row,found.level),rawOrig=originalityRaw(found.level,row);return{row,level:found.level,index:found.index,difficulty:rating5(rawDiff),difficultyRaw:rawDiff,originality:rating5(rawOrig),originalityRaw:rawOrig,fb:feedbackById.get(row.id)??null};});
const globalSorted=[...base].sort((a,b)=>a.difficultyRaw-b.difficultyRaw),globalRank=new Map(globalSorted.map((x,i)=>[x.row.id,i+1]));
const originalSorted=[...base].sort((a,b)=>b.originalityRaw-a.originalityRaw),originalRank=new Map(originalSorted.map((x,i)=>[x.row.id,i+1]));
const modeRanks=new Map<string,number>();for(const mode of["classic","troll"]){[...base].filter(x=>x.row.mode===mode).sort((a,b)=>a.difficultyRaw-b.difficultyRaw).forEach((x,i)=>modeRanks.set(x.row.id,i+1));}
const pacingById=new Map<string,string[]>();
for(const mode of["classic","troll"]){const authored=base.filter(x=>x.row.mode===mode);let prev:number|null=null;for(const x of authored){const flags:string[]=[];if(prev!==null){const delta=x.difficulty-prev;if(delta>=1.0)flags.push(`SPIKE:+${delta.toFixed(1)}`);if(delta<=-.8)flags.push(`DIP:${delta.toFixed(1)}`);}pacingById.set(x.row.id,flags);prev=x.difficulty;}}
const rows:DesignRow[]=base.map(x=>{const pacing=pacingById.get(x.row.id)??[];return{id:x.row.id,mode:x.row.mode,authoredOrder:x.level.group,difficulty:x.difficulty,difficultyRank:globalRank.get(x.row.id)!,modeRank:modeRanks.get(x.row.id)!,originality:x.originality,originalityRank:originalRank.get(x.row.id)!,confidence:confidence(x.row,x.fb),pacingFlags:pacing,auditFlags:x.row.flags,feedback:x.fb,recommendations:recommendations(x.row,x.level,x.fb,pacing,x.difficulty,x.originality)};});
const ranked=[...rows].sort((a,b)=>a.difficultyRank-b.difficultyRank);
console.log("\nAUDIT 2.0 · DIFFICULTY 1–5");for(const r of ranked)console.log(`${String(r.difficultyRank).padStart(2)}. ${r.id.padEnd(10)} dificultad=${r.difficulty.toFixed(1)}/5 · originalidad=${r.originality.toFixed(1)}/5 · ${r.confidence}${r.pacingFlags.length?` · ${r.pacingFlags.join(",")}`:""}`);
console.log("\nAUDIT 2.0 · DESIGN ADVICE");for(const r of rows.filter(x=>x.recommendations[0]!=="Sin intervención clara: conservar y recoger más feedback antes de tocar el diseño.")){console.log(`\n${r.id} · dificultad ${r.difficulty.toFixed(1)}/5 · originalidad ${r.originality.toFixed(1)}/5`);for(const rec of r.recommendations)console.log(`- ${rec}`);}
mkdirSync("artifacts",{recursive:true});writeFileSync("artifacts/audit2-design.json",JSON.stringify({generatedAt:new Date().toISOString(),feedbackBuildId:feedback?.buildId??null,ranked,rows},null,2));
const md=["# Troll Golf · Audit 2.0 Design",feedback?`Feedback snapshot: **${feedback.buildId??"unspecified"}**`:`Feedback snapshot: **none (simulation-only advice)**`,"","## Difficulty ranking","","| Rank | Hole | Difficulty | Originality | Mode rank | Confidence | Pacing |","|---:|---|---:|---:|---:|---|---|",...ranked.map(r=>`| ${r.difficultyRank} | ${r.id} | ${r.difficulty.toFixed(1)}/5 | ${r.originality.toFixed(1)}/5 | ${r.modeRank} | ${r.confidence} | ${r.pacingFlags.join(", ")||"-"} |`),"","## Recommendations","",...rows.map(r=>`### ${r.id} · dificultad ${r.difficulty.toFixed(1)}/5 · originalidad ${r.originality.toFixed(1)}/5\n${r.recommendations.map(x=>`- ${x}`).join("\n")}`)];writeFileSync("artifacts/audit2-design.md",md.join("\n"));console.log("\nDesign reports: artifacts/audit2-design.json + artifacts/audit2-design.md");
