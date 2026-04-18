export default function Checkbox({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={[
          'w-5 h-5 rounded-[4px] border flex items-center justify-center shrink-0',
          'transition-colors duration-[120ms]',
          checked
            ? 'bg-accent border-accent'
            : 'border-line group-hover:border-accent/50',
        ].join(' ')}
        style={!checked ? { backgroundColor: 'var(--ds-raised)' } : {}}
      >
        {checked && (
          <svg width="11" height="8" viewBox="0 0 11 8" fill="none" aria-hidden="true">
            <path
              d="M1 4L4 7L10 1"
              stroke="white"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>
      {label && <span className="text-[13px] text-hi">{label}</span>}
    </label>
  )
}
