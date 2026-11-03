"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { addWalkIn, type WalkInState } from "@/lib/actions/staff";
import {
  INSTITUTION_CATEGORIES,
  INSTITUTION_LABEL,
  PURPOSES,
  PURPOSE_LABEL,
} from "@/lib/schemas/visit";

const initialState: WalkInState = { ok: false, error: null, fieldErrors: {} };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? "Menyimpan" : "Simpan tamu"}
    </button>
  );
}

/**
 * Tamu yang datang langsung tanpa mengisi form (tidak bawa HP / lupa).
 * Nomor antrian tetap dari fungsi yang sama, ditandai `source = manual`.
 */
export function WalkInDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(addWalkIn, initialState);

  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state.ok]);

  if (!open) {
    return (
      <button type="button" className="btn-ghost" onClick={() => setOpen(true)}>
        Tambah tamu manual
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 px-md py-lg">
      <div className="w-full max-w-form rounded-lg border border-border bg-surface p-md">
        <div className="mb-sm flex items-center justify-between">
          <h2 className="text-heading-card text-ink">Tambah tamu manual</h2>
          <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>
            Tutup
          </button>
        </div>

        <form action={formAction} className="space-y-sm">
          {state.error ? (
            <p role="alert" className="text-body-sm text-danger">
              {state.error}
            </p>
          ) : null}

          <div>
            <label htmlFor="wi-name" className="field-label">
              Nama lengkap
            </label>
            <input id="wi-name" name="name" className="field" required />
            {state.fieldErrors.name ? (
              <p className="field-error">{state.fieldErrors.name}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="wi-phone" className="field-label">
              Nomor HP
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
              <p className="field-error">{state.fieldErrors.phone}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="wi-cat" className="field-label">
              Kategori instansi
            </label>
            <select id="wi-cat" name="institutionCat" className="field" required>
              <option value="">Pilih kategori…</option>
              {INSTITUTION_CATEGORIES.map((value) => (
                <option key={value} value={value}>
                  {INSTITUTION_LABEL[value]}
                </option>
              ))}
            </select>
            {state.fieldErrors.institutionCat ? (
              <p className="field-error">
                {state.fieldErrors.institutionCat}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="wi-inst" className="field-label">
              Nama instansi
            </label>
            <input id="wi-inst" name="institution" className="field" required />
            {state.fieldErrors.institution ? (
              <p className="field-error">
                {state.fieldErrors.institution}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="wi-purpose" className="field-label">
              Tujuan
            </label>
            <select id="wi-purpose" name="purpose" className="field" required>
              <option value="">Pilih tujuan…</option>
              {PURPOSES.map((value) => (
                <option key={value} value={value}>
                  {PURPOSE_LABEL[value]}
                </option>
              ))}
            </select>
            {state.fieldErrors.purpose ? (
              <p className="field-error">{state.fieldErrors.purpose}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="wi-count" className="field-label">
              Jumlah orang
            </label>
            <input
              id="wi-count"
              name="personCount"
              className="field"
              inputMode="numeric"
              defaultValue="1"
              required
            />
            {state.fieldErrors.personCount ? (
              <p className="field-error">
                {state.fieldErrors.personCount}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="wi-detail" className="field-label">
              Keterangan (opsional)
            </label>
            <textarea
              id="wi-detail"
              name="detail"
              className="field min-h-[72px] py-sm"
              rows={2}
            />
          </div>

          <SubmitButton />
        </form>
      </div>
    </div>
  );
}
