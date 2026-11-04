import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n/client";
import { getLocale } from "@/lib/i18n/server";
import { getTheme } from "@/lib/theme.server";

const ui = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-ui",
  weight: ["400", "500", "600", "700"],
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: "Buku Tamu — BPS Kabupaten Tanah Datar",
  description:
    "Buku tamu digital BPS Kabupaten Tanah Datar. Isi data kunjungan dari ponsel Anda.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  /* Warna bilah browser di ponsel, mengikuti tema perangkat. */
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#003c80" },
    { media: "(prefers-color-scheme: dark)", color: "#0e131a" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [locale, theme] = await Promise.all([getLocale(), getTheme()]);

  return (
    <html
      lang={locale}
      data-theme={theme ?? undefined}
      className={`${ui.variable} ${mono.variable}`}
    >
      <body>
        <I18nProvider locale={locale}>{children}</I18nProvider>
      </body>
    </html>
  );
}
