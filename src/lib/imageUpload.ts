export const MAX_IMAGE_UPLOAD_BYTES = 1024 * 1024;
export const MAX_IMAGE_UPLOAD_LABEL = "1 MB";

type ReadImageFileAsDataUrlOptions = {
  maxBytes?: number;
};

export async function readImageFileAsDataUrl(
  file: File,
  options: ReadImageFileAsDataUrlOptions = {},
) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Selecione um arquivo de imagem valido.");
  }

  if (options.maxBytes && file.size > options.maxBytes) {
    throw new Error(`Selecione uma imagem de ate ${formatBytes(options.maxBytes)}.`);
  }

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Nao foi possivel ler o arquivo selecionado."));
    reader.readAsDataURL(file);
  });
}

function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024 && bytes % (1024 * 1024) === 0) {
    return `${bytes / (1024 * 1024)} MB`;
  }

  if (bytes >= 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${bytes} B`;
}
