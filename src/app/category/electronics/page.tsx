import { MarketplaceBrowser } from "@/components/marketplace/marketplace-browser";

export default function ElectronicsCategoryPage() {
  return (
    <MarketplaceBrowser
      initialCategorySlug="electronics"
      useCategoryLinks={true}
    />
  );
}
