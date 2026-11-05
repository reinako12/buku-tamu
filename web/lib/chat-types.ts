/**
 * Bentuk data percakapan yang dipakai bersama server dan klien.
 *
 * File ini sengaja tidak mengimpor Prisma atau apa pun yang "server-only":
 * komponen klien butuh tipe ini, dan `seq` dikirim sebagai number biasa
 * (bukan BigInt) supaya aman lewat JSON.
 */

export type ChatSender = "tamu" | "petugas" | "sistem";

export type ChatStatus = "terbuka" | "ditutup";

export type ChatMessage = {
  seq: number;
  id: string;
  sender: ChatSender;
  body: string;
  /** ISO 8601, supaya klien bebas memformat sesuai zona waktunya. */
  createdAt: string;
};

export type ChatAmbil = {
  status: ChatStatus;
  guestName: string;
  messages: ChatMessage[];
  /** Masih ada pesan lebih lama di luar jendela yang diambil. */
  hasMore: boolean;
};

/**
 * Jendela pesan lengkap dengan identitas percakapan. Dipakai ruang tamu
 * (kunci token) dan ruang petugas (kunci id).
 */
export type ChatRuang = ChatAmbil & {
  id: string;
  guestPhone: string;
  /** Nomor antrian kalau percakapan sudah tersambung ke kunjungan. */
  queueNo: string | null;
};

/** Satu baris di inbox petugas. */
export type RingkasPercakapan = {
  id: string;
  token: string;
  guestName: string;
  guestPhone: string;
  status: ChatStatus;
  lastMessageAt: string | null;
  lastBody: string | null;
  lastSender: ChatSender | null;
  /** Pesan tamu yang masuk setelah terakhir dibuka petugas. */
  unread: number;
  queueNo: string | null;
  visitStatus: string | null;
};


