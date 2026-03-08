import { NextResponse } from "next/server";
import { guestCookieName } from "@/lib/session";
import { getRestaurantBySlugOrThrow } from "@/services/public/restaurants";

export async function POST(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params;
    await getRestaurantBySlugOrThrow(slug);

    const response = NextResponse.json({ ok: true });
    response.cookies.set(guestCookieName(slug), "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Nao foi possivel liberar acesso ao cardapio.",
      },
      { status: 500 },
    );
  }
}
