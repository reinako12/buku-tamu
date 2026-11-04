"use client";

import { Mars, Venus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { GENDERS } from "@/lib/schemas/visit";
import { useT } from "@/lib/i18n/client";

/**
 * Warna hanya muncul setelah dipilih: laki-laki biru, perempuan pink.
 * Saat diam atau di-hover, pil tetap abu-abu netral — warna berarti status.
 */
const STYLE: Record<
  (typeof GENDERS)[number],
  { icon: LucideIcon; checked: string }
> = {
  lk: {
    icon: Mars,
    checked:
      "peer-checked:border-gender-male peer-checked:bg-gender-male/10 peer-checked:text-gender-male",
  },
  pr: {
    icon: Venus,
    checked:
      "peer-checked:border-gender-female peer-checked:bg-gender-female/10 peer-checked:text-gender-female",
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
  const t = useT();
  const controlled = value !== undefined;

  return (
    <div className="flex flex-wrap gap-sm">
      {GENDERS.map((gender) => {
        const { icon: Icon, checked } = STYLE[gender];
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
              className={`gender-pill flex min-h-[48px] items-center gap-xs rounded-lg border
                          border-border-strong px-lg text-body-sm text-ink-muted
                          transition-colors duration-150
                          peer-focus-visible:ring-2 peer-focus-visible:ring-primary/20
                          peer-focus-visible:ring-offset-2 ${checked}`}
            >
              <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
              {t(gender === "lk" ? "gender.lk" : "gender.pr")}
            </span>
          </label>
        );
      })}
    </div>
  );
}
