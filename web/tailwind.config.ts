import type { Config } from "tailwindcss";

/**
 * Token BPS — diambil dari design/tailwind.theme.json (hasil ekstraksi bps.go.id).
 * Jangan edit angka di sini tanpa update DESIGN.md + re-export.
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
        "primary-dark": "#002b6a",
        "primary-light": "#0093dd",
        "primary-light-hover": "#0086ca",
        "accent-orange": "#e27303",
        "accent-green": "#5dab2c",
        success: "#1f630e",
        "success-dark": "#135208",
        danger: "#b7163e",
        "danger-dark": "#7a0839",
        warning: "#eb891b",
        "warning-dark": "#702905",
        "neutral-body": "#eef0f2",
        surface: "#fcfcfc",
        "surface-muted": "#f1f5f9",
        "surface-sunken": "#e5e7eb",
        ink: "#111111",
        "ink-muted": "#575757",
        "ink-inverse": "#fcfcfc",
        border: "#e5e7eb",
        "border-strong": "#cbd5e1",
      },
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        wordmark: ["Arial", "Helvetica", "sans-serif"],
      },
      fontSize: {
        "display-hero": ["30px", { lineHeight: "36px", fontWeight: "700" }],
        "heading-page": ["28px", { lineHeight: "33.6px", fontWeight: "600" }],
        "heading-card": ["24px", { lineHeight: "28.8px", fontWeight: "600" }],
        "heading-detail": ["24px", { lineHeight: "32px", fontWeight: "700" }],
        "heading-table": ["20px", { lineHeight: "28px", fontWeight: "700" }],
        "stat-value": ["28px", { lineHeight: "20px", fontWeight: "700" }],
        "body-md": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "body-sm": ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "label-sm": ["14px", { lineHeight: "16.8px", fontWeight: "500" }],
        caption: ["12px", { lineHeight: "16px", fontWeight: "400" }],
        button: ["16px", { lineHeight: "24px", fontWeight: "600" }],
      },
      borderRadius: {
        xs: "4px",
        sm: "6px",
        md: "8px",
        lg: "12px",
        xl: "16px",
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
        card: "0 5px 15px rgba(37,44,97,.15)",
        lift: "0 10px 15px -3px rgba(0,0,0,.1)",
      },
      maxWidth: {
        container: "1280px",
        form: "640px",
      },
      minHeight: {
        tap: "44px",
      },
    },
  },
  plugins: [],
};

export default config;
