export type CosmeticCategory = "ball" | "trail" | "holeEffect";

export interface CosmeticDefinition {
  id: string;
  category: CosmeticCategory;
  name: string;
  description: string;
  primary: number;
  secondary?: number;
  rarity: "common" | "rare" | "epic" | "seasonal" | "milestone";
  price?: number;
}

export const cosmetics: CosmeticDefinition[] = [
  { id: "ball-classic", category: "ball", name: "Classic", description: "Golf puro. Hoyuelos incluidos.", primary: 0xfbfefe, secondary: 0xbac4ce, rarity: "common" },
  { id: "ball-midnight", category: "ball", name: "Midnight", description: "Negro mate con media luna fría.", primary: 0x111821, secondary: 0x8eb6d4, rarity: "rare", price: 120 },
  { id: "ball-orbit", category: "ball", name: "Orbit", description: "Un pequeño planeta en juego.", primary: 0x203b67, secondary: 0x86d9ff, rarity: "rare", price: 220 },
  { id: "ball-ember", category: "ball", name: "Ember", description: "Núcleo oscuro con grietas vivas.", primary: 0x241816, secondary: 0xff9b4a, rarity: "epic", price: 320 },
  { id: "ball-ace", category: "ball", name: "Ace", description: "Marca de precisión. Solo por estrellas.", primary: 0xf4f7f8, secondary: 0xe5c66b, rarity: "milestone" },
  { id: "ball-prism", category: "ball", name: "Prism", description: "El hito alto de la primera campaña.", primary: 0xd9e7ff, secondary: 0xc8a8ff, rarity: "milestone" },
  { id: "ball-spirit", category: "ball", name: "Spirit Orb", description: "Flor de luz suspendida en un orbe.", primary: 0xb8d8ff, secondary: 0xe9c7ff, rarity: "seasonal" },

  { id: "trail-none", category: "trail", name: "Sin estela", description: "Limpio y simple.", primary: 0xffffff, rarity: "common" },
  { id: "trail-mist", category: "trail", name: "Mist", description: "Motas suaves que se disipan.", primary: 0xc8e6ff, rarity: "rare", price: 100 },
  { id: "trail-sparks", category: "trail", name: "Sparks", description: "Destellos cortos tras cada golpe.", primary: 0xffd27d, secondary: 0xff8f5a, rarity: "epic", price: 180 },
  { id: "trail-stardust", category: "trail", name: "Stardust", description: "Polvo dorado ganado por estrellas.", primary: 0xf2d57b, secondary: 0xffffff, rarity: "milestone" },
  { id: "trail-aurora", category: "trail", name: "Aurora", description: "Bruma fría de un hito avanzado.", primary: 0x8fe9d1, secondary: 0xb9a9ff, rarity: "milestone" },
  { id: "trail-petals", category: "trail", name: "Petals", description: "Pétalos espirituales en movimiento.", primary: 0xf0c9ef, secondary: 0xc8d7ff, rarity: "seasonal" },

  { id: "hole-default", category: "holeEffect", name: "Default", description: "Entrada limpia.", primary: 0xffffff, rarity: "common" },
  { id: "hole-pulse", category: "holeEffect", name: "Pulse", description: "Una onda concéntrica al embocar.", primary: 0xa8d8ff, rarity: "rare", price: 130 },
  { id: "hole-nova", category: "holeEffect", name: "Nova", description: "Un destello radial breve y seco.", primary: 0xffd98a, secondary: 0xffffff, rarity: "epic", price: 240 },
  { id: "hole-bloom", category: "holeEffect", name: "Spirit Bloom", description: "Una flor de luz se abre en el hoyo.", primary: 0xe8bfe8, secondary: 0xbad9ff, rarity: "seasonal" }
];

export const cosmeticsByCategory = (category: CosmeticCategory): CosmeticDefinition[] =>
  cosmetics.filter((item) => item.category === category);

export const cosmeticById = (id: string): CosmeticDefinition | undefined =>
  cosmetics.find((item) => item.id === id);
