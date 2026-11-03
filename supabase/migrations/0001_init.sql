-- 0001_init.sql — Buku Tamu BPS Kabupaten Tanah Datar
-- Fase 0. Chat (tabel messages) sengaja BELUM ada — masuk migrasi 0002
-- saat fitur live chat dikerjakan setelah buku tamu rampung.

-- ============================================================
-- ENUM
-- ============================================================
create type visit_status as enum ('menunggu','dipanggil','dilayani','selesai','batal');
create type staff_role   as enum ('petugas','admin');
create type visit_source as enum ('mandiri','manual');

-- ============================================================
-- PROFIL PETUGAS (1 akun resepsionis di MVP)
-- ============================================================
create table profiles (
  id         uuid primary key references auth.users on delete cascade,
  full_name  text not null,
  role       staff_role not null default 'petugas',
  created_at timestamptz not null default now()
);

-- ============================================================
-- KUNJUNGAN
-- ============================================================
create table visits (
  id              uuid primary key default gen_random_uuid(),
  token           uuid not null default gen_random_uuid() unique,
  queue_date      date not null,
  queue_seq       int  not null,
  queue_no        text not null unique,
  name            text not null check (char_length(name) between 2 and 80),
  institution     text not null check (char_length(institution) between 2 and 120),
  institution_cat text not null check (institution_cat in
                    ('bps','pemda','akademisi','swasta','masyarakat','lainnya')),
  phone           text not null check (phone ~ '^\+?[0-9]{8,20}$'),
  purpose         text not null check (purpose in
                    ('konsultasi','data','kerjasama','audiensi','magang','lainnya')),
  detail          text check (detail is null or char_length(detail) <= 500),
  person_count    smallint not null default 1 check (person_count between 1 and 50),
  status          visit_status not null default 'menunggu',
  source          visit_source not null default 'mandiri',
  handled_by      uuid references profiles(id),
  internal_note   text,
  check_in_at     timestamptz not null default now(),
  check_out_at    timestamptz,
  constraint visits_queue_unique unique (queue_date, queue_seq)
);

create index visits_today_idx  on visits (queue_date desc, queue_seq desc);
create index visits_status_idx on visits (status);
create index visits_phone_idx  on visits (phone);

-- ============================================================
-- SETTINGS (satu baris)
-- ============================================================
create table settings (
  id            smallint primary key default 1 check (id = 1),
  is_open       boolean not null default true,
  closed_reason text,
  reopen_at     timestamptz,
  auto_reopen   boolean not null default true,
  updated_at    timestamptz not null default now()
);

insert into settings (id) values (1);

-- ============================================================
-- ALOKASI NOMOR ANTRIAN
-- Dipanggil dari server action. Advisory lock per tanggal mencegah
-- dua tamu mendapat nomor sama saat submit bersamaan.
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
    p_person_count::smallint, p_source
  )
  returning * into v_row;

  return v_row;
end;
$$;

-- Hanya petugas login yang boleh memanggil; tamu lewat server action (service role).
-- Peran anon/authenticated hanya ada di Supabase — dibungkus supaya migrasi
-- tetap bisa dijalankan di Postgres polos (dipakai untuk validasi lokal).
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on function create_visit(text,text,text,text,text,text,int,visit_source) from anon, authenticated';
  end if;
end
$$;

-- ============================================================
-- RLS
-- Tamu TIDAK punya akses langsung ke tabel. Semua akses tamu lewat
-- server action yang memvalidasi token. Anon key tidak dipakai untuk data.
-- ============================================================
alter table profiles enable row level security;
alter table visits   enable row level security;
alter table settings enable row level security;

create policy profiles_self_read on profiles
  for select using (auth.uid() = id);

create policy visits_staff_read on visits
  for select using (exists (select 1 from profiles p where p.id = auth.uid()));

create policy visits_staff_update on visits
  for update using (exists (select 1 from profiles p where p.id = auth.uid()));

create policy settings_staff_read on settings
  for select using (exists (select 1 from profiles p where p.id = auth.uid()));

create policy settings_staff_update on settings
  for update using (exists (select 1 from profiles p where p.id = auth.uid()));

-- ============================================================
-- PROFIL OTOMATIS saat user auth dibuat
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

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
