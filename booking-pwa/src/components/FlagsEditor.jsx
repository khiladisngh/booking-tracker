import { useState, useRef } from 'react'
import Checkbox from './Checkbox'

export default function FlagsEditor({ helicopter, assistance, customFlags, onChange }) {
  const [isAdding, setIsAdding] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const newInputRef = useRef(null)

  function emit(updates) {
    onChange({ helicopter, assistance, customFlags, ...updates })
  }

  function handleCustomToggle(id, checked) {
    emit({ customFlags: customFlags.map((f) => f.id === id ? { ...f, checked } : f) })
  }

  function removeCustom(id) {
    emit({ customFlags: customFlags.filter((f) => f.id !== id) })
  }

  function startAdding() {
    setIsAdding(true)
    setTimeout(() => newInputRef.current?.focus(), 0)
  }

  function commitNew() {
    const label = newLabel.trim()
    setIsAdding(false)
    setNewLabel('')
    if (!label) return
    emit({
      customFlags: [...customFlags, { id: `flag-${Date.now()}`, label, checked: true }],
    })
  }

  return (
    <div>
      <label className="block text-[12px] text-lo mb-1.5">Flags</label>
      <div className="bg-raised rounded-[8px] border border-line overflow-hidden">
        <div className="divide-y divide-subtle">
          <div className="px-3 py-2.5">
            <Checkbox
              checked={helicopter}
              onChange={(v) => emit({ helicopter: v })}
              label="Helicopter ticket"
            />
          </div>
          <div className="px-3 py-2.5">
            <Checkbox
              checked={assistance}
              onChange={(v) => emit({ assistance: v })}
              label="Assistance needed"
            />
          </div>

          {customFlags.map((flag) => (
            <div key={flag.id} className="flex items-center gap-2 px-3 py-2.5">
              <Checkbox
                checked={flag.checked ?? false}
                onChange={(v) => handleCustomToggle(flag.id, v)}
                label={flag.label}
              />
              <button
                type="button"
                onClick={() => removeCustom(flag.id)}
                className="ml-auto shrink-0 text-dim text-[18px] leading-none active:text-lo w-7 h-7 flex items-center justify-center"
                aria-label={`Remove ${flag.label}`}
              >
                ×
              </button>
            </div>
          ))}

          {isAdding && (
            <div className="flex items-center gap-2 px-3 py-1.5">
              <span
                className="w-5 h-5 rounded-[4px] border border-line shrink-0"
                style={{ backgroundColor: 'var(--ds-raised)' }}
              />
              <input
                ref={newInputRef}
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); commitNew() }
                  if (e.key === 'Escape') { setIsAdding(false); setNewLabel('') }
                }}
                onBlur={commitNew}
                placeholder="Flag label…"
                className="flex-1 bg-transparent py-2 text-[13px] text-hi placeholder:text-dim outline-none"
              />
            </div>
          )}
        </div>

        <div className="border-t border-subtle">
          <button
            type="button"
            onClick={startAdding}
            className="flex items-center gap-2 px-3 py-2.5 text-accent-hi text-[13px] font-medium w-full active:bg-overlay transition-colors"
          >
            <span className="text-[18px] leading-none font-light">+</span>
            <span>Add flag</span>
          </button>
        </div>
      </div>
    </div>
  )
}
