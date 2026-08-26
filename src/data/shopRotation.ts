import { cosmetics, type CosmeticCategory } from "./cosmetics";

const SHOP_CATEGORIES: CosmeticCategory[] = ["ball", "trail", "holeEffect"];

function dayKey(date = new Date()): string {
  return `${date.getUTCFullYear()}-${date.getUTCMonth() + 1}-${date.getUTCDate()}`;
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function dailyShopIds(date = new Date()): string[] {
  const key = dayKey(date);

  return SHOP_CATEGORIES.flatMap((category, categoryIndex) => {
    const candidates = cosmetics.filter((item) => item.category === category && item.price !== undefined);
    if (candidates.length === 0) return [];
    const index = hashString(`${key}:${category}:${categoryIndex}`) % candidates.length;
    return [candidates[index].id];
  });
}

export function dailyShopLabel(date = new Date()): string {
  const next = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1));
  const remainingMs = Math.max(0, next.getTime() - date.getTime());
  const hours = Math.floor(remainingMs / 3_600_000);
  const minutes = Math.floor((remainingMs % 3_600_000) / 60_000);
  return `ROTA EN ${hours}H ${minutes.toString().padStart(2, "0")}M`;
}
