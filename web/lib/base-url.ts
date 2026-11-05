import "server-only";
import { headers } from "next/headers";

/**
 * Alamat dasar situs, dipakai untuk menulis tautan absolut ke dalam pesan
 * sistem. Pesan disimpan sebagai teks di database, jadi tautannya harus utuh
 * sejak dibuat — tamu bisa membukanya dari mana saja tanpa menebak domain.
 *
 * Mengembalikan string kosong kalau host tidak terbaca; pemanggil yang
 * memutuskan untuk tidak menempelkan tautan.
 */
export async function alamatDasar(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return "";

  const lokal = host.startsWith("localhost") || host.startsWith("127.0.0.1");
  const proto = h.get("x-forwarded-proto") ?? (lokal ? "http" : "https");
  return `${proto}://${host}`;
}

/** Tautan halaman tiket; kosong kalau alamat dasar tidak diketahui. */
export async function tautanTiket(token: string): Promise<string> {
  const dasar = await alamatDasar();
  return dasar ? `${dasar}/t/${token}` : "";
}
