import { useMemo, useState } from "react";

type DateFieldProps = {
  label: string;
  value: string;
  helper: string;
  onChange: (value: string) => void;
};

function monthLabel(baseDate: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(baseDate);
}

function buildCalendarDays(baseValue: string) {
  const anchor = baseValue ? new Date(`${baseValue}T12:00:00`) : new Date();
  const start = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const startWeekDay = start.getDay();
  const normalizedOffset = (startWeekDay + 6) % 7;
  const gridStart = new Date(start);
  gridStart.setDate(start.getDate() - normalizedOffset);

  return Array.from({ length: 35 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);

    return {
      iso: date.toISOString().slice(0, 10),
      day: date.getDate(),
      inMonth: date.getMonth() === anchor.getMonth(),
      month: date.getMonth(),
      year: date.getFullYear(),
    };
  });
}

function formatDateLabel(value: string) {
  if (!value) {
    return "--/--/----";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

export function DateField({ label, value, helper, onChange }: DateFieldProps) {
  const [currentMonth, setCurrentMonth] = useState(() =>
    value ? new Date(`${value}T12:00:00`) : new Date(),
  );

  const days = useMemo(() => buildCalendarDays(currentMonth.toISOString().slice(0, 10)), [currentMonth]);

  return (
    <div className="rounded-[22px] border border-slate-200 bg-[#fafafb] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</p>
          <p className="mt-3 text-lg font-semibold text-slate-950">{formatDateLabel(value)}</p>
          <p className="mt-1 text-sm text-slate-500">{helper}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-500">
          Calendario
        </div>
      </div>

      <div className="mt-4 rounded-[20px] border border-slate-200 bg-white p-4">
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50"
            onClick={() =>
              setCurrentMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))
            }
          >
            ‹
          </button>
          <p className="text-sm font-semibold capitalize text-slate-900">{monthLabel(currentMonth)}</p>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50"
            onClick={() =>
              setCurrentMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))
            }
          >
            ›
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          {["S", "T", "Q", "Q", "S", "S", "D"].map((item, index) => (
            <span key={`${item}-${index}`}>{item}</span>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-7 gap-2">
          {days.map((day) => {
            const isSelected = day.iso === value;

            return (
              <button
                key={day.iso}
                type="button"
                onClick={() => onChange(day.iso)}
                className={`flex h-10 items-center justify-center rounded-xl text-sm transition ${
                  isSelected
                    ? "bg-slate-900 font-semibold text-white"
                    : day.inMonth
                      ? "text-slate-700 hover:bg-slate-100"
                      : "text-slate-300 hover:bg-slate-50"
                }`}
              >
                {day.day}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
