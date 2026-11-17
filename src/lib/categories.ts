export interface CategoryItem {
  name: string;
  slug: string;
}

export const MARKETPLACE_CATEGORIES: CategoryItem[] = [
  { name: "Vehicles", slug: "vehicles" },
  { name: "Property Rentals", slug: "property-rentals" },
  { name: "Apparel", slug: "apparel" },
  { name: "Classifieds", slug: "classifieds" },
  { name: "Electronics", slug: "electronics" },
  { name: "Entertainment", slug: "entertainment" },
  { name: "Family", slug: "family" },
  { name: "Free Stuff", slug: "free-stuff" },
  { name: "Garden & Outdoor", slug: "garden-outdoor" },
  { name: "Hobbies", slug: "hobbies" },
  { name: "Home Goods", slug: "home-goods" },
  { name: "Home Improvement", slug: "home-improvement" },
  { name: "Home Sales", slug: "home-sales" },
  { name: "Musical Instruments", slug: "musical-instruments" },
  { name: "Office Supplies", slug: "office-supplies" },
  { name: "Pet Supplies", slug: "pet-supplies" },
  { name: "Sporting Goods", slug: "sporting-goods" },
  { name: "Toys & Games", slug: "toys-games" },
  { name: "Buy and sell groups", slug: "buy-and-sell-groups" },
];

export function getCategoryBySlug(slug?: string | null): CategoryItem | null {
  if (!slug) return null;
  const normalized = slug.toLowerCase().trim();
  return MARKETPLACE_CATEGORIES.find((cat) => cat.slug === normalized) ?? null;
}

export function getCategoryByName(name?: string | null): CategoryItem | null {
  if (!name) return null;
  const normalized = name.toLowerCase().trim();
  return (
    MARKETPLACE_CATEGORIES.find(
      (cat) => cat.name.toLowerCase() === normalized || cat.slug === normalized
    ) ?? null
  );
}
