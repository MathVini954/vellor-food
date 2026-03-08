const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org/search";
const NOMINATIM_REVERSE_BASE_URL = "https://nominatim.openstreetmap.org/reverse";

export type GeocodedPoint = {
  latitude: number;
  longitude: number;
  displayName: string;
};

export type ReverseGeocodedAddress = {
  zipCode: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  formattedAddress: string;
};

export type ZipCodeLookupAddress = {
  zipCode: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  formattedAddress: string;
};

function buildSearchText(parts: Array<string | null | undefined>) {
  return parts
    .map((part) => String(part ?? "").trim())
    .filter(Boolean)
    .join(", ");
}

function normalizeGeocodePart(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s,.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildQueryVariants(parts: Array<string | null | undefined>) {
  const cleanedParts = parts
    .map((part) => String(part ?? "").trim())
    .filter(Boolean);

  const normalizedParts = cleanedParts.map(normalizeGeocodePart).filter(Boolean);
  const variants = [
    buildSearchText(cleanedParts),
    buildSearchText(normalizedParts),
    buildSearchText(normalizedParts.slice(0, 1).concat(normalizedParts.slice(-3))),
    buildSearchText(normalizedParts.slice(-3)),
  ].filter(Boolean);

  return [...new Set(variants)];
}

function normalizeZipCode(zipCode: string) {
  return String(zipCode).replace(/\D/g, "").slice(0, 8);
}

function formatZipCode(zipCode: string) {
  const normalized = normalizeZipCode(zipCode);

  if (normalized.length <= 5) {
    return normalized;
  }

  return `${normalized.slice(0, 5)}-${normalized.slice(5)}`;
}

export async function geocodeAddress(
  parts: Array<string | null | undefined>,
): Promise<GeocodedPoint | null> {
  const queries = buildQueryVariants(parts);

  if (!queries.length) {
    return null;
  }

  for (const query of queries) {
    const url = new URL(NOMINATIM_BASE_URL);
    url.searchParams.set("q", query);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("limit", "1");
    url.searchParams.set("countrycodes", "br");

    const response = await fetch(url.toString(), {
      headers: {
        "Accept-Language": "pt-BR",
        "User-Agent": "MesaPilot/1.0 (delivery-app)",
      },
      next: { revalidate: 60 * 60 * 24 },
    });

    if (!response.ok) {
      continue;
    }

    const payload = (await response.json()) as Array<{
      lat?: string;
      lon?: string;
      display_name?: string;
    }>;

    const first = payload[0];

    if (!first?.lat || !first?.lon) {
      continue;
    }

    const latitude = Number(first.lat);
    const longitude = Number(first.lon);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      continue;
    }

    return {
      latitude,
      longitude,
      displayName: first.display_name ?? query,
    };
  }

  return null;
}

export async function reverseGeocodeCoordinates(
  latitude: number,
  longitude: number,
): Promise<ReverseGeocodedAddress | null> {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  const url = new URL(NOMINATIM_REVERSE_BASE_URL);
  url.searchParams.set("lat", String(latitude));
  url.searchParams.set("lon", String(longitude));
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");

  const response = await fetch(url.toString(), {
    headers: {
      "Accept-Language": "pt-BR",
      "User-Agent": "MesaPilot/1.0 (delivery-app)",
    },
    next: { revalidate: 60 * 60 * 24 },
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    display_name?: string;
    address?: {
      postcode?: string;
      road?: string;
      pedestrian?: string;
      house_number?: string;
      suburb?: string;
      quarter?: string;
      neighbourhood?: string;
      city_district?: string;
      city?: string;
      town?: string;
      village?: string;
      state?: string;
    };
  };

  const address = payload.address;

  if (!address) {
    return null;
  }

  return {
    zipCode: address.postcode?.trim() ?? "",
    street: address.road?.trim() || address.pedestrian?.trim() || "",
    number: address.house_number?.trim() ?? "",
    neighborhood:
      address.suburb?.trim() ||
      address.quarter?.trim() ||
      address.neighbourhood?.trim() ||
      address.city_district?.trim() ||
      "",
    city: address.city?.trim() || address.town?.trim() || address.village?.trim() || "",
    state: address.state?.trim() ?? "",
    formattedAddress: payload.display_name?.trim() ?? "",
  };
}

export async function lookupZipCode(zipCode: string): Promise<ZipCodeLookupAddress | null> {
  const normalized = normalizeZipCode(zipCode);

  if (normalized.length !== 8) {
    return null;
  }

  const response = await fetch(`https://viacep.com.br/ws/${normalized}/json/`, {
    next: { revalidate: 60 * 60 * 24 },
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    erro?: boolean;
    cep?: string;
    logradouro?: string;
    bairro?: string;
    localidade?: string;
    uf?: string;
  };

  if (payload.erro) {
    return null;
  }

  const formattedZipCode = formatZipCode(payload.cep ?? normalized);
  const street = payload.logradouro?.trim() ?? "";
  const neighborhood = payload.bairro?.trim() ?? "";
  const city = payload.localidade?.trim() ?? "";
  const state = payload.uf?.trim() ?? "";

  return {
    zipCode: formattedZipCode,
    street,
    neighborhood,
    city,
    state,
    formattedAddress: [
      street,
      neighborhood,
      [city, state].filter(Boolean).join(" - "),
      formattedZipCode ? `CEP ${formattedZipCode}` : "",
    ]
      .filter(Boolean)
      .join(", "),
  };
}
