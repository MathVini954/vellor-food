export function getDevOwnerAccessToken() {
  return process.env.DEV_OWNER_ACCESS_TOKEN?.trim() ?? "";
}

export function isValidDevOwnerToken(token: string | null | undefined) {
  const expectedToken = getDevOwnerAccessToken();
  return Boolean(expectedToken && token && token === expectedToken);
}

export function assertDevOwnerToken(token: string | null | undefined) {
  if (!isValidDevOwnerToken(token)) {
    throw new Error("Acesso dev-owner invalido.");
  }
}

