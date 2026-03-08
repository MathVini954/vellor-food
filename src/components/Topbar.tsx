type TopbarProps = {
  restaurantName: string;
  userName: string;
  pageTitle: string;
  pageSubtitle: string;
  onLogout: () => void;
};

export function Topbar({
  restaurantName,
  userName,
  pageTitle,
  pageSubtitle,
  onLogout,
}: TopbarProps) {
  return (
    <header className="flex min-h-[88px] items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 lg:px-6">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-[#fafafb] text-slate-500"
          >
            <ChevronLeft />
          </button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-medium text-slate-500">{restaurantName}</p>
              <span className="text-slate-300">/</span>
              <h1 className="truncate text-xl font-semibold text-slate-950">{pageTitle}</h1>
            </div>
            <p className="mt-1 truncate text-sm text-slate-500">{pageSubtitle}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden min-w-0 rounded-2xl border border-slate-200 bg-[#fafafb] px-3 py-2 sm:block">
          <p className="truncate text-sm font-semibold text-slate-900">{userName}</p>
          <p className="truncate text-xs text-slate-500">Gestor da operacao</p>
        </div>
        <button
          className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
          type="button"
          onClick={onLogout}
        >
          Sair
        </button>
      </div>
    </header>
  );
}

function ChevronLeft() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8">
      <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
