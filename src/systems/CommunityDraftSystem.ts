import type { LevelDefinition } from "../types";

const WORKING_KEY="troll-golf-editor-draft-v2";
const SAVED_KEY="troll-golf-community-saved-drafts-v1";
const ACTIVE_KEY="troll-golf-community-active-draft-v1";

export interface SavedCommunityDraft{
  id:string;
  name:string;
  updatedAt:string;
  playtestedAt:string|null;
  level:LevelDefinition;
}

function clone<T>(value:T):T{return JSON.parse(JSON.stringify(value)) as T;}
function read():SavedCommunityDraft[]{
  try{
    const raw=localStorage.getItem(SAVED_KEY);if(!raw)return[];
    const parsed=JSON.parse(raw) as SavedCommunityDraft[];if(!Array.isArray(parsed))return[];
    return parsed.filter(x=>typeof x?.id==="string"&&typeof x?.name==="string"&&Boolean(x?.level?.ball)&&Boolean(x?.level?.hole));
  }catch{return[];}
}
function write(items:SavedCommunityDraft[]):void{try{localStorage.setItem(SAVED_KEY,JSON.stringify(items.slice(0,40)));}catch{/* local draft storage is best effort */}}
function makeId():string{try{return crypto.randomUUID();}catch{return`draft-${Date.now()}-${Math.random().toString(16).slice(2)}`;}}
function activeId():string|null{try{return localStorage.getItem(ACTIVE_KEY);}catch{return null;}}
function setActive(id:string|null):void{try{if(id)localStorage.setItem(ACTIVE_KEY,id);else localStorage.removeItem(ACTIVE_KEY);}catch{/* optional */}}
function saveWorking(level:LevelDefinition):void{try{localStorage.setItem(WORKING_KEY,JSON.stringify(level));}catch{/* optional */}}
function working():LevelDefinition|null{try{const raw=localStorage.getItem(WORKING_KEY);if(!raw)return null;const level=JSON.parse(raw) as LevelDefinition;return level?.ball&&level?.hole?level:null;}catch{return null;}}

export const CommunityDrafts={
  list():SavedCommunityDraft[]{return read().sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));},
  get(id:string):SavedCommunityDraft|null{return read().find(x=>x.id===id)??null;},
  working,
  activeId,
  captureWorking(name:string,replaceId?:string):SavedCommunityDraft|null{
    const level=working();if(!level)return null;const items=read(),now=new Date().toISOString(),index=replaceId?items.findIndex(x=>x.id===replaceId):-1;
    if(index>=0){const old=items[index]!;const next:SavedCommunityDraft={...old,name:(name.trim()||old.name).slice(0,48),updatedAt:now,playtestedAt:null,level:clone(level)};items[index]=next;write(items);setActive(next.id);return next;}
    const id=makeId(),next:SavedCommunityDraft={id,name:(name.trim()||"Mi mapa").slice(0,48),updatedAt:now,playtestedAt:null,level:clone(level)};items.push(next);write(items);setActive(id);return next;
  },
  save(level:LevelDefinition,name?:string):SavedCommunityDraft{
    saveWorking(level);const captured=this.captureWorking(name??"Mi mapa");if(captured)return captured;
    throw new Error("draft_save_failed");
  },
  syncActive(level:LevelDefinition):void{
    const id=activeId();if(!id)return;saveWorking(level);const old=this.get(id);if(old)this.captureWorking(old.name,id);else setActive(null);
  },
  openInEditor(id:string):boolean{
    const draft=this.get(id);if(!draft)return false;setActive(id);saveWorking(clone(draft.level));return true;
  },
  detach():void{setActive(null);},
  remove(id:string):void{const items=read().filter(x=>x.id!==id);write(items);if(activeId()===id)setActive(null);},
  rename(id:string,name:string):void{const items=read(),index=items.findIndex(x=>x.id===id);if(index<0)return;items[index]={...items[index]!,name:name.trim().slice(0,48)||items[index]!.name,updatedAt:new Date().toISOString()};write(items);},
  markPlaytested(id:string):void{const items=read(),index=items.findIndex(x=>x.id===id);if(index<0)return;items[index]={...items[index]!,playtestedAt:new Date().toISOString()};write(items);},
  isPlaytested(id:string):boolean{return Boolean(this.get(id)?.playtestedAt);}
};
