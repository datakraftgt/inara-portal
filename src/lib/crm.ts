import { CRM_CONFIG } from "./crm-config";

export type CasoParams = {
  titulo:        string;
  observaciones: string;
  ubicacion:     string; // ubicacion_crm del apartamento (leído desde DB)
  archivos:      File[];
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
  body.append("titulo",          params.titulo);
  body.append("observaciones",   params.observaciones);
  body.append("proyecto",        CRM_CONFIG.proyecto);
  body.append("ubicacion",       params.ubicacion);
  body.append("medioDelReclamo", String(CRM_CONFIG.medioDelReclamo));

  for (const archivo of params.archivos) {
    body.append("archivos", archivo, archivo.name);
  }

  console.log("[CRM] POST", `${crmApiUrl}/caso/crearcaso`);
  console.log("[CRM] Fields →", {
    titulo:          params.titulo,
    observaciones:   params.observaciones,
    proyecto:        CRM_CONFIG.proyecto,
    ubicacion:       params.ubicacion,
    medioDelReclamo: CRM_CONFIG.medioDelReclamo,
    archivos:        params.archivos.map(f => `${f.name} (${f.size}b)`),
  });

  const response = await fetch(`${crmApiUrl}/caso/crearcaso`, {
    method: "POST",
    body,
  });

  console.log("[CRM] HTTP status:", response.status);

  let json: Record<string, unknown>;
  try {
    json = await response.json();
  } catch {
    throw new Error(`Respuesta no-JSON del CRM (HTTP ${response.status})`);
  }

  console.log("[CRM] Response body:", JSON.stringify(json, null, 2));

  // COMOSA responde con PascalCase (Success, Message, Errors) pero también
  // admitimos lowercase por si cambian la versión del API.
  const isSuccess = (json.Success ?? json.success) === true;

  if (isSuccess) {
    const raw = (json.Data ?? json.data ?? json) as Record<string, unknown>;
    // El CRM devuelve el número de caso como ggt_NoCaso (campo de Dynamics);
    // NumeroCaso/numeroCaso se mantienen por si cambian la versión del API.
    const numeroCaso = (raw.ggt_NoCaso ?? raw.NumeroCaso ?? raw.numeroCaso ?? "") as string;
    return {
      success: true,
      message: (json.Message ?? json.message) as string | undefined,
      data: {
        id: (raw.Id ?? raw.id) as string | number,
        numeroCaso,
      },
      errors: (json.Errors ?? json.errors) as string[] | undefined,
    };
  }

  const errors = (json.Errors ?? json.errors) as Array<{ ErrorMessage?: string; errorMessage?: string } | string> | undefined;
  const firstError = Array.isArray(errors) && errors.length > 0
    ? (typeof errors[0] === "string" ? errors[0] : (errors[0].ErrorMessage ?? errors[0].errorMessage))
    : undefined;

  return {
    success: false,
    message:
      firstError ??
      (json.Message as string | undefined) ??
      (json.mensaje as string | undefined) ??
      (json.message as string | undefined) ??
      "Error al crear el reclamo",
    errors: Array.isArray(errors)
      ? errors.map(e => typeof e === "string" ? e : (e.ErrorMessage ?? e.errorMessage ?? ""))
      : undefined,
  };
}
