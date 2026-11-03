"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { signIn, type LoginState } from "@/lib/actions/auth";

const initialState: LoginState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? "Memeriksa…" : "Masuk"}
    </button>
  );
}

export function LoginForm({ next }: { next: string }) {
  const [state, formAction] = useActionState(signIn, initialState);

  return (
    <form action={formAction} className="space-y-md">
      <input type="hidden" name="next" value={next} />

      {state.error ? (
        <div
          role="alert"
          className="rounded-md border border-danger/40 bg-danger/5 px-sm py-sm text-body-sm text-danger"
        >
          {state.error}
        </div>
      ) : null}

      <div>
        <label htmlFor="email" className="mb-2xs block text-label-sm text-ink">
          Email petugas
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
        <label htmlFor="password" className="mb-2xs block text-label-sm text-ink">
          Password
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
