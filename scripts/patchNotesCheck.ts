import assert from "node:assert/strict";
import { PATCH_NOTES, PatchNotes } from "../src/systems/PatchNotesSystem";
import { EN_EXACT } from "../src/systems/I18nDictionary";
import { EN_SURFACE_EXACT } from "../src/systems/I18nSurfaceDictionary";

const data=new Map<string,string>();
Object.defineProperty(globalThis,"localStorage",{value:{getItem:(key:string)=>data.get(key)??null,setItem:(key:string,value:string)=>data.set(key,value)}});
for(const note of PATCH_NOTES){
  for(const item of [note.title,note.summary,...note.bullets]){
    assert(item in EN_SURFACE_EXACT||item in EN_EXACT||/^(RC7 · (WORLDS|FLOW)|BETA (RC6|· UI))$/.test(item),`Patch translation missing: ${item}`);
  }
}
assert(PatchNotes.hasUnread());
PatchNotes.markRead();assert(!PatchNotes.hasUnread());
const first=PatchNotes.latest().id;PatchNotes.dismiss(first);
assert(!PatchNotes.visible().some(note=>note.id===first));
assert(PatchNotes.hasUnread(),"Next visible patch should be unread");
console.log("Patch inbox and ES/EN note coverage OK");
