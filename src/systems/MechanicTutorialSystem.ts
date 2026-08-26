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

// New key so beta testers experience the redesigned mechanic cadence from scratch.
const STORAGE_KEY = "troll-golf-mechanics-seen-curriculum-v2";

export const MECHANIC_TUTORIALS: Record<MechanicId, MechanicTutorial> = {
  bumper: { id:"bumper", title:"BUMPER", body:"Los bumpers rebotan la bola con energía extra y pueden convertir un impacto en un cambio fuerte de dirección.", hint:"Úsalos como parte de la trayectoria, no como una pared más." },
  sand: { id:"sand", title:"ARENA", body:"La arena frena mucho la bola. Puede convertir una buena línea en un tiro corto.", hint:"Evítala cuando necesites conservar velocidad." },
  ice: { id:"ice", title:"HIELO", body:"Sobre hielo la bola apenas pierde velocidad y cualquier rebote se prolonga mucho más.", hint:"Piensa en dónde terminarás, no solo en atravesarlo." },
  booster: { id:"booster", title:"IMPULSO", body:"Las placas de impulso aceleran la bola en la dirección de la flecha.", hint:"Úsalas para alimentar una ruta, no luches contra ellas." },
  ramp: { id:"ramp", title:"RAMPA", body:"Las rampas levantan la bola y permiten pasar por encima de paredes o vacío.", hint:"Entra alineado y con velocidad suficiente." },
  trampoline: { id:"trampoline", title:"TRAMPOLÍN", body:"El trampolín da un salto más alto que una rampa mientras mantiene la trayectoria horizontal.", hint:"Apunta primero; el trampolín no corrige tu dirección." },
  void: { id:"void", title:"VACÍO", body:"Tocar el vacío desde el suelo devuelve la bola al inicio del golpe. En el aire puedes cruzarlo.", hint:"Busca una ruta segura o una forma de saltarlo." },
  fan: { id:"fan", title:"VENTILADOR", body:"Los ventiladores generan una corriente visible que empuja la bola mientras está dentro de su alcance.", hint:"La fuerza es constante: compénsala o aprovéchala." },
  portal: { id:"portal", title:"PORTALES", body:"Los portales van por parejas. Conservas velocidad y dirección al salir por el otro extremo.", hint:"La línea de salida importa tanto como la entrada." },
  curve: { id:"curve", title:"PARED CURVA", body:"Las paredes curvas cambian el ángulo de rebote de forma continua según el punto de impacto.", hint:"Úsalas para redirigir tiros que una pared recta no permitiría." },
  moving: { id:"moving", title:"OBSTÁCULOS MÓVILES", body:"Algunas paredes y bumpers recorren una trayectoria fija y repetible durante el hoyo.", hint:"Observa el ritmo antes de tirar. El timing también cuenta." }
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
