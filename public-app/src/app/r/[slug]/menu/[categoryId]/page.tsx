import { notFound } from "next/navigation";
import { PublicPageShell } from "@/components/public/public-page-shell";
import { CategoryProductsPageClient } from "@/components/public/category-products-page-client";
import { requirePublicAccess } from "@/lib/public-access";
import {
  getCategoryPageByRestaurantSlug,
  getCategoryPreviewsByRestaurantSlug,
  getRestaurantBySlugOrThrow,
} from "@/services/public/restaurants";

export default async function RestaurantCategoryPage({
  params,
}: {
  params: Promise<{ slug: string; categoryId: string }>;
}) {
  const { slug, categoryId } = await params;
  await requirePublicAccess(slug);
  const [restaurant, categories, category] = await Promise.all([
    getRestaurantBySlugOrThrow(slug),
    getCategoryPreviewsByRestaurantSlug(slug),
    getCategoryPageByRestaurantSlug(slug, categoryId),
  ]);

  if (!category) {
    notFound();
  }

  return (
    <PublicPageShell slug={slug} activeTab="menu" withBottomNav>
      <CategoryProductsPageClient
        slug={slug}
        restaurant={restaurant}
        category={category}
        categories={categories}
      />
    </PublicPageShell>
  );
}
