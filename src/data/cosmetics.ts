export type CosmeticCategory = "ball" | "trail" | "holeEffect";

export interface CosmeticDefinition {
  id: string;
  category: CosmeticCategory;
  name: string;
  description: string;
  primary: number;
  secondary?: number;
  rarity: "common" | "rare" | "epic" | "seasonal";
}

export const cosmetics: CosmeticDefinition[] = [
  { id: "ball-classic", category: "ball", name: "Classic", description: "La original.", primary: 0xfbfefe, secondary: 0xbac4ce, rarity: "common" },
  { id: "ball-midnight", category: "ball", name: "Midnight", description: "Negro mate con borde frío.", primary: 0x151b23, secondary: 0x87a4bd, rarity: "rare" },
  { id: "ball-spirit", category: "ball", name: "Spirit Orb", description: "Un adelanto de Spirit Bloom.", primary: 0xb8d8ff, secondary: 0xe9c7ff, rarity: "seasonal" },

  { id: "trail-none", category: "trail", name: "Sin estela", description: "Limpio y simple.", primary: 0xffffff, rarity: "common" },
  { id: "trail-mist", category: "trail", name: "Mist", description: "Pequeñas motas suaves.", primary: 0xc8e6ff, rarity: "rare" },
  { id: "trail-petals", category: "trail", name: "Petals", description: "Pétalos espirituales.", primary: 0xf0c9ef, secondary: 0xc8d7ff, rarity: "seasonal" },

  { id: "hole-default", category: "holeEffect", name: "Default", description: "Entrada limpia.", primary: 0xffffff, rarity: "common" },
  { id: "hole-pulse", category: "holeEffect", name: "Pulse", description: "Una onda al embocar.", primary: 0xa8d8ff, rarity: "rare" },
  { id: "hole-bloom", category: "holeEffect", name: "Spirit Bloom", description: "Una flor de luz al embocar.", primary: 0xe8bfe8, secondary: 0xbad9ff, rarity: "seasonal" }
];

export const cosmeticsByCategory = (category: CosmeticCategory): CosmeticDefinition[] =>
  cosmetics.filter((item) => item.category === category);

export const cosmeticById = (id: string): CosmeticDefinition | undefined =>
  cosmetics.find((item) => item.id === id);
