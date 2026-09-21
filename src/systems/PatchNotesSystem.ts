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
    id:"beta-rc7-prestige",
    title:"RC7 · PRESTIGIO",
    date:"21 SEP 2026",
    summary:"Progreso más visual, menú más limpio y menos interrupciones.",
    bullets:[
      "Pase de Prestigio rediseñado para mostrar claramente hitos y progreso.",
      "Las nuevas estrellas animan su avance hacia Prestigio al terminar un hoyo.",
      "Patch Notes ahora respeta el idioma seleccionado.",
      "Menú principal reorganizado con una jerarquía más limpia.",
      "Otros ajustes."
    ]
  },
  {
    id:"beta-rc7-flow",
    title:"RC7 · FLOW",
    date:"21 SEP 2026",
    summary:"Flujo de campaña más claro y menos interrupciones.",
    bullets:[
      "JUGAR abre siempre el selector de niveles antes de entrar al campo.",
      "La valoración post-nivel es voluntaria mediante un botón visible en Resultados.",
      "Community Maps está temporalmente cerrada.",
      "Se ha simplificado el menú principal.",
      "Otros ajustes."
    ]
  },
  {
    id:"beta-rc6",
    title:"BETA RC6",
    date:"28 AGO 2026",
    summary:"Nuevo nombre, nuevos hoyos y mejoras de juego.",
    bullets:[
      "Troll Golf ahora se llama Hole in What?.",
      "Añadidos Classic 11–13 con hielo y boosters.",
      "HARD 01 ahora tiene una solución aprendida mucho más cómoda en táctil.",
      "Arreglados los campos de nombre, comentarios y reportes con texto dentro del juego.",
      "La encuesta global ahora pregunta antes de abrirse y da una recompensa única de 5 gemas.",
      "Otros ajustes."
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
      "Añadida la pantalla para editar el nombre de jugador.",
      "Otros ajustes."
    ]
  }
];

function readId():string|null{try{return localStorage.getItem(READ_KEY);}catch{return null;}}
export const PatchNotes={
  latest():PatchNote{return PATCH_NOTES[0]!;},
  hasUnread():boolean{return readId()!==PATCH_NOTES[0]?.id;},
  markRead():void{try{const id=PATCH_NOTES[0]?.id;if(id)localStorage.setItem(READ_KEY,id);}catch{/* optional */}}
};
