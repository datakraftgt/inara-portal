import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { uploadFile, compartidoKey, documentoKey } from "@/lib/storage";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

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
  if (archivo.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "El archivo supera el límite de 100 MB" }, { status: 400 });
  }

  let key: string;

  if (tipo === "compartido") {
    const seccion = (formData.get("seccion") as string | null) ?? "";
    if (!seccion) {
      return NextResponse.json({ error: "Se requiere 'seccion' para documentos compartidos" }, { status: 400 });
    }
    key = compartidoKey(seccion, archivo.name);
  } else {
    const ubicacion  = (formData.get("ubicacion")  as string | null) ?? "";
    const tipoPlano  = (formData.get("tipoPlano")  as string | null) ?? "";
    if (!ubicacion || !tipoPlano) {
      return NextResponse.json(
        { error: "Se requieren 'ubicacion' y 'tipoPlano' para documentos individuales" },
        { status: 400 }
      );
    }
    // Incluye el tipoPlano como subcarpeta dentro del nombre del archivo
    // ej. documentoKey('TAN01A0101', 'arquitectonico/plano.pdf')
    const filenameConTipo = tipoPlano.includes("/") ? archivo.name : `${tipoPlano}/${archivo.name}`;
    key = documentoKey(ubicacion, filenameConTipo);
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
