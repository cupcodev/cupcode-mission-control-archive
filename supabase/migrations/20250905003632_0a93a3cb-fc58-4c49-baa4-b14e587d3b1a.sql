-- Apply only schema permissions first
grant usage on schema mc to anon, authenticated, service_role;
grant usage on schema core to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema mc to authenticated;
grant select, usage on all sequences in schema mc to authenticated;
grant select, insert, update, delete on all tables in schema core to authenticated;
grant select, usage on all sequences in schema core to authenticated;

-- Set default privileges for future tables
alter default privileges in schema mc
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema mc
  grant usage, select on sequences to authenticated;
alter default privileges in schema core
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema core
  grant usage, select on sequences to authenticated;