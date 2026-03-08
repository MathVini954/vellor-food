import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { slugifyPhone } from "@/lib/format";
import { customerCookieName, guestCookieName } from "@/lib/session";
import { identifyCustomerSchema } from "@/lib/validation";
import { getRestaurantBySlugOrThrow } from "@/services/public/restaurants";

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params;
    const restaurant = await getRestaurantBySlugOrThrow(slug);
    const body = await request.json();
    const parsed = identifyCustomerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dados invalidos." },
        { status: 400 },
      );
    }

    const normalizedPhone = slugifyPhone(parsed.data.phone);

    const customer = await prisma.customer.upsert({
      where: {
        restaurantId_phone: {
          restaurantId: restaurant.id,
          phone: normalizedPhone,
        },
      },
      update: {
        name: parsed.data.name,
      },
      create: {
        restaurantId: restaurant.id,
        name: parsed.data.name,
        phone: normalizedPhone,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        address: true,
        neighborhood: true,
        isBlocked: true,
      },
    });

    if (customer.isBlocked) {
      return NextResponse.json(
        { error: "Este cliente esta bloqueado para novos pedidos neste restaurante." },
        { status: 403 },
      );
    }

    const response = NextResponse.json({ customer });
    response.cookies.set(customerCookieName(slug), customer.id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    response.cookies.delete(guestCookieName(slug));

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Nao foi possivel identificar o cliente.",
      },
      { status: 500 },
    );
  }
}
