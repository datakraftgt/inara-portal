-- ─── Migración 05: agregar codigo_sap a apartamentos ─────────────────────────
-- Ejecutar en el SQL Editor (o vía psql) contra la base de producción.
--
-- Nota de origen del dato: el código SAP por unidad YA existe en la tabla como
-- id_apartamento (ej. A-101 → TAN01A0101, A-1 → TANPBA0001). Así lo confirma
-- el propio portal (login/route.ts: "SAP code used by CRM and file paths") y
-- ubicacion_crm, que se deriva de él (id_apartamento + 'INARA_AMERICAS_2').
-- Por eso esta migración puebla codigo_sap desde id_apartamento en lugar de
-- requerir un export externo. Pendiente: confirmación de Diego de que
-- id_apartamento coincide 1:1 con el código SAP oficial.
--
-- Verificación esperada al final: total_con_codigo_sap = 197

-- 1. Agregar columna (idempotente)
ALTER TABLE apartamentos
  ADD COLUMN IF NOT EXISTS codigo_sap VARCHAR(20);

-- 2. Poblar desde id_apartamento — solo residentes (el admin usa el
--    placeholder 'ADMIN-COMOSA', que no es un código SAP real; se deja NULL
--    igual que en ubicacion_crm)
UPDATE apartamentos
SET codigo_sap = id_apartamento
WHERE rol = 'residente'
  AND codigo_sap IS NULL
  AND id_apartamento IS NOT NULL;

-- 3. Índice para búsquedas por código SAP
CREATE INDEX IF NOT EXISTS idx_apartamentos_codigo_sap
  ON apartamentos (codigo_sap);

-- 4. Documentar la columna
COMMENT ON COLUMN apartamentos.codigo_sap IS
  'Código SAP de la unidad (mismo valor que id_apartamento; usado por CRM y rutas de archivos). NULL para el usuario admin.';

-- 5. Verificación: debe retornar total_con_codigo_sap = 197 y discrepancias = 0
SELECT COUNT(*) AS total_con_codigo_sap
FROM apartamentos
WHERE rol = 'residente'
  AND codigo_sap IS NOT NULL
  AND codigo_sap <> '';

SELECT COUNT(*) AS discrepancias
FROM apartamentos
WHERE rol = 'residente'
  AND codigo_sap IS DISTINCT FROM id_apartamento;
