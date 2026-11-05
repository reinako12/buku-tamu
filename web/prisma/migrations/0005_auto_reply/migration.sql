-- Teks sambutan otomatis saat tamu menulis di luar jam layanan. Dibiarkan
-- kosong supaya aplikasi memakai teks bawaan di lib/chat-janitor.ts; petugas
-- bisa menimpanya lewat halaman pengaturan tanpa mengubah kode.
ALTER TABLE "settings" ADD COLUMN "auto_reply" TEXT;
