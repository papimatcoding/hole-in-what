import type { LevelDefinition } from "../types";

export type MechanicId =
  | "sand"
  | "ice"
  | "booster"
  | "ramp"
  | "trampoline"
  | "void"
  | "wind"
  | "portal"
  | "trollTrap";

export interface MechanicTutorial {
  id: MechanicId;
  title: string;
  body: string;
  hint: string;
}

const STORAGE_KEY = "troll-golf-mechanics-seen-v1";

export const MECHANIC_TUTORIALS: Record<MechanicId, MechanicTutorial> = {
  sand: {
    id: "sand",
    title: "ARENA",
    body: "La arena frena mucho la bola. A veces es una ruta segura; otras, un castigo por fallar la línea.",
    hint: "Evítala si necesitas conservar velocidad."
  },
  ice: {
    id: "ice",
    title: "HIELO",
    body: "Sobre hielo la bola apenas pierde velocidad. Los rebotes y la potencia importan mucho más.",
    hint: "Piensa también en dónde vas a terminar."
  },
  booster: {
    id: "booster",
    title: "IMPULSO",
    body: "Las placas de impulso aceleran la bola en la dirección de la flecha mientras las atraviesas.",
    hint: "Puedes usarlas para cambiar una ruta o ganar velocidad."
  },
  ramp: {
    id: "ramp",
    title: "RAMPA",
    body: "Entra en la dirección de la rampa con suficiente velocidad para despegar y pasar por encima de obstáculos.",
    hint: "Más velocidad de entrada = salto más útil."
  },
  trampoline: {
    id: "trampoline",
    title: "TRAMPOLÍN",
    body: "Los trampolines lanzan la bola con mucha más altura. Mientras vuelas puedes cruzar paredes y vacío.",
    hint: "La trayectoria horizontal se mantiene durante el salto."
  },
  void: {
    id: "void",
    title: "VACÍO",
    body: "Si la bola toca el vacío estando en el suelo, vuelve al inicio del golpe. En el aire puedes cruzarlo.",
    hint: "Busca una rampa o un trampolín cuando corte el camino."
  },
  wind: {
    id: "wind",
    title: "VIENTO",
    body: "El viento empuja la bola de forma constante dentro de su zona. La dirección nunca es aleatoria.",
    hint: "Compensa el empuje o úsalo para tomar una curva más rápido."
  },
  portal: {
    id: "portal",
    title: "PORTALES",
    body: "Los portales siempre van por parejas. Entra por uno y saldrás por el otro conservando la velocidad y la dirección.",
    hint: "Piensa en la línea de salida, no solo en cómo entrar."
  },
  trollTrap: {
    id: "trollTrap",
    title: "CAMPO DINÁMICO",
    body: "Algunos elementos del campo pueden reaccionar durante una partida.",
    hint: "Observa lo que ocurre y adapta la siguiente jugada."
  }
};

function readSeen(): Set<MechanicId> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is MechanicId => id in MECHANIC_TUTORIALS));
  } catch {
    return new Set();
  }
}

function writeSeen(seen: Set<MechanicId>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...seen]));
  } catch {
    // Storage can be restricted in some webviews; onboarding can safely repeat.
  }
}

export function mechanicsForLevel(level: LevelDefinition): MechanicId[] {
  const ids: MechanicId[] = [];
  if ((level.sand?.length ?? 0) > 0) ids.push("sand");
  if ((level.ice?.length ?? 0) > 0) ids.push("ice");
  if ((level.boosters?.length ?? 0) > 0) ids.push("booster");
  if ((level.ramps?.length ?? 0) > 0) ids.push("ramp");
  if ((level.trampolines?.length ?? 0) > 0) ids.push("trampoline");
  if ((level.voids?.length ?? 0) > 0) ids.push("void");
  if ((level.winds?.length ?? 0) > 0) ids.push("wind");
  if ((level.portals?.length ?? 0) > 0) ids.push("portal");

  // HARD debe conservar la sorpresa: las trampas reactivas no se anuncian antes de activarse.
  return ids;
}

export function unseenMechanics(level: LevelDefinition): MechanicId[] {
  const seen = readSeen();
  return mechanicsForLevel(level).filter((id) => !seen.has(id));
}

export function markMechanicSeen(id: MechanicId): void {
  const seen = readSeen();
  seen.add(id);
  writeSeen(seen);
}

export function resetMechanicTutorials(): void {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* no-op */ }
}
