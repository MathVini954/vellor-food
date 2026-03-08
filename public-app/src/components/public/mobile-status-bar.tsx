export function MobileStatusBar() {
  return (
    <div className="flex items-center justify-between px-6 pb-3 pt-5 text-[13px] font-semibold text-[#111827]">
      <span>9:41</span>
      <div className="flex items-center gap-2">
        <div className="flex items-end gap-[2px]">
          <span className="h-[5px] w-[3px] rounded-full bg-[#111827]" />
          <span className="h-[7px] w-[3px] rounded-full bg-[#111827]" />
          <span className="h-[9px] w-[3px] rounded-full bg-[#111827]" />
          <span className="h-[11px] w-[3px] rounded-full bg-[#111827]" />
        </div>
        <span className="h-[10px] w-[15px] rounded-[3px] border border-[#111827]" />
        <span className="h-[6px] w-[3px] rounded-full bg-[#111827]" />
      </div>
    </div>
  );
}
