import { NextResponse } from "next/server";
import { calculateDeliveryQuote } from "@/lib/delivery";
import { getRestaurantBySlugOrThrow } from "@/services/public/restaurants";

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params;
    const restaurant = await getRestaurantBySlugOrThrow(slug);
    const body = (await request.json()) as {
      customerAddress?: string;
      customerNeighborhood?: string;
    };

    const customerAddress = String(body.customerAddress ?? "").trim();
    const customerNeighborhood = String(body.customerNeighborhood ?? "").trim();

    if (!customerAddress || !customerNeighborhood) {
      return NextResponse.json(
        { error: "Endereco e localidade sao obrigatorios para calcular a entrega." },
        { status: 400 },
      );
    }

    const quote = await calculateDeliveryQuote({
      restaurant: {
        address: restaurant.address,
        city: restaurant.city,
        state: restaurant.state,
        latitude: restaurant.latitude,
        longitude: restaurant.longitude,
        deliveryFee: restaurant.deliveryFee,
        freeDeliveryRadiusKm: restaurant.freeDeliveryRadiusKm,
      },
      customerAddress,
      customerNeighborhood,
    });

    return NextResponse.json(quote);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Nao foi possivel calcular a entrega para este endereco.",
      },
      { status: 400 },
    );
  }
}
