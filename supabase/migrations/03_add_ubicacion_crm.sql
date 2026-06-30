-- ─── Migración 03: agregar ubicacion_crm a apartamentos ─────────────────────
-- Ejecutar en Supabase SQL Editor.
-- Verificación esperada al final: total_con_ubicacion = 197

-- 1. Agregar columna (idempotente)
ALTER TABLE apartamentos
  ADD COLUMN IF NOT EXISTS ubicacion_crm VARCHAR(30);

-- 2. Poblar con los códigos CRM confirmados por COMOSA
--    Formato: UPDATE apartamentos SET ubicacion_crm = 'P-XXXXX-XXXXXX' WHERE codigo_login = 'A-XXX';
--    ⚠️  PEGAR AQUÍ el bloque de UPDATEs con los 197 códigos reales antes de ejecutar.

-- UPDATE apartamentos SET ubicacion_crm = 'P-01557-C6V2N9' WHERE codigo_login = 'A-101';
-- UPDATE apartamentos SET ubicacion_crm = '...'             WHERE codigo_login = 'A-102';
-- ... (197 filas)

-- 3. Índice para búsquedas por código CRM
CREATE INDEX IF NOT EXISTS idx_apartamentos_ubicacion_crm
  ON apartamentos (ubicacion_crm);

-- 4. Verificación: debe retornar total_con_ubicacion = 197
SELECT COUNT(*) AS total_con_ubicacion
FROM apartamentos
WHERE rol = 'residente'
  AND ubicacion_crm IS NOT NULL
  AND ubicacion_crm <> '';
