import { useRef } from 'react'

export default function RemarksEditor({ remarks, onChange }) {
  const inputRefs = useRef([])

  function addItem() {
    const next = [...remarks, '']
    onChange(next)
    setTimeout(() => inputRefs.current[next.length - 1]?.focus(), 0)
  }

  function updateItem(index, value) {
    const next = [...remarks]
    next[index] = value
    onChange(next)
  }

  function removeItem(index) {
    const next = remarks.filter((_, i) => i !== index)
    onChange(next)
    setTimeout(() => inputRefs.current[Math.max(0, index - 1)]?.focus(), 0)
  }

  function handleKeyDown(e, index) {
    if (e.key === 'Enter') {
      e.preventDefault()
      addItem()
    } else if (e.key === 'Backspace' && remarks[index] === '' && remarks.length > 1) {
      e.preventDefault()
      removeItem(index)
    }
  }

  return (
    <div>
      <label className="block text-[12px] text-lo mb-1.5">Remarks</label>
      <div className="bg-raised rounded-[8px] border border-line overflow-hidden">
        {remarks.length === 0 ? (
          <p className="text-[13px] text-dim px-3 py-2.5 italic">
            No remarks — tap + to add
          </p>
        ) : (
          <div className="divide-y divide-subtle">
            {remarks.map((item, i) => (
              <div key={i} className="flex items-center gap-2 px-3">
                <span className="text-dim text-[10px] shrink-0 select-none">•</span>
                <input
                  ref={(el) => { inputRefs.current[i] = el }}
                  type="text"
                  value={item}
                  onChange={(e) => updateItem(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, i)}
                  placeholder="Remark"
                  className="flex-1 bg-transparent py-2.5 text-[13px] text-hi placeholder:text-dim outline-none"
                />
                <button
                  type="button"
                  onClick={() => removeItem(i)}
                  className="shrink-0 text-dim text-[18px] leading-none active:text-lo w-7 h-7 flex items-center justify-center"
                  aria-label="Remove remark"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        <div className={remarks.length > 0 ? 'border-t border-subtle' : ''}>
          <button
            type="button"
            onClick={addItem}
            className="flex items-center gap-2 px-3 py-2.5 text-accent-hi text-[13px] font-medium w-full active:bg-overlay transition-colors"
          >
            <span className="text-[18px] leading-none font-light">+</span>
            <span>Add remark</span>
          </button>
        </div>
      </div>
    </div>
  )
}
