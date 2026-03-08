type IosToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
};

export function IosToggle({ checked, onChange, label }: IosToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-8 w-14 items-center rounded-full transition ${
        checked ? "bg-[#67d449]" : "bg-slate-300"
      }`}
    >
      <span
        className={`inline-block h-6 w-6 rounded-full bg-white shadow-[0_2px_8px_rgba(15,23,42,0.22)] transition ${
          checked ? "translate-x-7" : "translate-x-1"
        }`}
      />
    </button>
  );
}
