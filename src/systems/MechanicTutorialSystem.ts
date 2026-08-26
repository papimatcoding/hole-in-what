import type { LevelDefinition } from "../types";

export type MechanicId =
  | "bumper"
  | "sand"
  | "ice"
  | "booster"
  | "ramp"
  | "trampoline"
  | "void"
  | "fan"
  | "portal"
  | "curve"
  | "moving";

export interface MechanicTutorial {
  id: MechanicId;
  title: string;
  body: string;
  hint: string;
}

// New onboarding generation: curated vertical slice + compact explanatory cards.
// Bumping the key deliberately lets current beta testers see the explanations again once.
const STORAGE_KEY = "troll-golf-mechanics-seen-curated-v3";

export const MECHANIC_TUTORIALS: Record<MechanicId, MechanicTutorial> = {
  bumper: { id:"bumper", title:"BUMPER", body:"Rebota la bola con energía extra y cambia mucho su dirección.", hint:"Rebota con fuerza extra. Esquívalo o úsalo para redirigir el tiro." },
  sand: { id:"sand", title:"ARENA", body:"Frena la bola con rapidez mientras la atraviesas.", hint:"La arena frena mucho. Rodéala o úsala para controlar la llegada." },
  ice: { id:"ice", title:"HIELO", body:"La bola conserva casi toda su velocidad y se desliza mucho más.", hint:"Casi no frena: calcula también dónde acabará después del rebote." },
  booster: { id:"booster", title:"IMPULSO", body:"Acelera la bola en la dirección marcada por la flecha.", hint:"Te acelera en la dirección de la flecha. Entra bien orientado." },
  ramp: { id:"ramp", title:"RAMPA", body:"Levanta la bola para pasar por encima de paredes o vacío.", hint:"Te eleva sobre obstáculos. Necesitas entrar alineado y con velocidad." },
  trampoline: { id:"trampoline", title:"TRAMPOLÍN", body:"Da un salto alto manteniendo prácticamente tu dirección horizontal.", hint:"Salta muy alto sin corregir tu rumbo. Apunta antes de tocarlo." },
  void: { id:"void", title:"VACÍO", body:"Si caes desde el suelo vuelves al inicio del golpe; en el aire puedes cruzarlo.", hint:"Desde el suelo caes; en el aire lo cruzas. Busca cómo salvarlo." },
  fan: { id:"fan", title:"VENTILADOR", body:"Su corriente empuja la bola de forma constante dentro de su alcance.", hint:"Su corriente empuja constantemente. Compénsala o úsala a tu favor." },
  portal: { id:"portal", title:"PORTALES", body:"Entras por uno y sales por su pareja conservando velocidad y dirección.", hint:"Conservas velocidad y dirección. La entrada decide la línea de salida." },
  curve: { id:"curve", title:"PARED CURVA", body:"El rebote cambia según el punto exacto donde golpees la curva.", hint:"El punto de impacto cambia el ángulo. Busca el rebote que necesitas." },
  moving: { id:"moving", title:"OBSTÁCULOS MÓVILES", body:"Se mueven con un patrón fijo y repetible durante el hoyo.", hint:"Su patrón se repite. Observa el ritmo y elige cuándo disparar." }
};

function readSeen(): Set<MechanicId> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is MechanicId => id in MECHANIC_TUTORIALS));
  } catch { return new Set(); }
}

function writeSeen(seen: Set<MechanicId>): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...seen])); }
  catch { /* restricted webviews can safely repeat onboarding */ }
}

export function mechanicsForLevel(level: LevelDefinition): MechanicId[] {
  const ids: MechanicId[] = [];
  if ((level.bumpers?.length ?? 0) > 0) ids.push("bumper");
  if ((level.sand?.length ?? 0) > 0) ids.push("sand");
  if ((level.ice?.length ?? 0) > 0) ids.push("ice");
  if ((level.boosters?.length ?? 0) > 0) ids.push("booster");
  if ((level.ramps?.length ?? 0) > 0) ids.push("ramp");
  if ((level.trampolines?.length ?? 0) > 0) ids.push("trampoline");
  if ((level.voids?.length ?? 0) > 0) ids.push("void");
  if ((level.fans?.length ?? 0) > 0 || (level.winds?.length ?? 0) > 0) ids.push("fan");
  if ((level.portals?.length ?? 0) > 0) ids.push("portal");
  if ((level.curves?.length ?? 0) > 0) ids.push("curve");
  if ((level.movingWalls?.length ?? 0) > 0 || (level.movingBumpers?.length ?? 0) > 0) ids.push("moving");
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
