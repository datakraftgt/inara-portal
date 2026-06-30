import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let _client: S3Client | null = null;

function getClient(): S3Client {
  if (_client) return _client;

  const region    = process.env.DO_SPACES_REGION;
  const endpoint  = process.env.DO_SPACES_ENDPOINT;
  const accessKey = process.env.DO_SPACES_ACCESS_KEY;
  const secretKey = process.env.DO_SPACES_SECRET_KEY;

  if (!region || !endpoint || !accessKey || !secretKey) {
    throw new Error("Faltan variables de entorno DO_SPACES_*");
  }

  _client = new S3Client({
    region,
    endpoint: endpoint.replace(/\/$/, ""),
    credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
    forcePathStyle: false,
    // DO Spaces does not support x-amz-checksum-mode; disable automatic checksum
    // to prevent the SDK from appending x-amz-checksum-mode=ENABLED to GetObject URLs.
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });

  return _client;
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
 * Builds the ResponseContentDisposition value using RFC 5987 encoding.
 * Avoids literal `"` characters in the URL — the AWS SDK does not percent-encode
 * them, which causes Chrome to re-encode them on navigation and invalidates the
 * SigV4 signature on the DigitalOcean Spaces side.
 */
function buildContentDisposition(filename: string): string {
  // RFC 5987: filename*=UTF-8''<percent-encoded>
  // - No `"` in the value → no Chrome re-encoding issue
  // - Works for ASCII and non-ASCII filenames
  const encoded = encodeURIComponent(filename).replace(/'/g, "%27");
  return `attachment; filename*=UTF-8''${encoded}`;
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

  const contentDisposition = downloadFilename
    ? buildContentDisposition(downloadFilename)
    : undefined;

  const url = await getSignedUrl(
    getClient(),
    new GetObjectCommand({
      Bucket: getBucket(),
      Key: key,
      ...(contentDisposition && { ResponseContentDisposition: contentDisposition }),
    }),
    { expiresIn: ttl }
  );

  urlCache.set(cacheKey, { url, expiresAt: Date.now() + ttl * 1000 });

  return url;
}

// ─── File listing ─────────────────────────────────────────────────────────────

export type StorageFile = {
  key: string;
  filename: string;
  size: number;
  lastModified: Date;
};

/**
 * Lista todos los objetos bajo un prefijo. Pagina automáticamente si hay >1000.
 * Omite entradas que terminen en "/" (carpetas virtuales).
 */
export async function listFiles(prefix: string): Promise<StorageFile[]> {
  const c = getClient();
  const bucket = getBucket();
  const results: StorageFile[] = [];
  let token: string | undefined;

  do {
    const cmd = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
      ContinuationToken: token,
    });
    const res = await c.send(cmd);

    for (const obj of res.Contents ?? []) {
      if (!obj.Key || obj.Key.endsWith("/")) continue;
      results.push({
        key: obj.Key,
        filename: obj.Key.split("/").pop()!,
        size: obj.Size ?? 0,
        lastModified: obj.LastModified ?? new Date(),
      });
    }

    token = res.NextContinuationToken;
  } while (token);

  return results;
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
 * ej. "compartidos/reglamento/reglamento-edificio.pdf"
 */
export function compartidoKey(seccion: string, filename: string): string {
  return `compartidos/${seccion}/${filename}`;
}

/**
 * Archivo individual de un tipo de plano (estructura multi-archivo).
 * ej. "apartamentos/TAN01A0101/planos/arquitectonico/plano-v1.pdf"
 */
export function planoKey(ubicacion: string, tipoPlano: string, filename: string): string {
  return `apartamentos/${ubicacion}/planos/${tipoPlano}/${filename}`;
}
