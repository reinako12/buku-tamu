# Fase 6 — Live Chat (dikerjakan SETELAH buku tamu rampung)

**Prasyarat:** Fase 1–5 selesai dan disetujui. Jangan mulai lebih awal.
**Estimasi:** 3–4 hari · **Gate:** user uji 2 perangkat (HP tamu + PC petugas)

## Tujuan

Tamu bisa chat dengan resepsionis dari halaman tiket, tanpa aplikasi tambahan.
Chat adalah pelengkap panggilan lisan, bukan pengganti.

## Ruang lingkup

1. Migrasi `0002_messages.sql`: tabel `messages` + RLS + realtime
2. Chat tamu di `/t/[token]/chat`
3. Chat petugas di `/admin/tamu/[id]`
4. Realtime + optimistic insert + dedupe
5. Indikator mengetik + status online
6. Fallback polling kalau websocket gagal
7. Auto-reply di luar jam layanan
8. Chat read-only saat kunjungan selesai

## Task

| # | Task | File |
|---|---|---|
| 6.1 | Migrasi `messages` + index + RLS (petugas baca/tulis; tamu lewat server action) | `supabase/migrations/0002_messages.sql` |
| 6.2 | Server action kirim pesan tamu (validasi token + rate limit 1/2 detik) | `lib/actions/chat.ts` |
| 6.3 | Server action kirim pesan petugas | `lib/actions/chat.ts` |
| 6.4 | Komponen `ChatWindow` + `ChatBubble` (token BPS) | `components/chat/*` |
| 6.5 | Realtime subscribe `messages` filter `visit_id` + optimistic + dedupe by id | `components/chat/use-chat.ts` |
| 6.6 | Typing (broadcast) + presence online/offline | idem |
| 6.7 | Fallback polling `/api/messages?after=` | `app/api/messages/route.ts` |
| 6.8 | Auto-reply sekali per kunjungan di luar jam layanan (teks dari `settings`) | `lib/actions/chat.ts` |
| 6.9 | Kunci input saat status `selesai` | `components/chat/chat-window.tsx` |
| 6.10 | Badge unread di tiket & dashboard | `components/*` |
| 6.11 | E2E: 20 pesan 2 arah, latensi < 1 detik, tanpa duplikat setelah refresh | `tests/e2e/chat.spec.ts` |

## Keputusan teknis yang mengikat

- **Satu channel per kunjungan**: `visit:<uuid>`.
- **Tamu tidak memakai anon key** untuk menulis — semua lewat server action.
- **Realtime untuk tamu** memakai private channel yang diotorisasi server setelah
  token valid. Jangan pakai channel publik dengan filter id (bisa ditebak).
- **Fallback polling wajib**, bukan opsional — jaringan kantor sering memblokir
  websocket.
- **Tidak ada lampiran file** di MVP (butuh storage + moderasi).
- **Chat bukan kanal panggilan utama.** Panggilan tetap lisan.

## Kriteria verifikasi

- [ ] Tamu kirim pesan → muncul di dashboard < 1 detik
- [ ] Petugas balas → muncul di HP tamu < 1 detik
- [ ] Refresh halaman tamu → riwayat lengkap, tanpa duplikat
- [ ] Matikan websocket (DevTools) → pesan tetap terkirim lewat polling
- [ ] Chat di luar jam → auto-reply masuk sekali, tidak berulang
- [ ] Status Selesai → input terkunci, pesan lama tetap terbaca
- [ ] Buka tiket di 2 HP berbeda dengan token sama → keduanya sinkron (edge case)
- [ ] Petugas buka 2 tab dashboard → tidak ada pesan ganda

## Yang TIDAK dikerjakan

Lampiran, emoji picker, chat antar petugas, riwayat lintas kunjungan, notifikasi
WhatsApp.
