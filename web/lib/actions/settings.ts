"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseJakartaInput } from "@/lib/settings-rules";

export type SettingsState = {
  ok: boolean;
  error: string | null;
  savedAt: string | null;
};

const MAX_REASON = 200;
const MAX_AUTO_REPLY = 400;

function parseJakartaLocal(value: string): Date | null {
  return parseJakartaInput(value);
}

export async function saveSettings(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  await requireStaff("/pengaturan");

  const isOpen = formData.get("isOpen") === "on";
  const autoReopen = formData.get("autoReopen") === "on";
  const reason = String(formData.get("closedReason") ?? "").trim();
  const reopenRaw = String(formData.get("reopenAt") ?? "").trim();
  const autoReply = String(formData.get("autoReply") ?? "").trim();

  if (reason.length > MAX_REASON) {
    return {
      ok: false,
      error: `Alasan maksimal ${MAX_REASON} karakter.`,
      savedAt: null,
    };
  }

  if (autoReply.length > MAX_AUTO_REPLY) {
    return {
      ok: false,
      error: `Teks sambutan maksimal ${MAX_AUTO_REPLY} karakter.`,
      savedAt: null,
    };
  }

  const reopenAt = reopenRaw ? parseJakartaLocal(reopenRaw) : null;
  if (reopenRaw && !reopenAt) {
    return { ok: false, error: "settings.errReopen", savedAt: null };
  }

  const data = {
    isOpen,
    autoReopen,
    autoReply: autoReply || null,
    closedReason: isOpen ? null : reason || null,
    reopenAt: isOpen ? null : reopenAt,
  };

  try {
    await prisma.setting.upsert({
      where: { id: 1 },
      update: data,
      create: { id: 1, ...data },
    });
  } catch (error) {
    console.error("simpan pengaturan gagal", error);
    return { ok: false, error: "settings.errSave", savedAt: null };
  }

  revalidatePath("/");
  revalidatePath("/tutup");
  revalidatePath("/dashboard");
  revalidatePath("/pengaturan");

  return { ok: true, error: null, savedAt: new Date().toISOString() };
}
