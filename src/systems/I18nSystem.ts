import Phaser from "phaser";

export type GameLanguage="es"|"en";

const STORAGE_KEY="troll-golf-language";
let installed=false;

const exact=new Map<string,string>([
  ["MINIGOLF · 3 ESTRELLAS","MINIGOLF · 3 STARS"],
  ["ELIGE TU NOMBRE   ✎","CHOOSE YOUR NAME   ✎"],
  ["BETA · TODOS LOS HOYOS ABIERTOS","BETA · ALL HOLES UNLOCKED"],
  ["JUEGO Y COLECCIÓN","GAME & COLLECTION"],
  ["PERSONALIZAR","CUSTOMIZE"],
  ["TIENDA","SHOP"],
  ["RECOMPENSAS","REWARDS"],
  ["COMUNIDAD","COMMUNITY"],
  ["ASISTENCIA","SUPPORT"],
  ["ASISTENCIA AL JUGADOR","PLAYER SUPPORT"],
  ["PATCH NOTES   ·   ● NUEVO","PATCH NOTES   ·   ● NEW"],
  ["CAMPAÑA · DESKTOP","CAMPAIGN · DESKTOP"],
  ["CAMPAÑA BETA · TESTER MODE","BETA CAMPAIGN · TESTER MODE"],
  ["CAMPAÑA · CORE SLICE","CAMPAIGN · CORE SLICE"],
  ["BLOQUEADO","LOCKED"],
  ["PREVIEWS","PREVIEWS"],
  ["EDITOR","EDITOR"],
  ["Completar","Complete"],
  ["NUEVAS ESTRELLAS","NEW STARS"],
  ["NUEVA ESTRELLA","NEW STAR"],
  ["RÉCORD DE GOLPES","STROKE RECORD"],
  ["RÉCORD DE TIEMPO","TIME RECORD"],
  ["Ruta de maestría conseguida","Mastery route achieved"],
  ["REINTENTAR","RETRY"],
  ["SIGUIENTE","NEXT"],
  ["‹ ANTERIOR","‹ PREVIOUS"],
  ["‹ ATRÁS","‹ BACK"],
  ["SIGUIENTE ›","NEXT ›"],
  ["NIVELES","LEVELS"],
  ["🏆 RANKING","🏆 LEADERBOARD"],
  ["⚑ REPORTAR","⚑ REPORT"],
  ["¿QUÉ TAL ESTE HOYO?","HOW WAS THIS HOLE?"],
  ["3 respuestas rápidas · pulsa ENVIAR al terminar","3 quick answers · press SEND when done"],
  ["DIVERSIÓN","FUN"],
  ["ORIGINAL","ORIGINALITY"],
  ["DIFICULTAD","DIFFICULTY"],
  ["⚠ BUG","⚠ BUG"],
  ["😈 ME PILLÓ","😈 GOT ME"],
  ["SALTAR","SKIP"],
  ["ENVIAR","SEND"],

  ["ENCUESTA GLOBAL","GLOBAL SURVEY"],
  ["AYÚDANOS A MEJORAR","HELP US IMPROVE"],
  ["¿QUIERES CONTESTAR\nUNA ENCUESTA?","WOULD YOU LIKE TO\nTAKE A SURVEY?"],
  ["Son 4 pantallas cortas. Tus respuestas nos ayudan a decidir\nqué niveles, controles y sistemas mejorar primero.","It is 4 short screens. Your answers help us decide\nwhich levels, controls and systems to improve first."],
  ["RECOMPENSA DE BETA YA RECLAMADA","BETA REWARD ALREADY CLAIMED"],
  ["SÍ, QUIERO AYUDAR","YES, I WANT TO HELP"],
  ["AHORA NO","NOT NOW"],
  ["La recompensa solo se puede reclamar una vez, aunque haya nuevos parches.","The reward can only be claimed once, even after new patches."],
  ["¿CÓMO SE SIENTE EL JUEGO?","HOW DOES THE GAME FEEL?"],
  ["Puntúa del 1 al 5","Rate from 1 to 5"],
  ["DIVERSIÓN GENERAL","OVERALL FUN"],
  ["CONTROLES / GAME FEEL","CONTROLS / GAME FEEL"],
  ["VARIEDAD","VARIETY"],
  ["BALANCE Y HARD","BALANCE & HARD"],
  ["Cómo se siente la dificultad del bloque actual","How the current block difficulty feels"],
  ["CURVA DE DIFICULTAD","DIFFICULTY CURVE"],
  ["MODO HARD","HARD MODE"],
  ["¿JUGARÍAS OTRO BLOQUE DE NIVELES?","WOULD YOU PLAY ANOTHER LEVEL BLOCK?"],
  ["SÍ","YES"],
  ["NO","NO"],
  ["ELIGE TU NIVEL FAVORITO","PICK YOUR FAVOURITE LEVEL"],
  ["¿CUÁL ES EL MÁS FLOJO?","WHICH ONE IS THE WEAKEST?"],
  ["Opcional · nos ayuda a entender qué funciona","Optional · helps us understand what works"],
  ["Opcional · no significa necesariamente que esté roto","Optional · does not necessarily mean it is broken"],
  ["SALTAR FAVORITO","SKIP FAVOURITE"],
  ["SALTAR / CONTINUAR","SKIP / CONTINUE"],
  ["¿QUÉ MEJORARÍAS PRIMERO?","WHAT WOULD YOU IMPROVE FIRST?"],
  ["Puedes marcar varias opciones","You can select several options"],
  ["MÁS NIVELES","MORE LEVELS"],
  ["MEJOR BALANCE","BETTER BALANCE"],
  ["MÁS VARIEDAD","MORE VARIETY"],
  ["CONTROLES","CONTROLS"],
  ["ENVIAR ENCUESTA","SEND SURVEY"],
  ["1 · flojo                                      5 · genial","1 · weak                                      5 · great"],
  ["NO SE PUDO ENVIAR","COULD NOT SEND"],
  ["✓ GRACIAS","✓ THANK YOU"],
  ["Encuesta guardada para esta versión.","Survey saved for this version."],
  ["La recompensa de beta solo se puede reclamar una vez.","The beta reward can only be claimed once."],
  ["VOLVER AL MENÚ","BACK TO MENU"],

  ["COMMUNITY MAPS","COMMUNITY MAPS"],
  ["Descubre, juega y publica mapas de la comunidad","Discover, play and publish community maps"],
  ["TENDENCIA","TRENDING"],
  ["MEJORES","TOP"],
  ["NUEVOS","NEW"],
  ["+ PUBLICAR UN MAPA","+ PUBLISH A MAP"],
  ["Todavía no hay mapas publicados. Sé el primero.","There are no published maps yet. Be the first."],
  ["☆☆☆☆☆ · SIN VOTOS","☆☆☆☆☆ · NO VOTES"],
  ["JUGAR  ›","PLAY  ›"],
  ["BORRAR","DELETE"],
  ["¿BORRAR MAPA?","DELETE MAP?"],
  ["También se borrarán sus partidas, valoraciones, comentarios y reportes.\nEsta acción no se puede deshacer.","Its runs, ratings, comments and reports will also be deleted.\nThis action cannot be undone."],
  ["BORRANDO…","DELETING…"],
  ["No se pudo borrar el mapa.","Could not delete the map."],
  ["MAPA BORRADO","MAP DELETED"],

  ["CARGANDO MAPA…","LOADING MAP…"],
  ["BORRADOR NO ENCONTRADO","DRAFT NOT FOUND"],
  ["NO SE PUDO CARGAR","COULD NOT LOAD"],
  ["MAPA NO VÁLIDO","INVALID MAP"],
  ["✓ PLAYTEST SUPERADO","✓ PLAYTEST PASSED"],
  ["HOYO COMPLETADO","HOLE COMPLETED"],
  ["VOLVER A PUBLICAR","BACK TO PUBLISH"],
  ["Es tu mapa · no puedes valorarlo","This is your map · you cannot rate it"],
  ["VALORA ESTE MAPA","RATE THIS MAP"],
  ["Ya has valorado este mapa","You already rated this map"],
  ["COMENTARIOS","COMMENTS"],
  ["VOLVER A COMMUNITY","BACK TO COMMUNITY"],
  ["CARGANDO…","LOADING…"],
  ["ESCRIBIR / EDITAR EL MÍO","WRITE / EDIT MINE"],
  ["CERRAR","CLOSE"],
  ["AÚN NO HAY COMENTARIOS","NO COMMENTS YET"],
  ["EDITAR COMENTARIO","EDIT COMMENT"],
  ["ESCRIBIR COMENTARIO","WRITE COMMENT"],
  ["Máximo 500 caracteres","Maximum 500 characters"],
  ["GUARDAR COMENTARIO","SAVE COMMENT"],
  ["CANCELAR","CANCEL"],
  ["ESCRIBE UN COMENTARIO","WRITE A COMMENT"],
  ["✓ COMENTARIO GUARDADO","✓ COMMENT SAVED"],
  ["NO SE PUDO GUARDAR","COULD NOT SAVE"],
  ["REPORTAR MAPA","REPORT MAP"],
  ["Esto no afecta a la valoración por estrellas","This does not affect the star rating"],
  ["IMPOSIBLE","IMPOSSIBLE"],
  ["INAPROPIADO","INAPPROPRIATE"],
  ["OTRO","OTHER"],
  ["DETALLE DEL REPORTE","REPORT DETAILS"],
  ["Opcional · máximo 500 caracteres","Optional · maximum 500 characters"],
  ["✓ REPORTE ENVIADO","✓ REPORT SENT"],
  ["NO SE PUDO REPORTAR","COULD NOT REPORT"],

  ["PERFIL DE JUGADOR","PLAYER PROFILE"],
  ["El nombre que verán otros testers en rankings y Community Maps","The name other testers will see in leaderboards and Community Maps"],
  ["AÚN NO TIENES NOMBRE","YOU DO NOT HAVE A NAME YET"],
  ["Cambiarlo no reinicia encuestas, ratings ni estadísticas.","Changing it does not reset surveys, ratings or stats."],
  ["GUARDAR NOMBRE","SAVE NAME"],
  ["IDENTIDAD BETA","BETA IDENTITY"],
  ["La ID permanece estable en este navegador.\nTu nombre es solo la etiqueta visible y puede cambiar.","The ID stays stable in this browser.\nYour name is only the visible label and can change."],
  ["Perfil, encuesta y contacto directo con la beta","Profile, survey and direct beta feedback"],
  ["SIN NOMBRE","NO NAME"],
  ["ENCUESTA GENERAL\nYA ENVIADA","GENERAL SURVEY\nALREADY SENT"],
  ["ENCUESTA GENERAL\nABRIR","GENERAL SURVEY\nOPEN"],
  ["ENCUESTA GENERAL · YA ENVIADA","GENERAL SURVEY · SENT"],
  ["ENCUESTA GENERAL","GENERAL SURVEY"],
  ["ENVIAR COMENTARIO","SEND FEEDBACK"],
  ["Puedes enviar un bug, sugerencia o comentario sin estar dentro de un hoyo.","You can send a bug, suggestion or comment without being inside a hole."],
  ["COMENTARIO","COMMENT"],
  ["SUGERENCIA","SUGGESTION"],
  ["ENVIAR A DESARROLLO","SEND TO DEVELOPMENT"],
  ["¿PROBLEMA DE UN HOYO CONCRETO?","PROBLEM WITH A SPECIFIC HOLE?"],
  ["Usa también REPORTAR dentro del hoyo.\nAsí recibimos nivel, golpes y tiempo automáticamente.","You can also use REPORT inside the hole.\nThat automatically includes level, strokes and time."],
  ["CUÉNTANOS QUÉ PASÓ","TELL US WHAT HAPPENED"],
  ["Detalle opcional · máximo 400 caracteres","Optional details · maximum 400 characters"],
  ["GUARDANDO…","SAVING…"],
  ["NOMBRE ACTUALIZADO","NAME UPDATED"],
  ["ENVIANDO…","SENDING…"],
  ["ENVIADO · gracias por el feedback","SENT · thanks for the feedback"],
  ["No se pudo enviar. Inténtalo otra vez.","Could not send it. Please try again."],
  ["Escribe algo antes de enviar.","Write something before sending."],
  ["Escribe un nombre antes de guardar.","Enter a name before saving."],
  ["No se pudo guardar el nombre en este navegador.","Could not save the name in this browser."],
  ["ONLINE","ONLINE"]
]);

const placeholderExact=new Map<string,string>([
  ["Escribe tu nombre o apodo","Type your name or nickname"],
  ["Escribe tu comentario…","Write your comment…"],
  ["Describe el problema si quieres…","Describe the problem if you want…"],
  ["Escribe aquí…","Write here…"],
  ["Escribe aquí. Cuanto más concreto, mejor…","Write here. The more specific, the better…"]
]);

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
  if((match=value.match(/^por (.+)$/)))return `by ${match[1]}`;
  if((match=value.match(/^(.+) · TÚ$/)))return `${match[1]} · YOU`;
  if((match=value.match(/^por (.+) · TUYO · (\d+) HOYO$/)))return `by ${match[1]} · YOURS · ${match[2]} HOLE`;
  if((match=value.match(/^por (.+) · TUYO · (\d+) HOYOS$/)))return `by ${match[1]} · YOURS · ${match[2]} HOLES`;
  if((match=value.match(/^por (.+) · (\d+) HOYO$/)))return `by ${match[1]} · ${match[2]} HOLE`;
  if((match=value.match(/^por (.+) · (\d+) HOYOS$/)))return `by ${match[1]} · ${match[2]} HOLES`;
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
  return exact.get(value)??translateDynamic(value);
}

function translateDomElement(element:Element):void{
  if(language!=="en")return;
  if(element instanceof HTMLInputElement||element instanceof HTMLTextAreaElement){
    const placeholder=element.getAttribute("placeholder");
    if(placeholder){const next=placeholderExact.get(placeholder)??translate(placeholder);if(next!==placeholder)element.setAttribute("placeholder",next);}
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
      if(!(node instanceof Element))continue;translateDomElement(node);node.querySelectorAll("input,textarea").forEach(translateDomElement);
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
