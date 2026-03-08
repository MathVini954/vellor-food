import { NextResponse } from "next/server";
import { lookupZipCode } from "@/lib/geocoding";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      zipCode?: string;
    };

    const address = await lookupZipCode(String(body.zipCode ?? ""));

    if (!address) {
      return NextResponse.json(
        { error: "Nao foi possivel localizar esse CEP." },
        { status: 400 },
      );
    }

    return NextResponse.json(address);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Nao foi possivel localizar esse CEP.",
      },
      { status: 500 },
    );
  }
}
