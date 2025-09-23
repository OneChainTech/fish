import { fishList, type FishEntry } from "@/data/fish-list";

function normalizeName(name: string) {
  return name.replace(/\s+/g, "").toLowerCase();
}

export function findFishByName(name: string): FishEntry | undefined {
  const normalized = normalizeName(name);
  return fishList.find((fish) => {
    if (normalizeName(fish.name_cn) === normalized) return true;
    if (normalizeName(fish.name_lat) === normalized) return true;
    return fish.alias.some((alias) => normalizeName(alias) === normalized);
  });
}
