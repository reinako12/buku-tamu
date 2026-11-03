"use client";

import { useActionState, useEffect, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
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

function SubmitButton() {
  const { pending } = useFormStatus();
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
  const [filledFromPrevious, setFilledFromPrevious] = useState(false);

  function handlePhoneBlur() {
    if (phone.replace(/\D/g, "").length < 9) return;
    startLookup(async () => {
      const found = await lookupRepeatVisitor(phone);
      if (!found) return;
      setName(found.name);
      setInstitution(found.institution);
      setInstitutionCat(found.institutionCat);
      if (found.gender) setGender(found.gender);
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
            defaultValue={state.values.purpose ?? ""}
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
            defaultValue={state.values.detail ?? ""}
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
        <SubmitButton />
      </div>
    </form>
  );
}
