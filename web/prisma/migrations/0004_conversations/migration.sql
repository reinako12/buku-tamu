-- 0004_conversations — percakapan chat yang tidak menempel ke kunjungan.
--
-- Satu nomor WhatsApp hanya boleh punya satu percakapan terbuka. Aturan itu
-- dijaga partial unique index di sini, bukan hanya pengecekan di kode, supaya
-- dua permintaan bersamaan tidak menghasilkan dua ruang chat.
--
-- RLS diaktifkan tanpa policy: akses hanya lewat Prisma dari server, sama
-- seperti tabel lain. Bagian Supabase-spesifik dibungkus pengecekan supaya
-- migrasi ini tetap jalan di Postgres biasa.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'conversation_status') then
    create type conversation_status as enum ('terbuka', 'ditutup');
  end if;
  if not exists (select 1 from pg_type where typname = 'message_sender') then
    create type message_sender as enum ('tamu', 'petugas', 'sistem');
  end if;
  if not exists (select 1 from pg_type where typname = 'conversation_source') then
    create type conversation_source as enum ('web', 'manual');
  end if;
end $$;

create table if not exists conversations (
  id                 uuid primary key default gen_random_uuid(),
  token              uuid not null unique default gen_random_uuid(),
  visit_id           uuid unique references visits(id) on delete set null,
  guest_name         text not null,
  guest_phone        text not null,
  status             conversation_status not null default 'terbuka',
  source             conversation_source not null default 'web',
  last_message_at    timestamptz(6),
  staff_last_read_at timestamptz(6),
  guest_last_read_at timestamptz(6),
  auto_replied_at    timestamptz(6),
  created_at         timestamptz(6) not null default now(),
  closed_at          timestamptz(6)
);

create table if not exists messages (
  seq             bigserial primary key,
  id              uuid not null unique default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender          message_sender not null,
  staff_id        uuid references profiles(id) on delete set null,
  body            text not null,
  created_at      timestamptz(6) not null default now(),
  constraint messages_body_length check (char_length(body) between 1 and 1000)
);

-- Daftar inbox: percakapan terbuka diurutkan dari pesan terakhir.
create index if not exists conversations_status_last_message_at_idx
  on conversations (status, last_message_at desc);

-- Pencarian percakapan saat tamu check-in dengan nomor yang sama.
create index if not exists conversations_guest_phone_idx
  on conversations (guest_phone);

create unique index if not exists conversations_one_open_per_phone_idx
  on conversations (guest_phone) where status = 'terbuka';

-- Kursor pesan: `where conversation_id = ? and seq > ?`.
create index if not exists messages_conversation_id_seq_idx
  on messages (conversation_id, seq);

alter table conversations enable row level security;
alter table messages enable row level security;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on table conversations, messages from anon, authenticated';
  end if;
  if exists (
    select 1 from pg_class where relname = 'messages_seq_seq' and relkind = 'S'
  ) then
    execute 'revoke all on sequence messages_seq_seq from anon, authenticated';
  end if;
end $$;
