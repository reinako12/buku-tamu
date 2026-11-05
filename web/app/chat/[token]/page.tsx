import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { ambilPesan } from "@/lib/chat";
import { ChatRoom } from "@/components/chat/chat-room";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Chat — Buku Tamu BPS Kabupaten Tanah Datar",
  robots: { index: false, follow: false },
};

/** Ruang chat tamu. Token UUID di alamat adalah satu-satunya kuncinya. */
export default async function ChatRoomPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const percakapan = await ambilPesan(token);
  if (!percakapan) notFound();

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  const shareUrl = `${proto}://${host}/chat/${token}`;

  return (
    <ChatRoom
      token={token}
      guestName={percakapan.guestName}
      status={percakapan.status}
      initialMessages={percakapan.messages}
      initialHasMore={percakapan.hasMore}
      shareUrl={shareUrl}
    />
  );
}
