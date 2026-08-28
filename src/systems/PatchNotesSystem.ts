export interface PatchNote{
  id:string;
  title:string;
  date:string;
  summary:string;
  bullets:string[];
}

// Legacy key retained so the rebrand does not make old notes unread again for existing testers.
const READ_KEY="troll-golf-last-read-patch-v1";

export const PATCH_NOTES:PatchNote[]=[
  {
    id:"beta-rc6",
    title:"BETA RC6",
    date:"28 AGO 2026",
    summary:"Nuevo nombre, nuevos hoyos y mejoras para seguir probando la beta.",
    bullets:[
      "Troll Golf ahora se llama Hole in What?.",
      "Añadidos Classic 11–13 con hielo y boosters.",
      "Arreglados los campos de nombre y comentarios.",
      "La encuesta global ahora pregunta antes de abrirse y da una recompensa única de 5 gemas.",
      "Mejoradas las métricas anónimas de juego para detectar problemas de balance y abandono.",
      "Vuelve el modo mantenimiento con comprobación y recarga automática."
    ]
  },
  {
    id:"beta-ui-polish-1",
    title:"BETA · UI",
    date:"27 AGO 2026",
    summary:"Mejoras de interfaz.",
    bullets:[
      "Mejorada la interfaz y legibilidad en PC.",
      "Las encuestas post-nivel ahora se envían manualmente.",
      "Añadida la pantalla para editar el nombre de jugador."
    ]
  },
  {
    id:"beta-rc5-1",
    title:"BETA RC5.1",
    date:"27 AGO 2026",
    summary:"Ajustes y correcciones.",
    bullets:[
      "Corregido un problema que hacía HARD 03 demasiado difícil de resolver.",
      "Mejorado el balance del nivel en móvil."
    ]
  },
  {
    id:"beta-rc5",
    title:"BETA RC5",
    date:"27 AGO 2026",
    summary:"Mejoras de perfil y Community Maps.",
    bullets:[
      "El nombre de jugador ya se puede ver desde el juego.",
      "Añadida Asistencia al jugador.",
      "Ya puedes eliminar tus propios Community Maps."
    ]
  },
  {
    id:"beta-rc4",
    title:"BETA RC4",
    date:"27 AGO 2026",
    summary:"Mejoras generales de la beta.",
    bullets:[
      "La encuesta general ahora está integrada dentro del juego.",
      "El juego avisa cuando hay una versión nueva disponible.",
      "Corregidos varios problemas en niveles HARD."
    ]
  },
  {
    id:"beta-rc3",
    title:"BETA RC3",
    date:"27 AGO 2026",
    summary:"Gran actualización de Community Maps.",
    bullets:[
      "Añadidos borradores, publicación, valoraciones y comentarios.",
      "Community Maps ahora se juega con el mismo control que la campaña.",
      "Mejorados los controles y botones en móvil."
    ]
  },
  {
    id:"beta-rc2",
    title:"BETA RC2",
    date:"27 AGO 2026",
    summary:"Primeras mejoras de la beta.",
    bullets:[
      "Añadidos reportes dentro de los niveles.",
      "Añadido contador aproximado de jugadores online.",
      "Mejorados los controles táctiles."
    ]
  }
];

function readId():string|null{try{return localStorage.getItem(READ_KEY);}catch{return null;}}
export const PatchNotes={
  latest():PatchNote{return PATCH_NOTES[0]!;},
  hasUnread():boolean{return readId()!==PATCH_NOTES[0]?.id;},
  markRead():void{try{const id=PATCH_NOTES[0]?.id;if(id)localStorage.setItem(READ_KEY,id);}catch{/* optional */}}
};
