import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function getClient(): S3Client {
  const region    = process.env.DO_SPACES_REGION;
  const endpoint  = process.env.DO_SPACES_ENDPOINT;
  const accessKey = process.env.DO_SPACES_ACCESS_KEY;
  const secretKey = process.env.DO_SPACES_SECRET_KEY;

  if (!region || !endpoint || !accessKey || !secretKey) {
    throw new Error("Faltan variables de entorno DO_SPACES_*");
  }

  return new S3Client({
    region,
    endpoint,
    credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
    forcePathStyle: false,
  });
}

function getBucket(): string {
  const bucket = process.env.DO_SPACES_BUCKET;
  if (!bucket) throw new Error("DO_SPACES_BUCKET no está configurado");
  return bucket;
}

/**
 * Sube un archivo al Space.
 * key: ruta dentro del bucket, ej. "reclamos/CAS-000154/foto.jpg"
 * Retorna la URL pública del objeto.
 */
export async function uploadFile(
  key: string,
  body: Buffer | Uint8Array | Blob,
  contentType: string,
  acl: "private" | "public-read" = "private"
): Promise<string> {
  const client = getClient();
  const bucket = getBucket();

  await client.send(
    new PutObjectCommand({
      Bucket:      bucket,
      Key:         key,
      Body:        body,
      ContentType: contentType,
      ACL:         acl,
    })
  );

  const region = process.env.DO_SPACES_REGION!;
  return `https://${bucket}.${region}.digitaloceanspaces.com/${key}`;
}

// ─── Presigned URL cache ──────────────────────────────────────────────────────
// Shared across all requests in the same Node.js process (dev: single instance,
// prod: per worker — still effective since DO Spaces rate-limits are per-key).

const urlCache = new Map<string, { url: string; expiresAt: number }>();

// Shared docs are rarely updated → long TTL (1 hour).
// Individual apartment docs vary per resident → short TTL (10 min).
function getTtl(key: string): number {
  return key.startsWith("compartidos/") ? 3600 : 600;
}

/**
 * Genera una URL firmada de descarga.
 * Las URLs se cachean en memoria: 1 hora para compartidos/, 10 min para apartamentos/.
 * Si downloadFilename está presente, la URL incluye Content-Disposition: attachment.
 */
export async function getPresignedDownloadUrl(
  key: string,
  downloadFilename?: string
): Promise<string> {
  // Cache key differentiates view vs download URLs for the same file
  const cacheKey = `${key}::${downloadFilename ?? ""}`;
  const cached = urlCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.url;
  }

  const ttl = getTtl(key);
  const client = getClient();

  const url = await getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: getBucket(),
      Key: key,
      ...(downloadFilename && {
        ResponseContentDisposition: `attachment; filename="${downloadFilename}"`,
      }),
    }),
    { expiresIn: ttl }
  );

  urlCache.set(cacheKey, { url, expiresAt: Date.now() + ttl * 1000 });

  return url;
}

/**
 * Elimina un objeto del Space.
 */
export async function deleteFile(key: string): Promise<void> {
  const client = getClient();
  await client.send(
    new DeleteObjectCommand({ Bucket: getBucket(), Key: key })
  );
}

/**
 * Adjuntos de reclamos.
 * ej. "reclamos/CAS-000154/foto.jpg"
 */
export function reclamoKey(numeroCaso: string, filename: string): string {
  return `reclamos/${numeroCaso}/${filename}`;
}

/**
 * Planos y documentos propios de un apartamento.
 * ej. "apartamentos/TAN01A0101/planos/arquitectonico.pdf"
 */
export function documentoKey(ubicacion: string, filename: string): string {
  return `apartamentos/${ubicacion}/planos/${filename}`;
}

/**
 * Documentos compartidos entre los 197 apartamentos.
 * secciones: reglamento | manual | linea-blanca | administracion | eegsa | bienvenida
 * ej. "compartidos/reglamento/reglamento-edificio.pdf"
 */
export function compartidoKey(seccion: string, filename: string): string {
  return `compartidos/${seccion}/${filename}`;
}
