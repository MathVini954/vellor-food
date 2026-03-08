import { NextResponse } from "next/server";
import { reverseGeocodeCoordinates } from "@/lib/geocoding";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      latitude?: number;
      longitude?: number;
    };

    const latitude = Number(body.latitude);
    const longitude = Number(body.longitude);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return NextResponse.json(
        { error: "Coordenadas invalidas para localizar o endereco." },
        { status: 400 },
      );
    }

    const address = await reverseGeocodeCoordinates(latitude, longitude);

    if (!address) {
      return NextResponse.json(
        { error: "Nao foi possivel localizar esse ponto no mapa." },
        { status: 400 },
      );
    }

    return NextResponse.json(address);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Nao foi possivel localizar esse ponto.",
      },
      { status: 500 },
    );
  }
}
