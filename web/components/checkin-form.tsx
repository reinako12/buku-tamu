"use client";

import { useActionState, useState, useTransition, type ReactNode } from "react";
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

/** Satu baris formulir: label kiri saat lebar, label atas saat HP. */
function Row({
  htmlFor,
  label,
  required,
  hint,
  error,
  errorId,
  children,
}: {
  htmlFor: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  errorId: string;
  children: ReactNode;
}) {
  return (
    <div className="form-row">
      <label htmlFor={htmlFor} className="form-label">
        {label}
        {required ? (
          <span className="text-danger" aria-hidden="true">
            {/* spasi tak-terputus: tanda bintang tidak boleh jatuh ke baris sendiri */}
            {"\u00A0*"}
          </span>
        ) : null}
      </label>
      <div className="form-control">
        {children}
        {hint ? <p className="field-hint">{hint}</p> : null}
        {error ? (
          <p id={errorId} className="field-error">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full md:w-auto" disabled={pending}>
      {pending ? "Mengirim data" : "Kirim dan ambil nomor antrian"}
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
    <form action={formAction} className="space-y-xl" noValidate>
      {state.message ? (
        <div
          role="alert"
          className="border-l-2 border-danger bg-danger/[0.04] px-sm py-sm text-body-sm text-danger"
        >
          {state.message}
        </div>
      ) : null}

      <section className="space-y-lg">
        <div className="section-head">
          <span className="section-num">1</span>
          <h2 className="text-heading-card text-ink">Identitas tamu</h2>
        </div>

        <Row
          htmlFor="name"
          label="Nama lengkap"
          required
          error={errors.name}
          errorId="err-name"
        >
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
        </Row>

        <Row
          htmlFor="phone"
          label="Nomor HP / WhatsApp"
          required
          error={errors.phone}
          errorId="err-phone"
          hint={
            filledFromPrevious
              ? pendingLookup
                ? "Mencari kunjungan sebelumnya."
                : "Nama dan instansi diisi dari kunjungan sebelumnya. Ubah kalau sudah berbeda."
              : "Dipakai untuk menghubungi Anda dan mengisi data kunjungan berikutnya."
          }
        >
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
            aria-describedby={errors.phone ? "err-phone" : undefined}
            placeholder="0812 3456 7890"
          />
        </Row>

        <Row
          htmlFor="institutionCat"
          label="Kategori instansi"
          required
          error={errors.institutionCat}
          errorId="err-cat"
        >
          <select
            id="institutionCat"
            name="institutionCat"
            className="field"
            value={institutionCat}
            onChange={(e) => setInstitutionCat(e.target.value)}
            aria-invalid={Boolean(errors.institutionCat)}
            aria-describedby={errors.institutionCat ? "err-cat" : undefined}
          >
            <option value="">Pilih kategori</option>
            {INSTITUTION_CATEGORIES.map((value) => (
              <option key={value} value={value}>
                {INSTITUTION_LABEL[value]}
              </option>
            ))}
          </select>
        </Row>

        <Row
          htmlFor="institution"
          label="Nama instansi atau asal"
          required
          error={errors.institution}
          errorId="err-inst"
          hint={'Kalau datang sendiri, tulis "Pribadi".'}
        >
          <input
            id="institution"
            name="institution"
            className="field"
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
            aria-invalid={Boolean(errors.institution)}
            aria-describedby={errors.institution ? "err-inst" : undefined}
            placeholder="Dinas Pendidikan, atau Pribadi"
          />
        </Row>
      </section>

      <section className="space-y-lg">
        <div className="section-head">
          <span className="section-num">2</span>
          <h2 className="text-heading-card text-ink">Keperluan kunjungan</h2>
        </div>

        <Row
          htmlFor="purpose"
          label="Tujuan kunjungan"
          required
          error={errors.purpose}
          errorId="err-purpose"
        >
          <select
            id="purpose"
            name="purpose"
            className="field"
            defaultValue={state.values.purpose ?? ""}
            aria-invalid={Boolean(errors.purpose)}
            aria-describedby={errors.purpose ? "err-purpose" : undefined}
          >
            <option value="">Pilih tujuan</option>
            {PURPOSES.map((value) => (
              <option key={value} value={value}>
                {PURPOSE_LABEL[value]}
              </option>
            ))}
          </select>
        </Row>

        <div className="form-row">
          <span className="form-label">
            Jumlah orang
            <span className="text-danger" aria-hidden="true">
              {"\u00A0*"}
            </span>
          </span>
          <div className="form-control">
            <div className="flex items-center gap-xs">
              <button
                type="button"
                className="btn-ghost w-12 px-0 font-mono text-heading-card"
                onClick={() => setPersonCount((n) => Math.max(1, n - 1))}
                aria-label="Kurangi jumlah orang"
              >
                −
              </button>
              <input
                id="personCount"
                name="personCount"
                className="field w-20 text-center font-mono"
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
                className="btn-ghost w-12 px-0 font-mono text-heading-card"
                onClick={() => setPersonCount((n) => Math.min(50, n + 1))}
                aria-label="Tambah jumlah orang"
              >
                +
              </button>
              <span className="text-body-sm text-ink-muted">termasuk Anda</span>
            </div>
            {errors.personCount ? (
              <p id="err-count" className="field-error">
                {errors.personCount}
              </p>
            ) : null}
          </div>
        </div>

        <Row
          htmlFor="detail"
          label="Keterangan"
          error={errors.detail}
          errorId="err-detail"
          hint="Opsional. Tulis keperluan singkat, misal: konsultasi data stunting 2025."
        >
          <textarea
            id="detail"
            name="detail"
            className="field min-h-[104px] resize-y"
            rows={3}
            maxLength={500}
            defaultValue={state.values.detail ?? ""}
            placeholder="Keperluan singkat"
            aria-invalid={Boolean(errors.detail)}
            aria-describedby={errors.detail ? "err-detail" : undefined}
          />
        </Row>
      </section>

      {/* Honeypot — disembunyikan dari manusia, tetap ada di DOM */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="flex flex-col gap-sm border-t border-border pt-md md:flex-row md:items-center md:justify-between">
        <p className="max-w-[46ch] text-caption text-ink-muted">
          Data hanya dipakai untuk keperluan kunjungan di BPS Kabupaten Tanah Datar.
        </p>
        <SubmitButton />
      </div>
    </form>
  );
}
