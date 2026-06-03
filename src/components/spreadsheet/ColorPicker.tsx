import { useState } from 'react'
import { PALETTE, normalizeColor } from '../../lib/colors'
import { cn } from '../../lib/utils'
import { ui } from '../../lib/theme'

export function ColorPicker({
  value,
  onChange,
  onClose,
}: {
  value: string | null
  onChange: (color: string | null) => void
  onClose?: () => void
}) {
  const [custom, setCustom] = useState(normalizeColor(value) || '#ffffff')

  return (
    <div
      className={`z-50 w-[200px] p-2 ${ui.card}`}
      onClick={(e) => e.stopPropagation()}
    >
      <p className="mb-1.5 text-[10px] font-medium text-slate-500">Colors</p>
      <div className="grid grid-cols-8 gap-0.5">
        {PALETTE.map((hex) => (
          <button
            key={hex}
            type="button"
            title={hex}
            onClick={() => {
              onChange(hex)
              onClose?.()
            }}
            className={cn(
              'h-5 w-5 rounded border border-slate-200',
              normalizeColor(value) === hex && 'ring-2 ring-violet-500',
            )}
            style={{ backgroundColor: hex }}
          />
        ))}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <input
          type="color"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          className="h-7 w-10 cursor-pointer rounded border border-slate-200"
        />
        <button
          type="button"
          className={`flex-1 ${ui.btnSecondary} py-1 text-[10px]`}
          onClick={() => {
            onChange(custom)
            onClose?.()
          }}
        >
          Apply custom
        </button>
      </div>
      <button
        type="button"
        className="mt-2 w-full text-[10px] text-slate-500 hover:text-slate-800"
        onClick={() => {
          onChange(null)
          onClose?.()
        }}
      >
        Clear color
      </button>
    </div>
  )
}
