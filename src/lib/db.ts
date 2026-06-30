import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
}

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL no está configurado");
  return new Pool({
    connectionString,
    // rejectUnauthorized: false only in dev — Supabase certs are valid in prod
    ssl: { rejectUnauthorized: process.env.NODE_ENV === "production" },
  });
}

// Reusar la misma instancia entre hot-reloads en desarrollo
const pool = globalThis._pgPool ?? createPool();
if (process.env.NODE_ENV !== "production") globalThis._pgPool = pool;

export default pool;
