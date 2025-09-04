-- Permitir que a API enxergue os schemas
GRANT USAGE ON SCHEMA mc TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA core TO anon, authenticated, service_role;

-- Permitir operações nas tabelas (RLS continua valendo)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA mc TO authenticated;
GRANT SELECT, USAGE ON ALL SEQUENCES IN SCHEMA mc TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA core TO authenticated;
GRANT SELECT, USAGE ON ALL SEQUENCES IN SCHEMA core TO authenticated;

-- Defaults para futuras tabelas no mesmo schema
ALTER DEFAULT PRIVILEGES IN SCHEMA mc
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA mc
  GRANT USAGE, SELECT ON SEQUENCES TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA core
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA core
  GRANT USAGE, SELECT ON SEQUENCES TO authenticated;