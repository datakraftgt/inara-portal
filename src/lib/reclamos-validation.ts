// Reglas de validación de adjuntos de reclamos, compartidas entre
// /api/reclamos/upload-url (presign) y /api/reclamos (creación del caso).

export const MAX_FILES = 5;
export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

export const ALLOWED_EXTENSIONS = new Set([
  "pdf", "docx", "xlsx",
  "png", "jpg", "jpeg",
  "txt",
  "mp4", "mov", "avi", "wmv", "mkv", "webm",
]);

// MIME types allowed per extension — extension alone can be spoofed
export const ALLOWED_MIMES: Record<string, string[]> = {
  pdf:  ["application/pdf"],
  docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  xlsx: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  png:  ["image/png"],
  jpg:  ["image/jpeg"],
  jpeg: ["image/jpeg"],
  txt:  ["text/plain"],
  mp4:  ["video/mp4"],
  mov:  ["video/quicktime"],
  avi:  ["video/x-msvideo", "video/avi"],
  wmv:  ["video/x-ms-wmv"],
  mkv:  ["video/x-matroska"],
  webm: ["video/webm"],
};

export function getExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

/** Elimina separadores de ruta para que el nombre no escape el prefijo del key. */
export function sanitizeFilename(name: string): string {
  return name.split(/[\\/]/).pop() ?? "";
}

/** Retorna un mensaje de error, o null si el archivo es válido. */
export function validarArchivo(name: string, type: string, size: number): string | null {
  if (size > MAX_FILE_SIZE) {
    return `El archivo "${name}" supera el límite de 100 MB`;
  }
  const ext = getExtension(name);
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return `El formato del archivo "${name}" no está permitido`;
  }
  const mime = type.toLowerCase().split(";")[0].trim();
  if (!ALLOWED_MIMES[ext]?.includes(mime)) {
    return `El tipo del archivo "${name}" no coincide con su extensión`;
  }
  return null;
}
