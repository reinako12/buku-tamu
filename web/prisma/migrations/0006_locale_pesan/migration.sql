-- Bahasa tamu dipakai untuk memilih teks pesan sistem (sambutan di luar jam
-- layanan dan nomor antrian). Petugas bisa mengisi versi Inggris sambutan;
-- kalau kosong, aplikasi memakai teks bawaan berbahasa Inggris.
ALTER TABLE "conversations" ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'id';
ALTER TABLE "settings" ADD COLUMN "auto_reply_en" TEXT;
