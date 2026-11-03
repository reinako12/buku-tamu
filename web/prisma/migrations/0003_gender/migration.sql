-- 0003_gender — jenis kelamin tamu (permintaan pemilik proyek, mengikuti
-- formulir buku tamu DKP Jatim). Nullable supaya baris lama tetap sah.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'visit_gender') then
    create type visit_gender as enum ('lk', 'pr');
  end if;
end $$;

alter table visits add column if not exists gender visit_gender;

-- Fungsi alokasi nomor perlu parameter tambahan. Signature berubah, jadi
-- versi lama dihapus lebih dulu (create or replace tidak bisa menambah argumen).
drop function if exists create_visit(text, text, text, text, text, text, integer, visit_source);

create or replace function create_visit(
  p_name text,
  p_institution text,
  p_institution_cat text,
  p_phone text,
  p_purpose text,
  p_detail text default null,
  p_person_count integer default 1,
  p_source visit_source default 'mandiri',
  p_gender visit_gender default null
)
returns visits
language plpgsql
security definer
set search_path to 'public'
as $function$
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
    name, institution, institution_cat, phone, purpose, detail, person_count,
    source, gender
  ) values (
    v_date, v_seq,
    'BT-' || to_char(v_date, 'YYYYMMDD') || '-' || lpad(v_seq::text, 3, '0'),
    p_name, p_institution, p_institution_cat, p_phone, p_purpose, p_detail,
    p_person_count::smallint, p_source, p_gender
  )
  returning * into v_row;

  return v_row;
end;
$function$;
