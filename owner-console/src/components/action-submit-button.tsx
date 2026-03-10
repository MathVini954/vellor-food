"use client";

import type { ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";

type ActionSubmitButtonProps = {
  className: string;
  children: ReactNode;
  pendingLabel: string;
};

export function ActionSubmitButton({
  className,
  children,
  pendingLabel,
}: ActionSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      className={`${className} disabled:cursor-not-allowed disabled:opacity-60`}
      type="submit"
      disabled={pending}
    >
      {pending ? (
        <>
          <LoaderCircle className="animate-spin" size={15} />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}
