-- 0002_realtime — aktifkan Realtime untuk tabel visits (dashboard petugas).
-- Aman di Postgres biasa: kalau publikasi Supabase tidak ada, dilewati.

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'visits'
    ) then
      execute 'alter publication supabase_realtime add table visits';
    end if;
  end if;
end
$$;
