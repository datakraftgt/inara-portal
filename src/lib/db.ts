import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
}

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL no está configurado");

  // SSL strict by default. Set DB_SSL_STRICT=false in .env.local only if your
  // local Postgres instance uses a self-signed cert (e.g. Docker without TLS).
  // Staging and production should never set this to false.
  const rejectUnauthorized = process.env.DB_SSL_STRICT !== "false";

  return new Pool({
    connectionString,
    ssl: { rejectUnauthorized },
  });
}

// Reusar la misma instancia entre hot-reloads en desarrollo
const pool = globalThis._pgPool ?? createPool();
if (process.env.NODE_ENV !== "production") globalThis._pgPool = pool;

export default pool;
