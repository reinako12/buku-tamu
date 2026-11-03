"use client";

import {
  useActionState,
  useEffect,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import { addWalkIn, type WalkInState } from "@/lib/actions/staff";
import { GenderChoice } from "@/components/gender-choice";
import { INSTITUTION_CATEGORIES, PURPOSES } from "@/lib/schemas/visit";
import { useT } from "@/lib/i18n/client";
import type { DictKey } from "@/lib/i18n/dict";

const initialState: WalkInState = { ok: false, error: null, fieldErrors: {} };

function SubmitButton({ pending }: { pending: boolean }) {
  const t = useT();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? t("walkin.submitting") : t("walkin.submit")}
    </button>
  );
}

/**
 * Tamu yang datang langsung tanpa mengisi form (tidak bawa HP / lupa).
 * Nomor antrian tetap dari fungsi yang sama, ditandai `source = manual`.
 */
export function WalkInDialog() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(addWalkIn, initialState);
  const [pending, startSubmit] = useTransition();

  /**
   * Sama seperti form tamu: jangan pakai atribut `action` supaya React tidak
   * mengosongkan isian saat ada field yang ditolak validasi. Petugas tidak
   * perlu mengetik ulang seluruh data hanya karena satu kolom salah.
   */
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startSubmit(() => {
      formAction(data);
    });
  }

  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state.ok]);

  if (!open) {
    return (
      <button type="button" className="btn-primary" onClick={() => setOpen(true)}>
        {t("dash.newWalkIn")}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 px-md py-lg">
      <div className="w-full max-w-form rounded-lg border border-border bg-surface p-md">
        <div className="mb-sm flex items-center justify-between">
          <h2 className="text-heading-card text-ink">{t("walkin.title")}</h2>
          <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>
            {t("walkin.close")}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-sm">
          {state.error ? (
            <p role="alert" className="text-body-sm text-danger">
              {t(state.error as DictKey)}
            </p>
          ) : null}

          <div>
            <label htmlFor="wi-name" className="field-label">
              {t("walkin.name")}
            </label>
            <input id="wi-name" name="name" className="field" required />
            {state.fieldErrors.name ? (
              <p className="field-error">{t(state.fieldErrors.name as DictKey)}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="wi-phone" className="field-label">
              {t("walkin.phone")}
            </label>
            <input
              id="wi-phone"
              name="phone"
              className="field"
              inputMode="tel"
              placeholder="0812 3456 7890"
              required
            />
            {state.fieldErrors.phone ? (
              <p className="field-error">{t(state.fieldErrors.phone as DictKey)}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="wi-cat" className="field-label">
              {t("walkin.institutionCat")}
            </label>
            <select id="wi-cat" name="institutionCat" className="field" required>
              <option value="">{t("field.choose")}</option>
              {INSTITUTION_CATEGORIES.map((value) => (
                <option key={value} value={value}>
                  {t(`cat.${value}` as DictKey)}
                </option>
              ))}
            </select>
            {state.fieldErrors.institutionCat ? (
              <p className="field-error">
                {t(state.fieldErrors.institutionCat as DictKey)}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="wi-inst" className="field-label">
              {t("walkin.institution")}
            </label>
            <input id="wi-inst" name="institution" className="field" required />
            {state.fieldErrors.institution ? (
              <p className="field-error">
                {t(state.fieldErrors.institution as DictKey)}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="wi-purpose" className="field-label">
              {t("walkin.purpose")}
            </label>
            <select id="wi-purpose" name="purpose" className="field" required>
              <option value="">{t("field.choose")}</option>
              {PURPOSES.map((value) => (
                <option key={value} value={value}>
                  {t(`purpose.${value}` as DictKey)}
                </option>
              ))}
            </select>
            {state.fieldErrors.purpose ? (
              <p className="field-error">{t(state.fieldErrors.purpose as DictKey)}</p>
            ) : null}
          </div>

          <div>
            <span className="field-label">{t("walkin.gender")}</span>
            <GenderChoice name="gender" invalid={Boolean(state.fieldErrors.gender)} />
            {state.fieldErrors.gender ? (
              <p className="field-error">{t(state.fieldErrors.gender as DictKey)}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="wi-detail" className="field-label">
              {t("walkin.detail")}
            </label>
            <textarea
              id="wi-detail"
              name="detail"
              className="field min-h-[72px] py-sm"
              rows={2}
            />
          </div>

          <SubmitButton pending={pending} />
        </form>
      </div>
    </div>
  );
}
