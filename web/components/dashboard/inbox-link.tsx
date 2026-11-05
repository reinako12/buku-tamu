import Link from "next/link";
import { hitungBelumDibaca } from "@/lib/chat";
import { getT } from "@/lib/i18n/server";

/**
 * Tautan ke inbox dengan jumlah percakapan yang belum dibaca.
 *
 * Angkanya dihitung saat halaman dirender, bukan lewat polling: badge ini
 * menempel di kop halaman dashboard, sementara daftar di dalam inbox punya
 * penyegaran sendiri.
 */
export async function InboxLink({ aktif = false }: { aktif?: boolean }) {
  const t = await getT();
  const belum = await hitungBelumDibaca();

  return (
    <Link
      href="/dashboard/pesan"
      aria-current={aktif ? "page" : undefined}
      className={aktif ? "btn-ghost" : "btn-quiet"}
    >
      {t("inbox.nav")}
      {belum > 0 ? (
        <span
          aria-label={t("inbox.unread", { n: String(belum) })}
          className="ml-2xs inline-flex min-w-[20px] items-center justify-center rounded-full bg-danger px-xs font-mono text-[11px] font-semibold tabular-nums text-ink-inverse"
        >
          {belum}
        </span>
      ) : null}
    </Link>
  );
}
