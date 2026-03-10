export const MAX_ADMIN_INLINE_IMAGE_BYTES = 1024 * 1024;
export const MAX_ADMIN_INLINE_IMAGE_LABEL = "1 MB";

export function assertInlineAdminImageWithinLimit(value: string, fieldLabel: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue.startsWith("data:image/")) {
    return;
  }

  const base64Marker = ";base64,";
  const markerIndex = trimmedValue.indexOf(base64Marker);

  if (markerIndex === -1) {
    throw new Error(`${fieldLabel} precisa estar em um formato de imagem valido.`);
  }

  const base64Payload = trimmedValue.slice(markerIndex + base64Marker.length).replace(/\s/g, "");
  const byteLength = Buffer.from(base64Payload, "base64").byteLength;

  if (!Number.isFinite(byteLength) || byteLength <= 0) {
    throw new Error(`${fieldLabel} precisa estar em um formato de imagem valido.`);
  }

  if (byteLength > MAX_ADMIN_INLINE_IMAGE_BYTES) {
    throw new Error(`${fieldLabel} deve ter no maximo ${MAX_ADMIN_INLINE_IMAGE_LABEL}.`);
  }
}
