import { NextResponse } from "next/server";
import { dineInAccessCookieName, guestCookieName } from "@/lib/session";
import { getRestaurantByDigitalMenuToken } from "@/services/public/restaurants";

export async function GET(
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  const restaurant = await getRestaurantByDigitalMenuToken(token);

  if (!restaurant || !restaurant.digitalMenuEnabled) {
    return NextResponse.json(
      { error: "Cardapio digital nao encontrado." },
      { status: 404 },
    );
  }

  const response = NextResponse.redirect(new URL(`/r/${restaurant.slug}/menu`, request.url));
  response.cookies.set(dineInAccessCookieName(restaurant.slug), "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  response.cookies.set(guestCookieName(restaurant.slug), "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  return response;
}
