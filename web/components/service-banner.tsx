import type { ServiceState } from "@/lib/service-hours";

const STYLE: Record<Exclude<ServiceState["status"], "open">, string> = {
  break: "border-warning/40 bg-warning/10 text-warning-dark",
  outside: "border-warning/40 bg-warning/10 text-warning-dark",
  weekend: "border-warning/40 bg-warning/10 text-warning-dark",
};

export function ServiceBanner({ state }: { state: ServiceState }) {
  if (state.status === "open" || !state.message) return null;

  return (
    <div
      role="status"
      className={`mb-md rounded-md border px-sm py-sm text-body-sm ${STYLE[state.status]}`}
    >
      {state.message}
    </div>
  );
}
