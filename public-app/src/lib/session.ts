export function customerCookieName(slug: string) {
  return `rf_customer_${slug}`;
}

export function guestCookieName(slug: string) {
  return `rf_guest_${slug}`;
}

export function customerStorageKey(slug: string) {
  return `restaurant-public-customer:${slug}`;
}

export function cartStorageKey(slug: string) {
  return `restaurant-public-cart:${slug}`;
}

export function guestStorageKey(slug: string) {
  return `restaurant-public-guest:${slug}`;
}

export function favoritesStorageKey(slug: string) {
  return `restaurant-public-favorites:${slug}`;
}
