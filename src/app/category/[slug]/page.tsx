import { notFound } from "next/navigation";
import { MarketplaceBrowser } from "@/components/marketplace/marketplace-browser";
import { getCategoryBySlug } from "@/lib/categories";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  return (
    <MarketplaceBrowser
      initialCategorySlug={category.slug}
      useCategoryLinks={true}
    />
  );
}
