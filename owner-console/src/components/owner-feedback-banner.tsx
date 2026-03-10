import type { OwnerFeedback } from "@/lib/owner-ui";

export function OwnerFeedbackBanner({
  feedback,
  className = "",
}: {
  feedback: OwnerFeedback | null;
  className?: string;
}) {
  if (!feedback) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      className={`rounded-[22px] border px-5 py-4 text-sm ${
        feedback.tone === "success"
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
          : "border-rose-500/30 bg-rose-500/10 text-rose-100"
      } ${className}`}
    >
      {feedback.message}
    </div>
  );
}
