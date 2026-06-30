import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import pool from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await verifySession(request);
  if (!session || session.rol !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const result = await pool.query(
      `SELECT id_apartamento, codigo_login, modelo, torre, numero, nivel
       FROM apartamentos
       WHERE rol = 'residente'
       ORDER BY torre, numero`,
    );
    return NextResponse.json({ apartamentos: result.rows });
  } catch (err) {
    console.error("Error consultando apartamentos:", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
