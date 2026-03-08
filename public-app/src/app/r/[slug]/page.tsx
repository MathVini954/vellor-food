import { HomePageClient } from "@/components/public/home-page-client";
import { PublicPageShell } from "@/components/public/public-page-shell";
import { requirePublicAccess } from "@/lib/public-access";
import {
  getRestaurantDiscoveryBySlug,
  getMenuByRestaurantSlug,
  getRestaurantBySlugOrThrow,
} from "@/services/public/restaurants";

export default async function RestaurantPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await requirePublicAccess(slug);
  const [restaurant, categories, discovery] = await Promise.all([
    getRestaurantBySlugOrThrow(slug),
    getMenuByRestaurantSlug(slug),
    getRestaurantDiscoveryBySlug(slug),
  ]);

  return (
    <PublicPageShell slug={slug} activeTab="home" withBottomNav>
      <HomePageClient
        slug={slug}
        restaurant={restaurant}
        discovery={discovery}
        categories={categories}
      />
    </PublicPageShell>
  );
}
