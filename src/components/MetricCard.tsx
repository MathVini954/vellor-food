import type { Metric } from "../types/dashboard";

type MetricCardProps = {
  metric: Metric;
};

export function MetricCard({ metric }: MetricCardProps) {
  return (
    <article className="panel rounded-[28px] p-5">
      <p className="text-sm text-slate-500">{metric.label}</p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <strong className="text-3xl font-semibold text-slate-900">{metric.value}</strong>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            metric.trend === "up" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-600"
          }`}
        >
          {metric.change}
        </span>
      </div>
    </article>
  );
}
