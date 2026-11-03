"use client";

import { useActionState, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { createVisit, lookupRepeatVisitor } from "@/lib/actions/visit";
import type { FormState } from "@/lib/actions/visit";
import {
  INSTITUTION_CATEGORIES,
  INSTITUTION_LABEL,
  PURPOSES,
  PURPOSE_LABEL,
} from "@/lib/schemas/visit";

/**
 * State awal form. Sengaja didefinisikan di sini, bukan diimpor dari modul
 * "use server" — modul itu hanya boleh mengekspor fungsi async.
 */
const initialState: FormState = { errors: {}, message: null, values: {} };

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-xs text-caption text-danger">
      {message}
    </p>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? "Menyimpan…" : "Daftar kunjungan"}
    </button>
  );
}

export function CheckinForm() {
  const [state, formAction] = useActionState(createVisit, initialState);
  const [pendingLookup, startLookup] = useTransition();

  const [name, setName] = useState(state.values.name ?? "");
  const [institution, setInstitution] = useState(state.values.institution ?? "");
  const [institutionCat, setInstitutionCat] = useState(
    state.values.institutionCat ?? "",
  );
  const [phone, setPhone] = useState(state.values.phone ?? "");
  const [personCount, setPersonCount] = useState(
    Number(state.values.personCount ?? 1),
  );
  const [filledFromPrevious, setFilledFromPrevious] = useState(false);

  function handlePhoneBlur() {
    if (phone.replace(/\D/g, "").length < 9) return;
    startLookup(async () => {
      const found = await lookupRepeatVisitor(phone);
      if (!found) return;
      setName(found.name);
      setInstitution(found.institution);
      setInstitutionCat(found.institutionCat);
      setFilledFromPrevious(true);
    });
  }

  const errors = state.errors ?? {};

  return (
    <form action={formAction} className="space-y-md" noValidate>
      {state.message ? (
        <div
          role="alert"
          className="rounded-md border border-danger/40 bg-danger/5 px-sm py-sm text-body-sm text-danger"
        >
          {state.message}
        </div>
      ) : null}

      <div>
        <label htmlFor="name" className="mb-2xs block text-label-sm text-ink">
          Nama lengkap <span className="text-danger">*</span>
        </label>
        <input
          id="name"
          name="name"
          className="field"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "err-name" : undefined}
          placeholder="Nama sesuai identitas"
        />
        <FieldError id="err-name" message={errors.name} />
      </div>

      <div>
        <label htmlFor="phone" className="mb-2xs block text-label-sm text-ink">
          Nomor HP / WhatsApp <span className="text-danger">*</span>
        </label>
        <input
          id="phone"
          name="phone"
          className="field"
          inputMode="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onBlur={handlePhoneBlur}
          aria-invalid={Boolean(errors.phone)}
          aria-describedby={errors.phone ? "err-phone" : "hint-phone"}
          placeholder="0812 3456 7890"
        />
        {filledFromPrevious ? (
          <p id="hint-phone" className="mt-xs text-caption text-primary">
            {pendingLookup
              ? "Mencari data kunjungan sebelumnya…"
              : "Data diisi dari kunjungan sebelumnya. Silakan ubah kalau ada yang berbeda."}
          </p>
        ) : (
          <p id="hint-phone" className="mt-xs text-caption text-ink-muted">
            Dipakai untuk menghubungi Anda dan mengisi data kunjungan berikutnya.
          </p>
        )}
        <FieldError id="err-phone" message={errors.phone} />
      </div>

      <div>
        <label
          htmlFor="institutionCat"
          className="mb-2xs block text-label-sm text-ink"
        >
          Kategori instansi <span className="text-danger">*</span>
        </label>
        <select
          id="institutionCat"
          name="institutionCat"
          className="field"
          value={institutionCat}
          onChange={(e) => setInstitutionCat(e.target.value)}
          aria-invalid={Boolean(errors.institutionCat)}
          aria-describedby={errors.institutionCat ? "err-cat" : undefined}
        >
          <option value="">Pilih kategori…</option>
          {INSTITUTION_CATEGORIES.map((value) => (
            <option key={value} value={value}>
              {INSTITUTION_LABEL[value]}
            </option>
          ))}
        </select>
        <FieldError id="err-cat" message={errors.institutionCat} />
      </div>

      <div>
        <label
          htmlFor="institution"
          className="mb-2xs block text-label-sm text-ink"
        >
          Nama instansi / asal <span className="text-danger">*</span>
        </label>
        <input
          id="institution"
          name="institution"
          className="field"
          value={institution}
          onChange={(e) => setInstitution(e.target.value)}
          aria-invalid={Boolean(errors.institution)}
          aria-describedby={errors.institution ? "err-inst" : "hint-inst"}
          placeholder="Contoh: Dinas Pendidikan / Pribadi"
        />
        <p id="hint-inst" className="mt-xs text-caption text-ink-muted">
          Kalau datang sendiri, tulis &quot;Pribadi&quot;.
        </p>
        <FieldError id="err-inst" message={errors.institution} />
      </div>

      <div>
        <label htmlFor="purpose" className="mb-2xs block text-label-sm text-ink">
          Tujuan kunjungan <span className="text-danger">*</span>
        </label>
        <select
          id="purpose"
          name="purpose"
          className="field"
          defaultValue={state.values.purpose ?? ""}
          aria-invalid={Boolean(errors.purpose)}
          aria-describedby={errors.purpose ? "err-purpose" : undefined}
        >
          <option value="">Pilih tujuan…</option>
          {PURPOSES.map((value) => (
            <option key={value} value={value}>
              {PURPOSE_LABEL[value]}
            </option>
          ))}
        </select>
        <FieldError id="err-purpose" message={errors.purpose} />
      </div>

      <div>
        <span className="mb-2xs block text-label-sm text-ink">
          Jumlah orang <span className="text-danger">*</span>
        </span>
        <div className="flex items-center gap-sm">
          <button
            type="button"
            className="btn-ghost h-[44px] w-[44px] shrink-0 px-0 text-heading-card"
            onClick={() => setPersonCount((n) => Math.max(1, n - 1))}
            aria-label="Kurangi jumlah orang"
          >
            −
          </button>
          <input
            id="personCount"
            name="personCount"
            className="field w-20 text-center"
            inputMode="numeric"
            value={personCount}
            onChange={(e) => {
              const next = Number(e.target.value.replace(/\D/g, ""));
              setPersonCount(Number.isNaN(next) ? 1 : next);
            }}
            aria-invalid={Boolean(errors.personCount)}
            aria-describedby={errors.personCount ? "err-count" : undefined}
          />
          <button
            type="button"
            className="btn-ghost h-[44px] w-[44px] shrink-0 px-0 text-heading-card"
            onClick={() => setPersonCount((n) => Math.min(50, n + 1))}
            aria-label="Tambah jumlah orang"
          >
            +
          </button>
        </div>
        <FieldError id="err-count" message={errors.personCount} />
      </div>

      <div>
        <label htmlFor="detail" className="mb-2xs block text-label-sm text-ink">
          Keterangan <span className="text-ink-muted">(opsional)</span>
        </label>
        <textarea
          id="detail"
          name="detail"
          className="field min-h-[88px] py-sm"
          rows={3}
          maxLength={500}
          defaultValue={state.values.detail ?? ""}
          placeholder="Uraian singkat keperluan, misal: konsultasi data stunting 2025"
          aria-invalid={Boolean(errors.detail)}
          aria-describedby={errors.detail ? "err-detail" : undefined}
        />
        <FieldError id="err-detail" message={errors.detail} />
      </div>

      {/* Honeypot — disembunyikan dari manusia, tetap ada di DOM */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <SubmitButton />

      <p className="text-caption text-ink-muted">
        Data dipakai untuk keperluan buku tamu BPS Kabupaten Tanah Datar.
      </p>
    </form>
  );
}
