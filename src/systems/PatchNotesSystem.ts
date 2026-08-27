export interface PatchNote{
  id:string;
  title:string;
  date:string;
  summary:string;
  bullets:string[];
}

const READ_KEY="troll-golf-last-read-patch-v1";

export const PATCH_NOTES:PatchNote[]=[
  {
    id:"friends-rc5",
    title:"FRIENDS BETA RC5 · PLAYER UX",
    date:"27 AGO 2026",
    summary:"Más control para testers y creadores, y otro pase profundo a HARD 03 basado en feedback real.",
    bullets:[
      "Tu nombre de jugador ahora se ve y se edita completamente dentro del juego; tu ID de tester permanece estable.",
      "Nueva sección Asistencia al jugador en el menú para perfil, encuesta general y comentarios directos.",
      "Los creadores pueden borrar sus propios Community Maps con confirmación y validación del servidor.",
      "HARD 03 reconstruido alrededor de una falsa ruta cuyo suelo desaparece al comprometer el primer tiro.",
      "RC5 usa un bucket de telemetría nuevo para medir estos cambios por separado."
    ]
  },
  {
    id:"friends-rc4",
    title:"FRIENDS BETA RC4 · QUALITY PASS",
    date:"27 AGO 2026",
    summary:"Mejoramos la fiabilidad de la beta y corregimos problemas detectados con feedback real.",
    bullets:[
      "El juego detecta si tu pestaña está en una build antigua y pide actualizar antes de seguir.",
      "La encuesta global ahora es una experiencia completa dentro del juego, sin prompts del navegador.",
      "HARD 03 recibió un primer rediseño, sustituido de nuevo en RC5 tras feedback humano insuficiente.",
      "Patch Notes siguen marcados como SIN LEER hasta que abras esta pantalla.",
      "RC4 usa un bucket de telemetría propio para comparar datos limpios."
    ]
  },
  {
    id:"friends-rc3",
    title:"FRIENDS BETA RC3 · COMMUNITY",
    date:"27 AGO 2026",
    summary:"Community Maps deja de ser un prototipo y pasa a tener un flujo social claro.",
    bullets:[
      "Borradores guardados, selección explícita, playtest y publicación.",
      "Community Play con el mismo control, cosméticos y feedback base que campaña.",
      "Valoración general por estrellas, tendencia, jugadas y jugadores activos.",
      "Comentarios y reportes de mapas comunitarios.",
      "Tiro asistido cerca de bordes y botones de feedback con hitboxes más grandes.",
      "Nueva pestaña de parches con aviso de contenido sin leer."
    ]
  },
  {
    id:"friends-rc2",
    title:"FRIENDS BETA RC2 · LIVE OPS",
    date:"27 AGO 2026",
    summary:"Mejoras de input, reporting y herramientas para una beta con gente real.",
    bullets:[
      "Reportes disponibles dentro de un hoyo sin necesidad de completarlo.",
      "Contador aproximado de jugadores online.",
      "Pantalla de mantenimiento remota para despliegues.",
      "Mejoras de touch y telemetría de mecánicas/trampas."
    ]
  }
];

function readId():string|null{try{return localStorage.getItem(READ_KEY);}catch{return null;}}
export const PatchNotes={
  latest():PatchNote{return PATCH_NOTES[0]!;},
  hasUnread():boolean{return readId()!==PATCH_NOTES[0]?.id;},
  markRead():void{try{const id=PATCH_NOTES[0]?.id;if(id)localStorage.setItem(READ_KEY,id);}catch{/* optional */}}
};
