import { requireAdminAccess } from "@/lib/admin-auth";
import { adminJson, adminOptions } from "@/lib/admin-response";
import { prisma } from "@/lib/prisma";

type IbgeCity = {
  id: number;
  nome: string;
};

type IbgeNamed = {
  nome: string;
};

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export function OPTIONS(request: Request) {
  return adminOptions(request);
}

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params;
    const auth = requireAdminAccess(request, { restaurantSlug: slug });

    if (!auth.ok) {
      return auth.response;
    }

    const { searchParams } = new URL(request.url);
    const city = String(searchParams.get("city") ?? "").trim();
    const state = String(searchParams.get("state") ?? "").trim().toUpperCase();

    if (!city || !state) {
      return adminJson(request, { error: "Informe cidade e UF para importar os bairros." }, { status: 400 });
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!restaurant) {
      return adminJson(request, { error: "Restaurante nao encontrado." }, { status: 404 });
    }

    const citiesResponse = await fetch(
      `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${state}/municipios`,
      { cache: "no-store" },
    );

    if (!citiesResponse.ok) {
      return adminJson(request, { error: "Nao foi possivel consultar a cidade informada." }, { status: 502 });
    }

    const cities = (await citiesResponse.json()) as IbgeCity[];
    const cityMatch = cities.find((item) => normalizeText(item.nome) === normalizeText(city));

    if (!cityMatch) {
      return adminJson(request, { error: "Cidade nao encontrada para a UF informada." }, { status: 404 });
    }

    const subdistrictsResponse = await fetch(
      `https://servicodados.ibge.gov.br/api/v1/localidades/municipios/${cityMatch.id}/subdistritos`,
      { cache: "no-store" },
    );
    const districtsResponse = await fetch(
      `https://servicodados.ibge.gov.br/api/v1/localidades/municipios/${cityMatch.id}/distritos`,
      { cache: "no-store" },
    );

    const neighborhoods = new Set<string>();

    if (subdistrictsResponse.ok) {
      const subdistricts = (await subdistrictsResponse.json()) as IbgeNamed[];
      subdistricts.forEach((item) => {
        if (item.nome?.trim()) {
          neighborhoods.add(item.nome.trim());
        }
      });
    }

    if (!neighborhoods.size && districtsResponse.ok) {
      const districts = (await districtsResponse.json()) as IbgeNamed[];
      districts.forEach((item) => {
        if (item.nome?.trim()) {
          neighborhoods.add(item.nome.trim());
        }
      });
    }

    return adminJson(request, {
      neighborhoods: [...neighborhoods].sort((left, right) => left.localeCompare(right, "pt-BR")),
    });
  } catch (error) {
    return adminJson(request, 
      {
        error:
          error instanceof Error ? error.message : "Nao foi possivel importar os bairros da cidade.",
      },
      { status: 500 },
    );
  }
}
