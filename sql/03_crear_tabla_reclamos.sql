CREATE TABLE IF NOT EXISTS reclamos_respaldo (
  id             SERIAL PRIMARY KEY,
  numero_caso    VARCHAR(20)   UNIQUE NOT NULL,
  apartamento_id INT           REFERENCES apartamentos(id) ON DELETE SET NULL,
  titulo         VARCHAR(200)  NOT NULL,
  observaciones  VARCHAR(2000),
  categoria      VARCHAR(50),
  area           VARCHAR(50),
  archivos_urls  TEXT[],
  estado_crm     VARCHAR(20)   DEFAULT 'enviado',
  created_at     TIMESTAMP     DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reclamos_apartamento ON reclamos_respaldo(apartamento_id);
CREATE INDEX IF NOT EXISTS idx_reclamos_estado      ON reclamos_respaldo(estado_crm);
