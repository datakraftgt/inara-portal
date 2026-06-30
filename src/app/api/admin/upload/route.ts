import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { uploadFile, compartidoKey, planoKey } from "@/lib/storage";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

// Extension → allowed MIME types
const ALLOWED_TYPES: Record<string, string[]> = {
  ".pdf":  ["application/pdf"],
  ".docx": ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  ".xlsx": ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  ".jpg":  ["image/jpeg"],
  ".jpeg": ["image/jpeg"],
  ".png":  ["image/png"],
};

function validateAdminFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) {
    return "El archivo excede el límite de 50 MB.";
  }
  const ext = `.${file.name.split(".").pop()?.toLowerCase() ?? ""}`;
  const allowedMimes = ALLOWED_TYPES[ext];
  if (!allowedMimes) {
    return "Tipo de archivo no permitido. Solo se aceptan PDF, DOCX, XLSX, JPG y PNG.";
  }
  const mime = file.type.toLowerCase().split(";")[0].trim();
  if (!allowedMimes.includes(mime)) {
    return "Tipo de archivo no permitido. Solo se aceptan PDF, DOCX, XLSX, JPG y PNG.";
  }
  return null;
}

export async function POST(request: NextRequest) {
  const session = await verifySession(request);
  if (!session || session.rol !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "FormData inválido" }, { status: 400 });
  }

  const archivo   = formData.get("archivo") as File | null;
  const tipo      = formData.get("tipo") as "compartido" | "individual" | null;

  if (!archivo) {
    return NextResponse.json({ error: "Se requiere un archivo" }, { status: 400 });
  }
  if (tipo !== "compartido" && tipo !== "individual") {
    return NextResponse.json({ error: "El campo 'tipo' debe ser 'compartido' o 'individual'" }, { status: 400 });
  }

  const validationError = validateAdminFile(archivo);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  let key: string;

  if (tipo === "compartido") {
    const seccion  = (formData.get("seccion")   as string | null) ?? "";
    // filename: canonical name from admin panel; fallback to archivo.name
    const filename = (formData.get("filename")  as string | null) || archivo.name;
    if (!seccion) {
      return NextResponse.json({ error: "Se requiere 'seccion' para documentos compartidos" }, { status: 400 });
    }
    key = compartidoKey(seccion, filename);
  } else {
    const ubicacion = (formData.get("ubicacion") as string | null) ?? "";
    // tipoPlano is now a folder name (e.g. "arquitectonico"), not a canonical filename
    const tipoPlano = (formData.get("tipoPlano") as string | null) ?? "";
    if (!ubicacion || !tipoPlano) {
      return NextResponse.json(
        { error: "Se requieren 'ubicacion' y 'tipoPlano' para documentos individuales" },
        { status: 400 }
      );
    }
    key = planoKey(ubicacion, tipoPlano, archivo.name);
  }

  try {
    const buffer = Buffer.from(await archivo.arrayBuffer());
    const url    = await uploadFile(key, buffer, archivo.type || "application/octet-stream");
    return NextResponse.json({ success: true, key, url });
  } catch (err) {
    console.error("Error subiendo archivo al Space:", err);
    return NextResponse.json({ error: "Error al subir el archivo" }, { status: 500 });
  }
}
