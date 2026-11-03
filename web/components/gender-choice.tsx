"use client";

import { Mars, Venus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { GENDERS, GENDER_LABEL } from "@/lib/schemas/visit";

/**
 * Warna per jenis kelamin: laki-laki biru, perempuan pink. Ikon dari Lucide
 * (Mars / Venus) supaya tamu tidak perlu membaca label dua kali.
 */
const STYLE: Record<
  (typeof GENDERS)[number],
  { icon: LucideIcon; hover: string; checked: string }
> = {
  lk: {
    icon: Mars,
    hover: "hover:border-[#1d4ed8] hover:bg-[#eff6ff] hover:text-[#1d4ed8]",
    checked:
      "peer-checked:border-[#1d4ed8] peer-checked:bg-[#eff6ff] peer-checked:text-[#1d4ed8]",
  },
  pr: {
    icon: Venus,
    hover: "hover:border-[#db2777] hover:bg-[#fdf2f8] hover:text-[#db2777]",
    checked:
      "peer-checked:border-[#db2777] peer-checked:bg-[#fdf2f8] peer-checked:text-[#db2777]",
  },
};

export function GenderChoice({
  name = "gender",
  value,
  onChange,
  invalid,
  describedBy,
}: {
  name?: string;
  /** Kalau diisi, komponen jadi terkontrol. Kalau tidak, radio biasa. */
  value?: string;
  onChange?: (value: string) => void;
  invalid?: boolean;
  describedBy?: string;
}) {
  const controlled = value !== undefined;

  return (
    <div className="flex flex-wrap gap-sm">
      {GENDERS.map((gender) => {
        const { icon: Icon, hover, checked } = STYLE[gender];
        return (
          <label key={gender} className="cursor-pointer">
            <input
              type="radio"
              name={name}
              value={gender}
              className="peer sr-only"
              {...(controlled
                ? { checked: value === gender, onChange: () => onChange?.(gender) }
                : {})}
              aria-invalid={invalid}
              aria-describedby={describedBy}
            />
            <span
              className={`flex min-h-[48px] items-center gap-xs rounded-lg border
                          border-border-strong px-lg text-body-sm text-ink-muted
                          transition-colors duration-150
                          peer-focus-visible:ring-2 peer-focus-visible:ring-primary/20
                          peer-focus-visible:ring-offset-2 ${hover} ${checked}`}
            >
              <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
              {GENDER_LABEL[gender]}
            </span>
          </label>
        );
      })}
    </div>
  );
}
