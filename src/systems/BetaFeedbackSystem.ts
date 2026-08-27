import type { GameMode } from "../types";
import { BetaTelemetry } from "./BetaTelemetrySystem";

export type BetaFeedbackCategory = "bug" | "too-easy" | "too-hard" | "repetitive" | "object" | "other";

export interface BetaFeedbackContext {
  levelId: string;
  mode: GameMode;
  levelIndex: number;
  strokes?: number | null;
  timeMs?: number | null;
}

export interface BetaFeedbackEntry extends Omit<BetaFeedbackContext,"strokes"|"timeMs"> {
  id: string;
  strokes: number | null;
  timeMs: number | null;
  category: BetaFeedbackCategory;
  note: string;
  createdAt: string;
}

const STORAGE_KEY="troll-golf-beta-feedback-v1";

function load():BetaFeedbackEntry[]{
  try{
    const raw=localStorage.getItem(STORAGE_KEY);
    if(!raw)return[];
    const parsed=JSON.parse(raw) as unknown;
    return Array.isArray(parsed)?parsed.filter((x):x is BetaFeedbackEntry=>Boolean(x&&typeof x==="object"&&"levelId" in x&&"category" in x)):[];
  }catch{return[];}
}

function persist(entries:BetaFeedbackEntry[]):void{
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(entries));}catch{/* beta tooling must never break gameplay */}
}

function label(category:BetaFeedbackCategory):string{
  const labels:Record<BetaFeedbackCategory,string>={
    bug:"BUG",
    "too-easy":"MUY FÁCIL",
    "too-hard":"MUY DIFÍCIL",
    repetitive:"REPETITIVO",
    object:"OBJETO / MAPA",
    other:"OTRO"
  };
  return labels[category];
}

export const BetaFeedbackSystem={
  add(context:BetaFeedbackContext,category:BetaFeedbackCategory,note=""):BetaFeedbackEntry{
    const entries=load();
    const entry:BetaFeedbackEntry={
      levelId:context.levelId,
      mode:context.mode,
      levelIndex:context.levelIndex,
      strokes:context.strokes??null,
      timeMs:context.timeMs??null,
      id:`fb-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
      category,
      note:note.trim(),
      createdAt:new Date().toISOString()
    };
    entries.push(entry);persist(entries);
    void BetaTelemetry.submitReport({levelId:entry.levelId,mode:entry.mode,category:entry.category,note:entry.note,strokes:entry.strokes,timeMs:entry.timeMs});
    return entry;
  },
  list():BetaFeedbackEntry[]{return load();},
  count():number{return load().length;},
  clear():void{try{localStorage.removeItem(STORAGE_KEY);}catch{/* no-op */}},
  exportText():string{
    const entries=load();
    if(entries.length===0)return"TROLL GOLF BETA FEEDBACK\nSin feedback guardado.";
    return ["TROLL GOLF BETA FEEDBACK",...entries.map((x,i)=>{
      const run=[x.strokes===null?null:`${x.strokes} golpes`,x.timeMs===null?null:`${(x.timeMs/1000).toFixed(1)} s`].filter(Boolean).join(" · ");
      return `${i+1}. ${x.levelId} · ${label(x.category)}${run?` · ${run}`:""}${x.note?`\n   ${x.note}`:""}\n   ${x.createdAt}`;
    })].join("\n\n");
  },
  async copyAll():Promise<boolean>{
    const text=this.exportText();
    try{await navigator.clipboard.writeText(text);return true;}catch{return false;}
  }
};
