import type { Config } from "tailwindcss";

/**
 * Token visual proyek buku tamu.
 *
 * Arah desain (lihat design/DESIGN-v2.md): formulir kantor & tiket antrian
 * kertas. Bukan SaaS card kit. Warna biru tetap mengacu identitas BPS.
 *
 * Tailwind 3.5 dipakai (bukan v4) supaya aman sampai Chrome 90 / Safari 15.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#003c80",
        "primary-dark": "#00274f",
        "primary-light": "#0093dd",
        "primary-light-hover": "#0086ca",
        "accent-orange": "#e27303",
        "accent-green": "#5dab2c",
        success: "#1f630e",
        "success-dark": "#135208",
        danger: "#b7163e",
        "danger-dark": "#7a0839",
        warning: "#9a5b12",
        "warning-dark": "#6f3f08",
        "neutral-body": "#eef1f4",
        surface: "#ffffff",
        "surface-muted": "#f4f6f9",
        "surface-sunken": "#e7ebf0",
        ink: "#121a26",
        "ink-muted": "#5a6572",
        "ink-inverse": "#ffffff",
        border: "#d7dde5",
        "border-strong": "#b9c3d0",
      },
      fontFamily: {
        sans: ["var(--font-ui)", "system-ui", "Segoe UI", "Arial", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      fontSize: {
        "display-hero": ["32px", { lineHeight: "36px", fontWeight: "700" }],
        "heading-page": ["26px", { lineHeight: "32px", fontWeight: "600" }],
        "heading-card": ["20px", { lineHeight: "26px", fontWeight: "600" }],
        "heading-detail": ["24px", { lineHeight: "32px", fontWeight: "700" }],
        "heading-table": ["18px", { lineHeight: "26px", fontWeight: "600" }],
        "stat-value": ["28px", { lineHeight: "28px", fontWeight: "600" }],
        "body-md": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "body-sm": ["14px", { lineHeight: "21px", fontWeight: "400" }],
        "label-sm": ["14px", { lineHeight: "18px", fontWeight: "500" }],
        caption: ["13px", { lineHeight: "18px", fontWeight: "400" }],
        button: ["15px", { lineHeight: "20px", fontWeight: "600" }],
      },
      /* Sudut kecil: ini formulir kantor, bukan aplikasi konsumen. */
      borderRadius: {
        xs: "2px",
        sm: "3px",
        md: "5px",
        lg: "8px",
        xl: "12px",
      },
      spacing: {
        "2xs": "4px",
        xs: "8px",
        sm: "12px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        "2xl": "48px",
        "3xl": "56px",
        "4xl": "64px",
        "5xl": "80px",
        "6xl": "144px",
      },
      boxShadow: {
        /* Hanya untuk lembar tiket, meniru kertas yang diangkat sedikit. */
        paper: "0 1px 0 rgba(18,26,38,.06), 0 12px 24px -18px rgba(18,26,38,.45)",
      },
      maxWidth: {
        container: "1120px",
        form: "600px",
        ticket: "380px",
      },
      minHeight: {
        tap: "44px",
      },
    },
  },
  plugins: [],
};

export default config;
