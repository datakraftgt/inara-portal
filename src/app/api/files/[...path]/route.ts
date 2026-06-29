import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";

const ALLOWED_PREFIXES = ["compartidos/", "apartamentos/"];

/**
 * GET /api/files/[...path]
 *
 * Serves files from DigitalOcean Spaces via presigned URLs.
 * Supports two access tiers:
 *   - compartidos/  → available to any authenticated user
 *   - apartamentos/ → restricted to the file owner (ubicacion must match JWT)
 *
 * TODO: replace mock with actual DO Spaces SDK:
 *   const { S3Client, GetObjectCommand } = await import("@aws-sdk/client-s3");
 *   const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
 *   const client = new S3Client({
 *     endpoint: `https://${process.env.DO_SPACES_REGION}.digitaloceanspaces.com`,
 *     region: process.env.DO_SPACES_REGION,
 *     credentials: { accessKeyId: process.env.DO_SPACES_KEY!, secretAccessKey: process.env.DO_SPACES_SECRET! },
 *   });
 *   const cmd = new GetObjectCommand({
 *     Bucket: process.env.DO_SPACES_BUCKET,
 *     Key: filePath,
 *     ResponseContentDisposition: isDownload ? `attachment; filename="${filename}"` : "inline",
 *   });
 *   return NextResponse.redirect(await getSignedUrl(client, cmd, { expiresIn: 300 }));
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const filePath   = params.path.join("/");
  const isDownload = request.nextUrl.searchParams.get("dl") === "1";
  const filename   = params.path[params.path.length - 1] ?? "archivo.pdf";

  // ── 1. Validate prefix ───────────────────────────────────────────────────
  if (!ALLOWED_PREFIXES.some((p) => filePath.startsWith(p))) {
    return NextResponse.json({ error: "Ruta no permitida" }, { status: 403 });
  }

  // ── 2. Require authentication ────────────────────────────────────────────
  const user = await verifyAuth(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // ── 3. Verify ownership for apartment-specific files ─────────────────────
  if (filePath.startsWith("apartamentos/")) {
    // Expected shape: apartamentos/[ubicacion]/...
    const pathUbicacion = params.path[1];
    if (!pathUbicacion || pathUbicacion !== user.ubicacion) {
      return NextResponse.json(
        { error: "No tienes acceso a este archivo" },
        { status: 403 }
      );
    }
  }

  // ── 4. TODO: serve from DO Spaces ─────────────────────────────────────────
  return NextResponse.json(
    {
      error: "Almacenamiento no configurado",
      detail: `'${filePath}' se servirá desde DO Spaces cuando se configuren DO_SPACES_*.`,
      path: filePath,
      filename,
      disposition: isDownload ? "attachment" : "inline",
    },
    { status: 501 }
  );
}
