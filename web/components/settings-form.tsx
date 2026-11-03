"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { saveSettings, type SettingsState } from "@/lib/actions/settings";
import { toJakartaInputValue } from "@/lib/settings-rules";

const initialState: SettingsState = { ok: false, error: null, savedAt: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full sm:w-auto" disabled={pending}>
      {pending ? "Menyimpan" : "Simpan pengaturan"}
    </button>
  );
}

export function SettingsForm({
  isOpen,
  closedReason,
  reopenAt,
  autoReopen,
}: {
  isOpen: boolean;
  closedReason: string | null;
  reopenAt: string | null;
  autoReopen: boolean;
}) {
  const [state, formAction] = useActionState(saveSettings, initialState);
  const [open, setOpen] = useState(isOpen);

  const savedLabel = state.savedAt
    ? new Intl.DateTimeFormat("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Jakarta",
      }).format(new Date(state.savedAt))
    : null;

  return (
    <form action={formAction} className="space-y-lg">
      <div className="flex items-start justify-between gap-sm border border-border rounded-lg px-md py-sm">
        <div>
          <label htmlFor="isOpen" className="text-body-md font-medium text-ink">
            Buku tamu dibuka
          </label>
          <p className="mt-2xs text-caption text-ink-muted">
            Saat dimatikan, tamu melihat halaman penutupan dan tidak bisa mengisi form.
          </p>
        </div>

        <label className="relative inline-flex cursor-pointer items-center">
          <input
            id="isOpen"
            name="isOpen"
            type="checkbox"
            className="peer sr-only"
            checked={open}
            onChange={(e) => setOpen(e.target.checked)}
          />
          <span
            className="h-7 w-12 rounded-full border border-border-strong bg-surface-muted
                       transition-colors peer-checked:border-primary peer-checked:bg-primary
                       peer-focus-visible:ring-2 peer-focus-visible:ring-primary/20
                       peer-focus-visible:ring-offset-2"
          />
          <span
            className="pointer-events-none absolute left-[3px] h-[22px] w-[22px] rounded-full
                       bg-white border border-border-strong transition-transform peer-checked:translate-x-5"
          />
        </label>
      </div>

      <div className={open ? "space-y-lg opacity-50" : "space-y-lg"}>
        <div>
          <label htmlFor="closedReason" className="field-label">
            Alasan ditutup
          </label>
          <textarea
            id="closedReason"
            name="closedReason"
            className="field min-h-[88px] resize-y"
            rows={2}
            maxLength={200}
            defaultValue={closedReason ?? ""}
            disabled={open}
            placeholder="Contoh: libur nasional, cuti bersama."
          />
          <p className="field-hint">Ditampilkan ke tamu. Boleh dikosongkan.</p>
        </div>

        <div>
          <label htmlFor="reopenAt" className="field-label">
            Buka kembali pada
          </label>
          <input
            id="reopenAt"
            name="reopenAt"
            type="datetime-local"
            className="field max-w-[280px]"
            defaultValue={reopenAt ? toJakartaInputValue(new Date(reopenAt)) : ""}
            disabled={open}
          />
          <p className="field-hint">Waktu Jakarta (WIB). Kosongkan kalau tidak dijadwalkan.</p>
        </div>

        <div className="flex items-start gap-sm">
          <input
            id="autoReopen"
            name="autoReopen"
            type="checkbox"
            className="mt-1 h-5 w-5 accent-primary"
            defaultChecked={autoReopen}
            disabled={open}
          />
          <label htmlFor="autoReopen" className="text-body-sm text-ink">
            Buka otomatis saat waktunya tiba
            <span className="mt-2xs block text-caption text-ink-muted">
              Kalau dimatikan, buku tamu tetap tertutup sampai dibuka manual.
            </span>
          </label>
        </div>
      </div>

      {state.error ? (
        <p role="alert" className="border-l-2 border-danger bg-danger/[0.04] px-sm py-sm text-body-sm text-danger">
          {state.error}
        </p>
      ) : null}

      {savedLabel ? (
        <p role="status" className="text-body-sm text-success">
          Pengaturan tersimpan pukul {savedLabel} WIB.
        </p>
      ) : null}

      <div className="border-t border-border pt-md">
        <SubmitButton />
      </div>
    </form>
  );
}
