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
