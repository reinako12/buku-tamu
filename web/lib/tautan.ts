/**
 * Teks pesan disimpan apa adanya di database. Beberapa bagian di dalamnya
 * perlu jadi tautan saat ditampilkan: alamat web yang diketik orang, dan
 * tautan berlabel yang ditulis sistem dalam bentuk `[Lihat tiket](alamat)`.
 *
 * Bentuk berlabel dipakai supaya pesan tidak menampilkan alamat panjang —
 * tamu cukup melihat kata "link" yang bisa diklik.
 */

const POLA_LABEL = /\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g;
const POLA_URL = /(https?:\/\/[^\s<>"']+)/g;

export type Potongan = { teks: string; tautan: boolean; href?: string };

type Rentang = { mulai: number; akhir: number; label: string; href: string };

/** Tanda baca di ujung kalimat bukan bagian dari alamat. */
function rapikan(url: string): string {
  return url.replace(/[.,;:!?)\]]+$/, "");
}

/** Semua bagian yang harus jadi tautan, urut dari kiri. */
function cariTautan(teks: string): Rentang[] {
  const hasil: Rentang[] = [];
  const dipakai = new Array<boolean>(teks.length).fill(false);

  const tandai = (mulai: number, akhir: number) => {
    for (let i = mulai; i < akhir && i < dipakai.length; i += 1) dipakai[i] = true;
  };

  POLA_LABEL.lastIndex = 0;
  let label = POLA_LABEL.exec(teks);
  while (label) {
    hasil.push({
      mulai: label.index,
      akhir: label.index + label[0].length,
      label: label[1],
      href: label[2],
    });
    tandai(label.index, label.index + label[0].length);
    label = POLA_LABEL.exec(teks);
  }

  POLA_URL.lastIndex = 0;
  let url = POLA_URL.exec(teks);
  while (url) {
    if (!dipakai[url.index]) {
      const bersih = rapikan(url[0]);
      hasil.push({
        mulai: url.index,
        akhir: url.index + bersih.length,
        label: bersih,
        href: bersih,
      });
      tandai(url.index, url.index + bersih.length);
    }
    POLA_URL.lastIndex = url.index + 1;
    url = POLA_URL.exec(teks);
  }

  return hasil.sort((a, b) => a.mulai - b.mulai);
}

export function pecahTautan(teks: string): Potongan[] {
  const hasil: Potongan[] = [];
  const tautan = cariTautan(teks);
  let sisa = 0;

  for (const bagian of tautan) {
    if (bagian.mulai > sisa) {
      hasil.push({ teks: teks.slice(sisa, bagian.mulai), tautan: false });
    }
    hasil.push({ teks: bagian.label, tautan: true, href: bagian.href });
    sisa = bagian.akhir;
  }

  if (sisa < teks.length) hasil.push({ teks: teks.slice(sisa), tautan: false });
  if (hasil.length === 0) hasil.push({ teks, tautan: false });
  return hasil;
}

/**
 * Teks tanpa penanda tautan berlabel — dipakai untuk ringkasan di daftar
 * percakapan, yang tidak dirender sebagai HTML.
 */
export function teksPolos(teks: string): string {
  return teks.replace(POLA_LABEL, "$1");
}
