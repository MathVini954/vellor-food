import { notFound } from "next/navigation";
import { PublicPageShell } from "@/components/public/public-page-shell";
import { ProductDetailPageClient } from "@/components/public/product-detail-page-client";
import { requirePublicAccess } from "@/lib/public-access";
import {
  getProductDetailsByRestaurantSlug,
  getRestaurantBySlugOrThrow,
} from "@/services/public/restaurants";

export default async function RestaurantProductPage({
  params,
}: {
  params: Promise<{ slug: string; productId: string }>;
}) {
  const { slug, productId } = await params;
  await requirePublicAccess(slug);
  const [restaurant, product] = await Promise.all([
    getRestaurantBySlugOrThrow(slug),
    getProductDetailsByRestaurantSlug(slug, productId),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <PublicPageShell slug={slug}>
      <ProductDetailPageClient slug={slug} restaurant={restaurant} product={product} />
    </PublicPageShell>
  );
}
