/**
 * Memecah teks pesan menjadi potongan biasa dan potongan tautan supaya
 * alamat yang ditulis ke database bisa diklik di ruang chat — baik oleh tamu
 * maupun petugas.
 */

const POLA = /(https?:\/\/[^\s<>"']+)/g;

export type Potongan = { teks: string; tautan: boolean };

/** Tanda baca di ujung kalimat bukan bagian dari alamat. */
function rapikan(url: string): string {
  return url.replace(/[.,;:!?)\]]+$/, "");
}

export function pecahTautan(teks: string): Potongan[] {
  const hasil: Potongan[] = [];
  let sisa = 0;

  POLA.lastIndex = 0;
  let cocok = POLA.exec(teks);
  while (cocok) {
    const mulai = cocok.index;
    const url = rapikan(cocok[0]);
    if (mulai > sisa) hasil.push({ teks: teks.slice(sisa, mulai), tautan: false });
    hasil.push({ teks: url, tautan: true });
    sisa = mulai + url.length;
    cocok = POLA.exec(teks);
  }

  if (sisa < teks.length) hasil.push({ teks: teks.slice(sisa), tautan: false });
  if (hasil.length === 0) hasil.push({ teks, tautan: false });
  return hasil;
}
