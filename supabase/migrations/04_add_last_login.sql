ALTER TABLE apartamentos
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ NULL;

COMMENT ON COLUMN apartamentos.last_login_at IS 'Timestamp del último login exitoso del residente. NULL = nunca ha ingresado.';
