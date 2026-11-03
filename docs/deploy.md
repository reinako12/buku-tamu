# Deploy — bukutamu.grrifixn.my.id

Status: **live** sejak 3 Nov 2026 (demo). Bukan produksi BPS.

## Arsitektur

```
HP tamu → Cloudflare (HTTPS) → cloudflared tunnel → 127.0.0.1:3100 (Next.js) → Supabase Postgres
```

Tidak memakai Vercel. Server yang sama juga menjalankan `9router`, `money-tracker`,
dan `cloudflared`.

## Komponen di server

| Komponen | Lokasi |
|---|---|
| Aplikasi | `/root/project-magang/projects/buku-tamu/web` |
| Service | `bukutamu.service` (systemd, restart otomatis) |
| Log | `/var/log/bukutamu.log` |
| Env | `web/.env` (600, tidak masuk git) |
| Tunnel ingress | `/etc/cloudflared/config.yml` |
| DNS | CNAME `bukutamu` → `<tunnel-id>.cfargotunnel.com` |

Port aplikasi: **3100** (dipilih supaya tidak bentrok dengan 8890/8891/20128).

## Perintah harian

```bash
systemctl status bukutamu
systemctl restart bukutamu          # setelah build baru
tail -f /var/log/bukutamu.log
```

## Cara deploy versi baru

```bash
cd /root/project-magang/projects/buku-tamu/web
git pull
npm ci
npx prisma migrate deploy           # kalau ada migrasi baru
npm run build
systemctl restart bukutamu
curl -s -o /dev/null -w "%{http_code}\n" https://bukutamu.grrifixn.my.id/
```

Build wajib sebelum restart — `next start` menyajikan isi `.next/`, bukan source.

## Rollback

```bash
cd /root/project-magang/projects/buku-tamu
git checkout fase-1                 # tag fase sebelumnya
cd web && npm ci && npm run build
systemctl restart bukutamu
```

## Catatan penting

- **Kredensial ada di `web/.env`**. Jangan commit, jangan share. Service role
  key Supabase setara password database.
- `cloudflared` menyajikan 4 hostname dari satu tunnel. Menambah hostname baru =
  edit `/etc/cloudflared/config.yml` **dan** `cloudflared tunnel route dns`,
  lalu `systemctl restart cloudflared`.
- Belum ada proteksi apa pun di halaman publik: siapa pun yang tahu URL bisa
  mengisi form. Ini memang tujuan buku tamu, dan rate limit 3/30 detik menahan
  spam. Dashboard petugas (Fase 2) yang akan diberi login.
