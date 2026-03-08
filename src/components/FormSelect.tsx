import type { ReactNode, SelectHTMLAttributes } from "react";

type FormSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  children: ReactNode;
};

export function FormSelect({ children, className = "", ...props }: FormSelectProps) {
  return (
    <div className="relative">
      <select
        {...props}
        className={`w-full appearance-none rounded-2xl border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-4 py-3 pr-12 text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] outline-none transition focus:border-slate-900 focus:bg-white focus:shadow-[0_0_0_4px_rgba(15,23,42,0.08)] ${className}`}
      >
        {children}
      </select>
      <span className="pointer-events-none absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-500">
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2">
          <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </div>
  );
}
