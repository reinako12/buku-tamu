"use client";

import {
  useActionState,
  useEffect,
  useState,
  useTransition,
  type FormEvent,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { createVisit, lookupRepeatVisitor } from "@/lib/actions/visit";
import { GenderChoice } from "@/components/gender-choice";
import type { FormState } from "@/lib/actions/visit";
import { INSTITUTION_CATEGORIES, PURPOSES } from "@/lib/schemas/visit";
import { useT } from "@/lib/i18n/client";
import type { DictKey } from "@/lib/i18n/dict";

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

function SubmitButton({ pending }: { pending: boolean }) {
  const t = useT();
  return (
    <button type="submit" className="btn-primary w-full md:w-auto" disabled={pending}>
      {pending ? t("home.submitting") : t("home.submit")}
    </button>
  );
}

export function CheckinForm() {
  const router = useRouter();
  const [state, formAction] = useActionState(createVisit, initialState);
  const [pendingLookup, startLookup] = useTransition();
  const [pending, startSubmit] = useTransition();
  const t = useT();
  /** Pesan validasi datang sebagai kode dari server, diterjemahkan di sini. */
  const tr = (code?: string) => (code ? t(code as DictKey) : undefined);

  useEffect(() => {
    if (state.ok && state.token) router.push(`/t/${state.token}`);
  }, [state.ok, state.token, router]);

  const [name, setName] = useState(state.values.name ?? "");
  const [institution, setInstitution] = useState(state.values.institution ?? "");
  const [institutionCat, setInstitutionCat] = useState(
    state.values.institutionCat ?? "",
  );
  const [phone, setPhone] = useState(state.values.phone ?? "");
  const [gender, setGender] = useState(state.values.gender ?? "");
  const [purpose, setPurpose] = useState(state.values.purpose ?? "");
  const [detail, setDetail] = useState(state.values.detail ?? "");
  const [filledFromPrevious, setFilledFromPrevious] = useState(false);

  /**
   * Submit lewat handler sendiri, bukan atribut `action`.
   *
   * React 19 mengosongkan form secara otomatis setelah sebuah form action
   * selesai. Field teks pulih karena nilainya ditulis ulang, tetapi `select`
   * dan `radio` tidak: state React masih menyimpan pilihan lama sementara DOM
   * sudah dikosongkan, jadi tamu melihat kategori instansi dan jenis kelamin
   * kosong lagi dan harus mengisi ulang. Dengan preventDefault, tidak ada reset
   * otomatis — semua nilai tetap di state sampai submit berhasil.
   */
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startSubmit(() => {
      formAction(data);
    });
  }

  function handlePhoneBlur() {
    if (phone.replace(/\D/g, "").length < 9) return;
    startLookup(async () => {
      const found = await lookupRepeatVisitor(phone);
      if (!found) return;
      /**
       * Isi otomatis hanya untuk kolom yang masih kosong. Nomor kantor sering
       * dipakai bergantian, jadi data kunjungan sebelumnya tidak boleh menimpa
       * nama atau instansi yang sudah diketik tamu sendiri.
       */
      let filled = false;
      if (!name.trim()) {
        setName(found.name);
        filled = true;
      }
      if (!institution.trim()) {
        setInstitution(found.institution);
        filled = true;
      }
      if (!institutionCat) {
        setInstitutionCat(found.institutionCat);
        filled = true;
      }
      if (!gender && found.gender) {
        setGender(found.gender);
        filled = true;
      }
      if (filled) setFilledFromPrevious(true);
    });
  }

  const errors = state.errors ?? {};

  return (
    <form onSubmit={handleSubmit} className="space-y-xl" noValidate>
      {state.message ? (
        <div
          role="alert"
          className="border-l-2 border-danger bg-danger/[0.04] px-sm py-sm text-body-sm text-danger"
        >
          {tr(state.message)}
        </div>
      ) : null}

      <section className="space-y-lg">
        <div className="section-head">
          <span className="section-num">1</span>
          <h2 className="text-heading-card text-ink">{t("home.sectionIdentity")}</h2>
        </div>

        <Row
          htmlFor="name"
          label={t("field.name")}
          required
          error={tr(errors.name)}
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
            placeholder={t("field.namePlaceholder")}
          />
        </Row>

        <Row
          htmlFor="phone"
          label={t("field.phone")}
          required
          error={tr(errors.phone)}
          errorId="err-phone"
          hint={
            filledFromPrevious
              ? pendingLookup
                ? t("common.loading")
                : t("home.autofill")
              : t("field.phoneHint")
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
          label={t("field.institutionCat")}
          required
          error={tr(errors.institutionCat)}
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
            <option value="">{t("field.choose")}</option>
            {INSTITUTION_CATEGORIES.map((value) => (
              <option key={value} value={value}>
                {t(`cat.${value}` as DictKey)}
              </option>
            ))}
          </select>
        </Row>

        <Row
          htmlFor="institution"
          label={t("field.institution")}
          required
          error={tr(errors.institution)}
          errorId="err-inst"
          hint={t("field.institutionHint")}
        >
          <input
            id="institution"
            name="institution"
            className="field"
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
            aria-invalid={Boolean(errors.institution)}
            aria-describedby={errors.institution ? "err-inst" : undefined}
            placeholder={t("field.institutionPlaceholder")}
          />
        </Row>

        <div className="form-row">
          <span className="form-label">
            {t("field.gender")}
            <span className="text-danger" aria-hidden="true">
              {"\u00A0*"}
            </span>
          </span>
          <div className="form-control">
            <GenderChoice
              value={gender}
              onChange={setGender}
              invalid={Boolean(errors.gender)}
              describedBy={errors.gender ? "err-gender" : undefined}
            />
            {errors.gender ? (
              <p id="err-gender" className="field-error">
                {tr(errors.gender)}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="space-y-lg">
        <div className="section-head">
          <span className="section-num">2</span>
          <h2 className="text-heading-card text-ink">{t("home.sectionVisit")}</h2>
        </div>

        <Row
          htmlFor="purpose"
          label={t("field.purpose")}
          required
          error={tr(errors.purpose)}
          errorId="err-purpose"
        >
          <select
            id="purpose"
            name="purpose"
            className="field"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            aria-invalid={Boolean(errors.purpose)}
            aria-describedby={errors.purpose ? "err-purpose" : undefined}
          >
            <option value="">{t("field.choose")}</option>
            {PURPOSES.map((value) => (
              <option key={value} value={value}>
                {t(`purpose.${value}` as DictKey)}
              </option>
            ))}
          </select>
        </Row>

        <Row
          htmlFor="detail"
          label={t("field.detail")}
          error={tr(errors.detail)}
          errorId="err-detail"
          hint={t("field.detailHint")}
        >
          <textarea
            id="detail"
            name="detail"
            className="field min-h-[104px] resize-y"
            rows={3}
            maxLength={500}
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder={t("field.detailPlaceholder")}
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
          {t("home.privacy")}
        </p>
        <SubmitButton pending={pending} />
      </div>
    </form>
  );
}
