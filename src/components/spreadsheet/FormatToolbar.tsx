import {
  EyeOff,
  Trash2,
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Merge,
  Palette,
  Underline,
} from 'lucide-react'
import { useState } from 'react'
import type { CellAlign, CellColor } from '../../../shared/types'
import { ColorPicker } from './ColorPicker'

export function FormatToolbar({
  selectionLabel,
  onToggleBold,
  onToggleItalic,
  onToggleUnderline,
  onAlign,
  onColor,
  onMerge,
  canMerge,
  selectedColCount = 0,
  onHideSelectedColumns,
  onDeleteSelectedColumns,
}: {
  selectionLabel: string
  onToggleBold: () => void
  onToggleItalic: () => void
  onToggleUnderline: () => void
  onAlign: (align: CellAlign) => void
  onColor: (color: CellColor) => void
  onMerge: () => void
  canMerge: boolean
  selectedColCount?: number
  onHideSelectedColumns?: () => void
  onDeleteSelectedColumns?: () => void
}) {
  const [colorOpen, setColorOpen] = useState(false)

  const btn =
    'rounded-md border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900'

  return (
    <div
      className={`flex flex-wrap items-center gap-1.5 border-b border-slate-200 bg-violet-50/80 px-3 py-1.5`}
    >
      <span className="mr-1 text-[11px] font-medium text-violet-800">{selectionLabel}</span>
      <button type="button" className={btn} onClick={onToggleBold} title="Bold">
        <Bold className="h-3.5 w-3.5" />
      </button>
      <button type="button" className={btn} onClick={onToggleItalic} title="Italic">
        <Italic className="h-3.5 w-3.5" />
      </button>
      <button type="button" className={btn} onClick={onToggleUnderline} title="Underline">
        <Underline className="h-3.5 w-3.5" />
      </button>
      <span className="mx-1 h-4 w-px bg-slate-300" />
      <button type="button" className={btn} onClick={() => onAlign('left')} title="Align left">
        <AlignLeft className="h-3.5 w-3.5" />
      </button>
      <button type="button" className={btn} onClick={() => onAlign('center')} title="Align center">
        <AlignCenter className="h-3.5 w-3.5" />
      </button>
      <button type="button" className={btn} onClick={() => onAlign('right')} title="Align right">
        <AlignRight className="h-3.5 w-3.5" />
      </button>
      <div className="relative">
        <button type="button" className={btn} onClick={() => setColorOpen(!colorOpen)} title="Fill color">
          <Palette className="h-3.5 w-3.5" />
        </button>
        {colorOpen && (
          <div className="absolute left-0 top-full z-50 mt-1">
            <ColorPicker
              value={null}
              onChange={(c) => {
                onColor(c)
                setColorOpen(false)
              }}
              onClose={() => setColorOpen(false)}
            />
          </div>
        )}
      </div>

      {selectedColCount > 0 && onHideSelectedColumns && onDeleteSelectedColumns && (
        <>
          <span className="mx-1 h-4 w-px bg-slate-300" />
          <button
            type="button"
            className={btn}
            onClick={onHideSelectedColumns}
            title="Скрыть колонки"
          >
            <EyeOff className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className={btn + ' text-red-600 hover:bg-red-50'}
            onClick={onDeleteSelectedColumns}
            title="Удалить колонки"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </>
      )}
      {canMerge && (
        <>
          <span className="mx-1 h-4 w-px bg-slate-300" />
          <button type="button" className={btn} onClick={onMerge} title="Merge cells">
            <Merge className="h-3.5 w-3.5" />
            <span className="ml-1 text-[11px]">Merge</span>
          </button>
        </>
      )}
    </div>
  )
}
