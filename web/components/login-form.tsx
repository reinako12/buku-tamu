"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { signIn, type LoginState } from "@/lib/actions/auth";
import { useT } from "@/lib/i18n/client";
import type { DictKey } from "@/lib/i18n/dict";

const initialState: LoginState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  const t = useT();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? t("login.submitting") : t("login.submit")}
    </button>
  );
}

export function LoginForm({ next }: { next: string }) {
  const t = useT();
  const router = useRouter();
  const [state, formAction, pending] = useActionState(signIn, initialState);
  const wasPending = useRef(false);

  // Login jalan lewat server action, dan action-nya tidak memberi tanda "berhasil"
  // ke klien. Jadi patokannya cuma: pending berubah true -> false tanpa error.
  // Kalau ternyata gagal, middleware bakal balikin orangnya ke /masuk lagi.
  useEffect(() => {
    if (!(wasPending.current && !pending && !state.error)) {
      wasPending.current = pending;
      return;
    }

    // router.refresh() dulu karena paling cepat. Kadang middleware belum sempat
    // baca cookie sesinya dan muter balik ke /masuk, makanya dicek lagi setelah
    // 700ms: kalau masih di /masuk padahal cookie-nya sudah ada, paksa navigasi
    // penuh supaya cookie ikut terkirim.
    router.refresh();
    const timer = window.setTimeout(() => {
      if (window.location.pathname === "/masuk" && document.cookie.includes("-auth-token")) {
        window.location.replace(next);
      }
    }, 700);

    wasPending.current = pending;
    return () => window.clearTimeout(timer);
  }, [pending, state.error, next, router]);

  return (
    <form action={formAction} className="space-y-md">
      <input type="hidden" name="next" value={next} />

      {state.error ? (
        <div
          role="alert"
          className="border-l-2 border-danger bg-danger/[0.04] px-sm py-sm text-body-sm text-danger"
        >
          {state.error ? t(state.error as DictKey) : null}
        </div>
      ) : null}

      <div>
        <label htmlFor="email" className="field-label">
          {t("login.email")}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          className="field"
          autoComplete="username"
          inputMode="email"
          required
        />
      </div>

      <div>
        <label htmlFor="password" className="field-label">
          {t("login.password")}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          className="field"
          autoComplete="current-password"
          required
        />
      </div>

      <SubmitButton />
    </form>
  );
}
