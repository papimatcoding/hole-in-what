import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { levelsForMode } from "../src/data/campaign";
import type { LevelDefinition } from "../src/types";

type AuditStatus="PASS"|"REVIEW"|"BLOCKER";
interface ProfileResult{name:string;successRate:number;voidRate:number;medianEndDistance:number;}
interface NaiveTrapResult{triggerRate:number;punishRate:number;sampleCount:number;}
interface RecoveryResult{sampleCount:number;recoverableRate:number;movingTimeoutRate:number;}
interface AuditRow{
  id:string;mode:string;target:number;learnedStrokes:number|null;naiveStrokes:number|null;explorerStrokes:number|null;routeFamilies:number;
  profiles:ProfileResult[];minShotTolerance:number|null;naiveTrap:NaiveTrapResult|null;mechanicRelevant:boolean|null;recovery:RecoveryResult;
  minRestEdgeDistance:number|null;flags:string[];status:AuditStatus;
}
interface AuditReport{generatedAt:string;mode:string;rows:AuditRow[];}
interface FeedbackLevel{
  levelId:string;
  sampleSize:number;
  avgFun?:number|null;
  avgOriginality?:number|null;
  avgDifficulty?:number|null;
  bugRate?:number|null;
  avgCaught?:number|null;
  themes?:string[];
}
interface FeedbackSnapshot{buildId?:string;generatedAt?:string;levels:FeedbackLevel[];}
interface DesignRow{
  id:string;mode:string;authoredOrder:number;difficultyScore:number;difficultyRank:number;modeRank:number;
  confidence:"LOW"|"MEDIUM"|"HIGH";pacingFlags:string[];auditFlags:string[];feedback:FeedbackLevel|null;recommendations:string[];
}

const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
const pct=(v:number)=>Math.round(v*100);
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
function difficulty(row:AuditRow,level:LevelDefinition):number{
  const touch=profile(row,"touch"),casual=profile(row,"casual");
  const strokes=row.learnedStrokes??Math.max(5,row.target+2);
  const precision=1-(row.minShotTolerance??0);
  const recoveryRisk=1-row.recovery.recoverableRate;
  const edgeRisk=row.minRestEdgeDistance===null?0:clamp((32-row.minRestEdgeDistance)/32,0,1);
  const execution=(1-touch.successRate)*18+(1-casual.successRate)*8+precision*14+recoveryRisk*8+edgeRisk*5;
  const trap=level.mode==="troll"?(row.naiveTrap?.punishRate??0)*5:0;
  const routes=row.routeFamilies<=1?4:row.routeFamilies>=4?-2:0;
  return Number(clamp(strokes*11+complexity(level)*.7+execution+trap+routes,0,100).toFixed(1));
}
function confidence(row:AuditRow,fb:FeedbackLevel|null):"LOW"|"MEDIUM"|"HIGH"{
  if((fb?.sampleSize??0)>=5)return"HIGH";
  if((fb?.sampleSize??0)>=2)return"MEDIUM";
  const touch=profile(row,"touch");return touch.successRate>0&&row.learnedStrokes!==null?"MEDIUM":"LOW";
}
function recommendations(row:AuditRow,level:LevelDefinition,fb:FeedbackLevel|null,pacingFlags:string[]):string[]{
  const out:string[]=[];const touch=profile(row,"touch"),casual=profile(row,"casual"),tol=row.minShotTolerance??0;
  if(row.status==="BLOCKER")out.push("Corregir primero el blocker técnico/de jugabilidad antes de balancear el nivel.");
  if(touch.successRate<.25||tol<.22)out.push("Aumentar margen de ejecución: ensanchar pasos, reducir precisión obligatoria o crear una zona de aterrizaje más tolerante; no solucionarlo con pistas visuales solamente.");
  if(row.recovery.recoverableRate<.75)out.push("Añadir una salida o posición de recuperación para que un tiro mediocre cueste golpes sin convertir la run en un softlock.");
  if(row.routeFamilies<=1&&level.mode==="classic")out.push("Añadir una segunda familia de ruta o una decisión riesgo/recompensa; evitar que el nivel sea una única línea correcta.");
  if(row.routeFamilies<=1&&level.mode==="troll")out.push("Mantener una lectura troll clara, pero permitir más de una ejecución aprendida para que la solución no sea una contraseña de ángulo/potencia.");
  if(level.mode==="troll"&&(row.naiveTrap?.punishRate??0)<.22)out.push("Hacer que la trampa cambie realmente el resultado de la lectura ingenua; activarse visualmente sin alterar la run no cuenta.");
  if(level.mode==="troll"&&(row.naiveTrap?.triggerRate??0)<.25)out.push("Hacer más atractiva o legible la ruta-cebo para que una primera lectura natural tenga opciones reales de activar la trampa.");
  if(row.mechanicRelevant===false)out.push("Recolocar o rediseñar la mecánica principal para que afecte a una ruta competitiva y no sea decoración evitable.");
  if(row.minRestEdgeDistance!==null&&row.minRestEdgeDistance<24)out.push("Evitar que la ruta buena deje la bola pegada al borde de pantalla/campo; desplazar la zona de reposo o ampliar el espacio de tiro siguiente.");
  if(pacingFlags.some(x=>x.startsWith("SPIKE")))out.push("Suavizar el pico de dificultad o mover este nivel más tarde si su mecánica todavía no se ha enseñado.");
  if(pacingFlags.some(x=>x.startsWith("DIP")))out.push("Si el descanso no es intencional, aumentar la decisión estratégica antes que exigir más precisión.");
  if(fb){
    const fun=fb.avgFun??null,originality=fb.avgOriginality??null,diff=fb.avgDifficulty??null,bugs=fb.bugRate??0,caught=fb.avgCaught??null;
    if(bugs>=.20)out.unshift("Prioridad: reproducir y clasificar los bugs reportados antes de interpretar las notas de diversión/dificultad.");
    if(fun!==null&&fun<=2.5&&diff!==null&&diff<=2.5)out.push("Feedback: poco divertido y fácil. Añadir una decisión memorable, interacción de mecánicas o riesgo/recompensa; no subir dificultad estrechando pasillos.");
    if(fun!==null&&fun<=2.5&&diff!==null&&diff>=4)out.push("Feedback: poco divertido y difícil. Reducir fricción/precisión y hacer más legible la intención antes de añadir contenido nuevo.");
    if(fun!==null&&fun<=2.5&&diff!==null&&diff>2.5&&diff<4)out.push("Feedback: dificultad razonable pero diversión baja. Rediseñar la pregunta estratégica/silueta; el problema probablemente no es el balance numérico.");
    if(originality!==null&&originality<=2.5)out.push("Feedback: originalidad baja. Introducir una interacción o silueta propia que no repita la solución de niveles vecinos.");
    if(level.mode==="troll"&&caught!==null&&caught<=2.5)out.push("Feedback HARD: sorpresa baja. Mejorar el cebo o la consecuencia sin ocultar arbitrariamente información necesaria para la solución aprendida.");
    if(diff!==null){
      const modelBand=difficulty(row,level);const perceived=(diff-1)/4*100;
      if(Math.abs(modelBand-perceived)>35)out.push("La dificultad percibida difiere mucho del modelo: revisar legibilidad, controles o conocimiento previo antes de retocar geometría.");
    }
    for(const theme of fb.themes??[])out.push(`Feedback recurrente: ${theme}`);
  }
  if(!out.length)out.push("Sin intervención clara: conservar y recoger más feedback antes de tocar el diseño.");
  return [...new Set(out)];
}

const base=report.rows.map(row=>{const found=levelById.get(row.id);if(!found)throw new Error(`Unknown level in audit report: ${row.id}`);return{row,level:found.level,index:found.index,score:difficulty(row,found.level),fb:feedbackById.get(row.id)??null};});
const globalSorted=[...base].sort((a,b)=>a.score-b.score);const globalRank=new Map(globalSorted.map((x,i)=>[x.row.id,i+1]));
const modeRanks=new Map<string,number>();
for(const mode of["classic","troll"]){[...base].filter(x=>x.row.mode===mode).sort((a,b)=>a.score-b.score).forEach((x,i)=>modeRanks.set(x.row.id,i+1));}
const pacingById=new Map<string,string[]>();
for(const mode of["classic","troll"]){const authored=base.filter(x=>x.row.mode===mode);let prev:number|null=null;for(const x of authored){const flags:string[]=[];if(prev!==null){const delta=x.score-prev;if(delta>=12)flags.push(`SPIKE:+${delta.toFixed(1)}`);if(delta<=-10)flags.push(`DIP:${delta.toFixed(1)}`);}pacingById.set(x.row.id,flags);prev=x.score;}}
const rows:DesignRow[]=base.map(x=>{const pacing=pacingById.get(x.row.id)??[];return{id:x.row.id,mode:x.row.mode,authoredOrder:x.level.group,difficultyScore:x.score,difficultyRank:globalRank.get(x.row.id)!,modeRank:modeRanks.get(x.row.id)!,confidence:confidence(x.row,x.fb),pacingFlags:pacing,auditFlags:x.row.flags,feedback:x.fb,recommendations:recommendations(x.row,x.level,x.fb,pacing)};});
const ranked=[...rows].sort((a,b)=>a.difficultyScore-b.difficultyScore);
console.log("\nAUDIT 2.0 · DIFFICULTY RANKING");
for(const r of ranked)console.log(`${String(r.difficultyRank).padStart(2)}. ${r.id.padEnd(10)} ${r.difficultyScore.toFixed(1).padStart(5)} · ${r.confidence}${r.pacingFlags.length?` · ${r.pacingFlags.join(",")}`:""}`);
console.log("\nAUDIT 2.0 · DESIGN ADVICE");
for(const r of rows.filter(x=>x.recommendations[0]!=="Sin intervención clara: conservar y recoger más feedback antes de tocar el diseño.")){console.log(`\n${r.id} (${r.difficultyScore.toFixed(1)})`);for(const rec of r.recommendations)console.log(`- ${rec}`);}
mkdirSync("artifacts",{recursive:true});
writeFileSync("artifacts/audit2-design.json",JSON.stringify({generatedAt:new Date().toISOString(),feedbackBuildId:feedback?.buildId??null,ranked,rows},null,2));
const md=["# Troll Golf · Audit 2.0 Design",feedback?`Feedback snapshot: **${feedback.buildId??"unspecified"}**`:`Feedback snapshot: **none (simulation-only advice)**`,"","## Difficulty ranking","","| Rank | Hole | Score | Mode rank | Confidence | Pacing |","|---:|---|---:|---:|---|---|",...ranked.map(r=>`| ${r.difficultyRank} | ${r.id} | ${r.difficultyScore.toFixed(1)} | ${r.modeRank} | ${r.confidence} | ${r.pacingFlags.join(", ")||"-"} |`),"","## Recommendations","",...rows.map(r=>`### ${r.id}\n${r.recommendations.map(x=>`- ${x}`).join("\n")}`)];
writeFileSync("artifacts/audit2-design.md",md.join("\n"));
console.log("\nDesign reports: artifacts/audit2-design.json + artifacts/audit2-design.md");
