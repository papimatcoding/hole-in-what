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
    id:"friends-rc6",
    title:"FRIENDS BETA RC6",
    date:"28 AGO 2026",
    summary:"Nuevos hoyos y mejoras para probar la beta.",
    bullets:[
      "Añadidos Classic 11–13 con hielo y boosters.",
      "Arreglados los campos de nombre y comentarios.",
      "La encuesta global ahora pregunta antes de abrirse y da una recompensa única de 5 gemas.",
      "Vuelve el modo mantenimiento con comprobación y recarga automática."
    ]
  },
  {
    id:"friends-ui-polish-1",
    title:"FRIENDS BETA · UI",
    date:"27 AGO 2026",
    summary:"Mejoras de interfaz.",
    bullets:[
      "Mejorada la interfaz y legibilidad en PC.",
      "Las encuestas post-nivel ahora se envían manualmente.",
      "Añadida la pantalla para editar el nombre de jugador."
    ]
  },
  {
    id:"friends-rc5-1",
    title:"FRIENDS BETA RC5.1",
    date:"27 AGO 2026",
    summary:"Ajustes y correcciones.",
    bullets:[
      "Corregido un problema que hacía HARD 03 demasiado difícil de resolver.",
      "Mejorado el balance del nivel en móvil."
    ]
  },
  {
    id:"friends-rc5",
    title:"FRIENDS BETA RC5",
    date:"27 AGO 2026",
    summary:"Mejoras de perfil y Community Maps.",
    bullets:[
      "El nombre de jugador ya se puede ver desde el juego.",
      "Añadida Asistencia al jugador.",
      "Ya puedes eliminar tus propios Community Maps."
    ]
  },
  {
    id:"friends-rc4",
    title:"FRIENDS BETA RC4",
    date:"27 AGO 2026",
    summary:"Mejoras generales de la beta.",
    bullets:[
      "La encuesta general ahora está integrada dentro del juego.",
      "El juego avisa cuando hay una versión nueva disponible.",
      "Corregidos varios problemas en niveles HARD."
    ]
  },
  {
    id:"friends-rc3",
    title:"FRIENDS BETA RC3",
    date:"27 AGO 2026",
    summary:"Gran actualización de Community Maps.",
    bullets:[
      "Añadidos borradores, publicación, valoraciones y comentarios.",
      "Community Maps ahora se juega con el mismo control que la campaña.",
      "Mejorados los controles y botones en móvil."
    ]
  },
  {
    id:"friends-rc2",
    title:"FRIENDS BETA RC2",
    date:"27 AGO 2026",
    summary:"Primeras mejoras para la beta con amigos.",
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
