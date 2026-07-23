export type AvatarAssetCategory = "shirt" | "bottoms" | "shoes" | "glasses" | "watch" | "skateboard" | "bag" | "cap";
export type AvatarAsset = { id: string; brand: "Adidas" | "Nike" | "Puma"; category: AvatarAssetCategory; name: string; cost: number; colour: string };

const brands = [{ brand: "Adidas", colour: "#111827" }, { brand: "Nike", colour: "#EA580C" }, { brand: "Puma", colour: "#DC2626" }] as const;
const categories: Array<{ category: AvatarAssetCategory; name: string; cost: number }> = [
  { category: "shirt", name: "shirt", cost: 120 }, { category: "bottoms", name: "shorts", cost: 100 }, { category: "shoes", name: "sneakers", cost: 160 }, { category: "glasses", name: "glasses", cost: 80 },
  { category: "watch", name: "watch", cost: 70 }, { category: "skateboard", name: "skateboard", cost: 220 }, { category: "bag", name: "backpack", cost: 140 }, { category: "cap", name: "cap", cost: 90 }
];
export const avatarShopAssets: AvatarAsset[] = brands.flatMap((brand) => categories.map((item) => ({ id: `${brand.brand.toLowerCase()}-${item.category}`, brand: brand.brand, category: item.category, name: `${brand.brand} ${item.name}`, cost: item.cost, colour: brand.colour })));
