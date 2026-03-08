import { geocodeAddress } from "@/lib/geocoding";

export type DeliveryCalculationInput = {
  restaurant: {
    address: string | null;
    city: string | null;
    state: string | null;
    latitude: number | null;
    longitude: number | null;
    deliveryFee: number;
    freeDeliveryRadiusKm: number;
  };
  customerAddress: string;
  customerNeighborhood: string;
};

export type DeliveryCalculationResult = {
  distanceKm: number;
  deliveryFee: number;
  qualifiesForFreeDelivery: boolean;
};

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function haversineDistanceKm(
  left: { latitude: number; longitude: number },
  right: { latitude: number; longitude: number },
) {
  const earthRadiusKm = 6371;
  const deltaLat = toRadians(right.latitude - left.latitude);
  const deltaLon = toRadians(right.longitude - left.longitude);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(left.latitude)) *
      Math.cos(toRadians(right.latitude)) *
      Math.sin(deltaLon / 2) ** 2;

  return earthRadiusKm * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export async function calculateDeliveryQuote(
  input: DeliveryCalculationInput,
): Promise<DeliveryCalculationResult> {
  const { restaurant, customerAddress, customerNeighborhood } = input;

  let restaurantPoint =
    restaurant.latitude != null && restaurant.longitude != null
      ? {
          latitude: restaurant.latitude,
          longitude: restaurant.longitude,
        }
      : null;

  if (!restaurantPoint) {
    restaurantPoint = await geocodeAddress([
      restaurant.address,
      restaurant.city,
      restaurant.state,
      "Brasil",
    ]);
  }

  if (!restaurantPoint) {
    throw new Error("Nao foi possivel localizar o endereco do restaurante para calcular a entrega.");
  }

  const customerPoint = await geocodeAddress([
    customerAddress,
    customerNeighborhood,
    restaurant.city,
    restaurant.state,
    "Brasil",
  ]);

  if (!customerPoint) {
    throw new Error("Nao foi possivel localizar o endereco informado para calcular a entrega.");
  }

  const distanceKm = haversineDistanceKm(
    restaurantPoint,
    customerPoint,
  );

  const roundedDistanceKm = Number(distanceKm.toFixed(2));
  const qualifiesForFreeDelivery =
    restaurant.freeDeliveryRadiusKm > 0 && roundedDistanceKm <= restaurant.freeDeliveryRadiusKm;

  return {
    distanceKm: roundedDistanceKm,
    deliveryFee: qualifiesForFreeDelivery ? 0 : restaurant.deliveryFee,
    qualifiesForFreeDelivery,
  };
}
