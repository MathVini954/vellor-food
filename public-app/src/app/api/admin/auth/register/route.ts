import { attachAdminSessionCookie, createAdminAccessToken } from "@/lib/admin-auth";
import { Prisma } from "@prisma/client";
import { adminJson, adminOptions } from "@/lib/admin-response";
import { geocodeAddress } from "@/lib/geocoding";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { consumeRateLimit, getRequestClientKey } from "@/lib/rate-limit";
import { mapRestaurantSession } from "@/services/admin/restaurant-admin";

function slugifyRestaurantName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

async function generateUniqueRestaurantSlug(name: string) {
  const baseSlug = slugifyRestaurantName(name) || "restaurante";
  let candidate = baseSlug;
  let suffix = 2;

  while (await prisma.restaurant.findUnique({ where: { slug: candidate }, select: { id: true } })) {
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

export function OPTIONS(request: Request) {
  return adminOptions(request);
}

export async function POST(request: Request) {
  try {
    if (process.env.ALLOW_PUBLIC_RESTAURANT_SIGNUP !== "true") {
      return adminJson(request, 
        { error: "Cadastro publico de restaurante desabilitado. Use o painel do dono da plataforma." },
        { status: 403 },
      );
    }

    const clientKey = getRequestClientKey(request);
    const allowed = consumeRateLimit({
      key: `admin-register:${clientKey}`,
      limit: 5,
      windowMs: 10 * 60 * 1000,
    });

    if (!allowed) {
      return adminJson(request, { error: "Muitas tentativas de cadastro. Tente novamente em alguns minutos." }, { status: 429 });
    }

    const body = await request.json();
    const restaurantName = String(body.restaurantName ?? "").trim();
    const whatsapp = String(body.whatsapp ?? "").trim();
    const adminName = String(body.adminName ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const address = String(body.address ?? "").trim();
    const city = String(body.city ?? "").trim();
    const state = String(body.state ?? "").trim().toUpperCase();

    if (!restaurantName || !whatsapp || !adminName || !email || !password || !address || !city || !state) {
      return adminJson(request, { error: "Preencha todos os campos obrigatorios." }, { status: 400 });
    }

    const existingEmail = await prisma.restaurant.findFirst({
      where: { adminEmail: email },
      select: { id: true },
    });

    if (existingEmail) {
      return adminJson(request, { error: "Ja existe um restaurante com esse e-mail." }, { status: 409 });
    }

    const slug = await generateUniqueRestaurantSlug(restaurantName);
    const geocodedPoint = await geocodeAddress([address, city, state, "Brasil"]);
    const passwordHash = await hashPassword(password);

    const restaurant = await prisma.restaurant.create({
      data: {
        name: restaurantName,
        slug,
        whatsapp,
        adminEmail: email,
        adminPassword: passwordHash,
        adminPasswordTemporary: false,
        adminUserName: adminName,
        onboardingCompleted: true,
        address,
        city,
        state,
        latitude: geocodedPoint ? new Prisma.Decimal(geocodedPoint.latitude) : null,
        longitude: geocodedPoint ? new Prisma.Decimal(geocodedPoint.longitude) : null,
        primaryColor: "#0f172a",
        secondaryColor: "#f97316",
        welcomeMessage: `Bem-vindo ao ${restaurantName}.`,
        deliveryFee: new Prisma.Decimal(0),
        freeDeliveryRadiusKm: new Prisma.Decimal(0),
        minimumOrderValue: new Prisma.Decimal(0),
        isOpen: true,
        deliveryActive: true,
        pickupActive: true,
        acceptCash: true,
        acceptPix: true,
        acceptCardOnDelivery: true,
      },
      select: {
        slug: true,
        name: true,
        adminUserName: true,
        adminEmail: true,
      },
    });

    const accessToken = createAdminAccessToken({
      restaurantSlug: restaurant.slug,
      userEmail: restaurant.adminEmail ?? email,
    });

    return attachAdminSessionCookie(adminJson({
      kind: "session",
      session: mapRestaurantSession(restaurant),
    }), accessToken);
  } catch (error) {
    return adminJson(request, 
      { error: error instanceof Error ? error.message : "Nao foi possivel criar o restaurante." },
      { status: 500 },
    );
  }
}
