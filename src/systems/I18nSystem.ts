import Phaser from "phaser";
import { EN_EXACT, EN_PLACEHOLDERS } from "./I18nDictionary";

export type GameLanguage="es"|"en";

const STORAGE_KEY="troll-golf-language";
let installed=false;

function detectDefault():GameLanguage{
  try{
    const saved=localStorage.getItem(STORAGE_KEY);
    if(saved==="es"||saved==="en")return saved;
  }catch{/* storage is optional */}
  const languages=[...(navigator.languages??[]),navigator.language].filter(Boolean).map(v=>v.toLowerCase());
  return languages.some(v=>v.startsWith("es")||v.startsWith("ca"))?"es":"en";
}

let language:GameLanguage=detectDefault();

function translateDynamic(value:string):string{
  let match:RegExpMatchArray|null;
  if(value==="TOCA")return "TAP";
  if(value==="No hace falta completar el hoyo.")return "You do not need to complete the hole.";
  if(value==="MUY FÁCIL")return "TOO EASY";
  if(value==="MUY DIFÍCIL")return "TOO HARD";
  if(value==="REPETITIVO")return "REPETITIVE";
  if(value==="OBJETO SOBRA")return "UNNEEDED OBJECT";
  if(value==="ELIGE UNA CATEGORÍA")return "CHOOSE A CATEGORY";
  if(value==="✓ GUARDADO LOCAL · SIN RED")return "✓ SAVED LOCALLY · OFFLINE";
  if((match=value.match(/^REPORTAR · (.+)$/)))return `REPORT · ${match[1]}`;
  if((match=value.match(/^JUGADOR · (.+)\s+✎$/)))return `PLAYER · ${match[1]}   ✎`;
  if((match=value.match(/^AHORA ERES · (.+)$/)))return `YOU ARE NOW · ${match[1]}`;
  if((match=value.match(/^ID ANÓNIMA · (.+)$/)))return `ANONYMOUS ID · ${match[1]}`;
  if((match=value.match(/^GRUPO (\d+)\s+·\s+(.+)$/)))return `GROUP ${match[1]}  ·  ${match[2]}`;
  if((match=value.match(/^BETA · TODOS ABIERTOS\s+·\s+(.+)$/)))return `BETA · ALL UNLOCKED   ·   ${match[1]}`;
  if((match=value.match(/^(.+) desbloqueados$/)))return `${match[1]} unlocked`;
  if((match=value.match(/^RÉCORD (\d+)$/)))return `RECORD ${match[1]}`;
  if(value==="RÉCORD —")return "RECORD —";
  if((match=value.match(/^Golpes (\d+)$/)))return `Strokes ${match[1]}`;
  if((match=value.match(/^(\d+) golpe$/)))return `${match[1]} stroke`;
  if((match=value.match(/^(\d+) golpes$/)))return `${match[1]} strokes`;
  if((match=value.match(/^(\d+) golpes · (.+)$/)))return `${match[1]} strokes · ${match[2]}`;
  if((match=value.match(/^por (.+) · TUYO · (\d+) HOYO$/)))return `by ${match[1]} · YOURS · ${match[2]} HOLE`;
  if((match=value.match(/^por (.+) · TUYO · (\d+) HOYOS$/)))return `by ${match[1]} · YOURS · ${match[2]} HOLES`;
  if((match=value.match(/^por (.+) · (\d+) HOYO$/)))return `by ${match[1]} · ${match[2]} HOLE`;
  if((match=value.match(/^por (.+) · (\d+) HOYOS$/)))return `by ${match[1]} · ${match[2]} HOLES`;
  if((match=value.match(/^por (.+)$/)))return `by ${match[1]}`;
  if((match=value.match(/^(.+) · TÚ$/)))return `${match[1]} · YOU`;
  if((match=value.match(/^✓ (\d+)★ ENVIADAS$/)))return `✓ ${match[1]}★ SENT`;
  if((match=value.match(/^BETA LAB · EDITOR\s+·\s+(.+) FB$/)))return `BETA LAB · EDITOR   ·   ${match[1]} FB`;
  if((match=value.match(/^Te faltó 1 golpe para (.+)$/)))return `1 stroke short of ${match[1]}`;
  if((match=value.match(/^Te faltaron (\d+) golpes para (.+)$/)))return `${match[1]} strokes short of ${match[2]}`;
  if((match=value.match(/^([★☆]+\s+≤\s*\d+) golpe$/)))return `${match[1]} stroke`;
  if((match=value.match(/^([★☆]+\s+≤\s*\d+) golpes$/)))return `${match[1]} strokes`;
  if((match=value.match(/^FAVORITO · (.+)\s+·\s+MÁS FLOJO · (.+)$/)))return `FAVOURITE · ${match[1]}   ·   WEAKEST · ${match[2]}`;
  if((match=value.match(/^RECOMPENSA · \+(\d+) ◆$/)))return `REWARD · +${match[1]} ◆`;
  if((match=value.match(/^Encuesta guardada · \+(\d+) ◆$/)))return `Survey saved · +${match[1]} ◆`;
  if((match=value.match(/^(\d+) mapas · ordenados por actividad reciente$/)))return `${match[1]} maps · sorted by recent activity`;
  if((match=value.match(/^(\d+) mapas · ordenados por estrellas$/)))return `${match[1]} maps · sorted by stars`;
  if((match=value.match(/^(\d+) mapas · ordenados por más recientes$/)))return `${match[1]} maps · newest first`;
  if((match=value.match(/^(.*) · (\d+) jugadas · (\d+) jugadores$/)))return `${match[1]} · ${match[2]} plays · ${match[3]} players`;
  if((match=value.match(/^● (\d+) JUGANDO$/)))return `● ${match[1]} PLAYING`;
  return value;
}

function translate(value:string):string{
  if(language==="es")return value;
  return EN_EXACT[value]??translateDynamic(value);
}

function translateDomElement(element:Element):void{
  if(language!=="en")return;
  if(element instanceof HTMLInputElement||element instanceof HTMLTextAreaElement){
    const placeholder=element.getAttribute("placeholder");
    if(placeholder){const next=EN_PLACEHOLDERS[placeholder]??translate(placeholder);if(next!==placeholder)element.setAttribute("placeholder",next);}
    const aria=element.getAttribute("aria-label");
    if(aria){const next=translate(aria);if(next!==aria)element.setAttribute("aria-label",next);}
  }
}

function install():void{
  document.documentElement.lang=language;
  if(installed)return;installed=true;
  const proto=Phaser.GameObjects.Text.prototype as Phaser.GameObjects.Text & {setText:(value:string|string[])=>Phaser.GameObjects.Text};
  const original=proto.setText;
  proto.setText=function(value:string|string[]):Phaser.GameObjects.Text{
    const localized=Array.isArray(value)?value.map(item=>translate(String(item))):translate(String(value));
    return original.call(this,localized);
  };
  const observer=new MutationObserver(records=>{
    for(const record of records)for(const node of Array.from(record.addedNodes)){
      if(!(node instanceof Element))continue;
      translateDomElement(node);
      node.querySelectorAll("input,textarea").forEach(translateDomElement);
    }
  });
  observer.observe(document.body,{childList:true,subtree:true});
}

export const I18n={
  install,
  language:()=>language,
  isEnglish:()=>language==="en",
  text:translate,
  set(next:GameLanguage):void{
    language=next;document.documentElement.lang=next;
    try{localStorage.setItem(STORAGE_KEY,next);}catch{/* storage is optional */}
  },
  toggle():GameLanguage{const next:GameLanguage=language==="es"?"en":"es";this.set(next);return next;},
  localizeDom(element:Element):void{translateDomElement(element);},
  localizeScene(scene:Phaser.Scene):void{
    for(const child of scene.children.list)if(child instanceof Phaser.GameObjects.Text){const current=child.text,next=translate(current);if(next!==current)child.setText(next);}
  }
};
