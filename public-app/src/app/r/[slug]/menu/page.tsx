import { PublicPageShell } from "@/components/public/public-page-shell";
import { MenuCategoriesPageClient } from "@/components/public/menu-categories-page-client";
import { requirePublicAccess } from "@/lib/public-access";
import {
  getCategoryPreviewsByRestaurantSlug,
  getRestaurantBySlugOrThrow,
} from "@/services/public/restaurants";

export default async function RestaurantMenuPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await requirePublicAccess(slug);
  const restaurant = await getRestaurantBySlugOrThrow(slug);
  const categories = await getCategoryPreviewsByRestaurantSlug(slug);

  return (
    <PublicPageShell slug={slug} activeTab="menu" withBottomNav>
      <MenuCategoriesPageClient slug={slug} restaurant={restaurant} categories={categories} />
    </PublicPageShell>
  );
}
