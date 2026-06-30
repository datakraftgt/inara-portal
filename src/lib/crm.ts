export type CasoParams = {
  titulo: string;
  observaciones: string;
  proyecto: string;
  ubicacion: string;
  medioDelReclamo: number;
  archivos: File[];
};

export type CasoData = {
  id: string | number;
  numeroCaso: string;
};

export type CasoResponse = {
  success: boolean;
  message?: string;
  data?: CasoData;
  errors?: string[];
};

export async function crearCaso(params: CasoParams): Promise<CasoResponse> {
  const crmApiUrl = process.env.CRM_API_URL;
  if (!crmApiUrl) {
    throw new Error("CRM_API_URL no está configurado");
  }

  const body = new FormData();
  body.append("titulo", params.titulo);
  body.append("observaciones", params.observaciones);
  body.append("proyecto", params.proyecto);
  body.append("ubicacion", params.ubicacion);
  body.append("medioDelReclamo", String(params.medioDelReclamo));

  for (const archivo of params.archivos) {
    body.append("archivos", archivo, archivo.name);
  }

  const response = await fetch(`${crmApiUrl}/caso/crearcaso`, {
    method: "POST",
    body,
  });

  let json: Record<string, unknown>;
  try {
    json = await response.json();
  } catch {
    throw new Error(`Respuesta no-JSON del CRM (HTTP ${response.status})`);
  }

  if (json.success === true) {
    const raw = json.data as Record<string, unknown> | undefined;
    return {
      success: true,
      message: json.message as string | undefined,
      data: raw
        ? { id: raw.id as string | number, numeroCaso: raw.numeroCaso as string }
        : { id: json.id as string | number, numeroCaso: json.numeroCaso as string },
      errors: json.errors as string[] | undefined,
    };
  }

  return {
    success: false,
    message:
      (json.mensaje as string | undefined) ??
      (json.message as string | undefined) ??
      "Error al crear el reclamo",
    errors: json.errors as string[] | undefined,
  };
}
