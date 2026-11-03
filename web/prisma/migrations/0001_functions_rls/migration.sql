-- 0001_functions_rls — objek yang TIDAK bisa dimodelkan Prisma.
--
-- Isi: fungsi alokasi nomor antrian, trigger profil, dan RLS.
-- Semua bagian yang bergantung pada Supabase (auth.users, auth.uid) dibungkus
-- pengecekan supaya migrasi ini tetap jalan di Postgres biasa.

-- ============================================================
-- ALOKASI NOMOR ANTRIAN
-- Advisory lock per tanggal mencegah dua tamu mendapat nomor yang sama
-- saat submit bersamaan.
-- ============================================================
create or replace function create_visit(
  p_name            text,
  p_institution     text,
  p_institution_cat text,
  p_phone           text,
  p_purpose         text,
  p_detail          text default null,
  p_person_count    int default 1,
  p_source          visit_source default 'mandiri'
) returns visits
language plpgsql
security definer
set search_path = public
as $$
declare
  v_date date := (now() at time zone 'Asia/Jakarta')::date;
  v_seq  int;
  v_row  visits;
begin
  perform pg_advisory_xact_lock(hashtext('visit:' || v_date::text));

  select coalesce(max(queue_seq), 0) + 1 into v_seq
  from visits where queue_date = v_date;

  insert into visits (
    queue_date, queue_seq, queue_no,
    name, institution, institution_cat, phone, purpose, detail, person_count, source
  ) values (
    v_date, v_seq,
    'BT-' || to_char(v_date, 'YYYYMMDD') || '-' || lpad(v_seq::text, 3, '0'),
    p_name, p_institution, p_institution_cat, p_phone, p_purpose, p_detail,
    p_person_count, p_source
  )
  returning * into v_row;

  return v_row;
end;
$$;

-- ============================================================
-- RLS — hanya relevan saat akses lewat Supabase client (anon/authenticated).
-- Prisma connect sebagai pemilik tabel sehingga TIDAK terkena RLS.
-- Otorisasi jalur Prisma ada di server action (validasi token / sesi petugas).
-- ============================================================
alter table profiles enable row level security;
alter table visits   enable row level security;
alter table settings enable row level security;

do $$
begin
  if exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'auth' and p.proname = 'uid'
  ) then
    execute $p$
      create policy profiles_self_read on profiles
        for select using (auth.uid() = id)
    $p$;
    execute $p$
      create policy visits_staff_read on visits
        for select using (exists (select 1 from profiles p where p.id = auth.uid()))
    $p$;
    execute $p$
      create policy visits_staff_update on visits
        for update using (exists (select 1 from profiles p where p.id = auth.uid()))
    $p$;
    execute $p$
      create policy settings_staff_read on settings
        for select using (exists (select 1 from profiles p where p.id = auth.uid()))
    $p$;
    execute $p$
      create policy settings_staff_update on settings
        for update using (exists (select 1 from profiles p where p.id = auth.uid()))
    $p$;
  end if;
end
$$;

-- ============================================================
-- PROFIL OTOMATIS saat user Supabase Auth dibuat
-- Hanya dipasang kalau tabel auth.users ada.
-- ============================================================
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'auth' and table_name = 'users'
  ) then
    execute 'drop trigger if exists on_auth_user_created on auth.users';
    execute $t$
      create trigger on_auth_user_created
        after insert on auth.users
        for each row execute function handle_new_user()
    $t$;
  end if;
end
$$;
