import { useCallback, useMemo, useRef, useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Copy,
  Download,
  EyeOff,
  FilePlus,
  GripVertical,
  Plus,
  Trash2,
  Palette,
} from 'lucide-react'
import type { Cell, CellColor, CellType, Column, Proforma, Row } from '../../../shared/types'
import { cn, uid } from '../../lib/utils'
import { exportProformaToExcel, getSortedRows, getVisibleColumns } from '../../lib/excel'
import { cellColorClass, ui } from '../../lib/theme'
import { COLOR_OPTIONS, CELL_TYPES } from './spreadsheet-constants'

function emptyCell(): Cell {
  return { value: '', type: 'text', color: null }
}

function clampCount(n: number) {
  return Math.max(1, Math.min(200, Math.floor(n) || 1))
}

interface SpreadsheetProps {
  proforma: Proforma
  onChange: (proforma: Proforma) => void
  compact?: boolean
  confirmDeletes?: boolean
  defaultColumnWidth?: number
  onCreateProforma?: () => void
}

function CountButton({
  label,
  count,
  onCountChange,
  onAction,
}: {
  label: string
  count: number
  onCountChange: (n: number) => void
  onAction: () => void
}) {
  return (
    <div className="flex items-center overflow-hidden rounded-md border border-slate-200 bg-white">
      <button
        type="button"
        onClick={onAction}
        className="flex items-center gap-1 px-2 py-1.5 text-[11px] text-slate-700 hover:bg-slate-50"
      >
        <Plus className="h-3 w-3" />
        {label}
      </button>
      <input
        type="number"
        min={1}
        max={200}
        value={count}
        onChange={(e) => onCountChange(Number(e.target.value))}
        className="w-10 border-l border-slate-200 bg-slate-50 px-1 py-1.5 text-center text-[11px] outline-none"
        title={`Number of ${label}s to add`}
      />
    </div>
  )
}

function CellEditor({
  cell,
  colorClass,
  compact,
  onChange,
}: {
  cell: Cell
  colorClass?: string
  compact?: boolean
  onChange: (cell: Cell) => void
}) {
  const [menu, setMenu] = useState(false)
  const h = compact ? 'min-h-[28px]' : 'min-h-[34px]'

  return (
    <div className={cn('group/cell relative border-r border-slate-200', h, colorClass)}>
      {cell.type === 'notes' ? (
        <textarea
          value={cell.value}
          onChange={(e) => onChange({ ...cell, value: e.target.value })}
          rows={compact ? 1 : 2}
          className="w-full resize-none bg-transparent px-2 py-1 text-[12px] outline-none"
        />
      ) : cell.type === 'date' ? (
        <input
          type="date"
          value={cell.value}
          onChange={(e) => onChange({ ...cell, value: e.target.value })}
          className="w-full bg-transparent px-2 py-1 text-[12px] outline-none"
        />
      ) : cell.type === 'number' ? (
        <input
          type="number"
          value={cell.value}
          onChange={(e) => onChange({ ...cell, value: e.target.value })}
          className="w-full bg-transparent px-2 py-1 text-[12px] tabular-nums outline-none"
        />
      ) : (
        <input
          value={cell.value}
          onChange={(e) => onChange({ ...cell, value: e.target.value })}
          className="w-full bg-transparent px-2 py-1 text-[12px] outline-none"
        />
      )}
      <button
        type="button"
        onClick={() => setMenu(!menu)}
        className="absolute right-0.5 top-0.5 rounded p-0.5 text-slate-400 opacity-0 hover:bg-white hover:text-slate-700 group-hover/cell:opacity-100"
      >
        <Palette className="h-3 w-3" />
      </button>
      {menu && (
        <div
          className={`absolute right-0 top-full z-50 mt-0.5 p-2 shadow-lg ${ui.card}`}
          onMouseLeave={() => setMenu(false)}
        >
          <p className="mb-1 text-[10px] text-slate-400">Color</p>
          <div className="mb-2 flex flex-wrap gap-1">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  onChange({ ...cell, color: c.id })
                  setMenu(false)
                }}
                className={cn('h-5 w-5 rounded border border-slate-200', c.class)}
              />
            ))}
            <button
              type="button"
              onClick={() => {
                onChange({ ...cell, color: null })
                setMenu(false)
              }}
              className="px-1 text-[10px] text-slate-500"
            >
              Clear
            </button>
          </div>
          <select
            value={cell.type}
            onChange={(e) => onChange({ ...cell, type: e.target.value as CellType })}
            className="w-full rounded border border-slate-200 px-1 py-0.5 text-[11px]"
          >
            {CELL_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}

function SortableRow({
  row,
  columns,
  selected,
  compact,
  onSelect,
  onUpdateCell,
}: {
  row: Row
  columns: Column[]
  selected: boolean
  compact?: boolean
  onSelect: (id: string, multi: boolean) => void
  onUpdateCell: (rowId: string, colId: string, cell: Cell) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: row.id })

  return (
    <tr
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      className={cn('group border-t border-slate-200', selected && 'bg-violet-50/80')}
    >
      <td className="sticky left-0 z-10 w-10 border-r border-slate-200 bg-white px-1 py-0">
        <div className="flex items-center gap-0.5">
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => onSelect(row.id, (e.nativeEvent as MouseEvent).shiftKey)}
            className="rounded border-slate-300"
          />
          <button
            type="button"
            className="cursor-grab text-slate-400 opacity-0 group-hover:opacity-100"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
      {columns.map((col) => {
        const cell = row.cells[col.id] || emptyCell()
        const colBg = col.color ? cellColorClass[col.color] : undefined
        const cellBg = cell.color ? cellColorClass[cell.color] : colBg
        return (
          <td
            key={col.id}
            className="p-0 align-top"
            style={{ width: col.width, maxWidth: col.width }}
          >
            <CellEditor
              cell={cell}
              colorClass={cellBg}
              compact={compact}
              onChange={(next) => onUpdateCell(row.id, col.id, next)}
            />
          </td>
        )
      })}
    </tr>
  )
}

function SortableHeader({
  column,
  selected,
  onSelect,
  onRename,
  onResize,
  onColor,
  onHide,
  onDelete,
}: {
  column: Column
  selected: boolean
  onSelect: (id: string, multi: boolean) => void
  onRename: (name: string) => void
  onResize: (width: number) => void
  onColor: (color: CellColor) => void
  onHide: () => void
  onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: column.id,
  })
  const [colorOpen, setColorOpen] = useState(false)
  const headerBg = column.color ? cellColorClass[column.color] : 'bg-slate-50'

  return (
    <th
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        width: column.width,
        maxWidth: column.width,
      }}
      className={cn(
        'group relative border-r border-slate-200 p-0 text-left',
        headerBg,
        selected && 'ring-2 ring-inset ring-violet-400',
      )}
    >
      <div className="flex items-center gap-0.5 px-1 py-1.5">
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => onSelect(column.id, (e.nativeEvent as MouseEvent).shiftKey)}
          className="shrink-0 rounded border-slate-300"
        />
        <button
          type="button"
          className="cursor-grab shrink-0 text-slate-400 opacity-0 group-hover:opacity-100"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-3 w-3" />
        </button>
        <input
          value={column.name}
          onChange={(e) => onRename(e.target.value)}
          className="min-w-0 flex-1 bg-transparent text-[10px] font-semibold uppercase tracking-wide text-slate-600 outline-none"
        />
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setColorOpen(!colorOpen)}
            className="rounded p-0.5 text-slate-400 hover:text-slate-700"
          >
            <Palette className="h-3 w-3" />
          </button>
          {colorOpen && (
            <div className={`absolute right-0 top-full z-50 mt-1 flex gap-1 p-1.5 ${ui.card}`}>
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    onColor(c.id)
                    setColorOpen(false)
                  }}
                  className={cn('h-4 w-4 rounded border border-slate-200', c.class)}
                />
              ))}
              <button
                type="button"
                onClick={() => {
                  onColor(null)
                  setColorOpen(false)
                }}
                className="px-1 text-[9px] text-slate-500"
              >
                ×
              </button>
            </div>
          )}
        </div>
        <button type="button" onClick={onHide} className="shrink-0 text-slate-400 hover:text-slate-600">
          <EyeOff className="h-3 w-3" />
        </button>
        <button type="button" onClick={onDelete} className="shrink-0 text-slate-400 hover:text-red-500">
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
      <div
        className="absolute bottom-0 right-0 top-0 w-1.5 cursor-col-resize hover:bg-violet-400/60"
        onMouseDown={(e) => {
          e.preventDefault()
          const startX = e.clientX
          const startW = column.width
          const onMove = (ev: MouseEvent) => onResize(Math.max(48, Math.min(480, startW + ev.clientX - startX)))
          const onUp = () => {
            window.removeEventListener('mousemove', onMove)
            window.removeEventListener('mouseup', onUp)
          }
          window.addEventListener('mousemove', onMove)
          window.addEventListener('mouseup', onUp)
        }}
      />
    </th>
  )
}

export function Spreadsheet({
  proforma,
  onChange,
  compact,
  confirmDeletes = true,
  defaultColumnWidth = 120,
  onCreateProforma,
}: SpreadsheetProps) {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [selectedCols, setSelectedCols] = useState<Set<string>>(new Set())
  const [showExport, setShowExport] = useState(false)
  const [rowCount, setRowCount] = useState(1)
  const [colCount, setColCount] = useState(1)
  const lastColClick = useRef<string | null>(null)

  const columns = useMemo(() => getVisibleColumns(proforma.columns), [proforma.columns])
  const rows = useMemo(() => getSortedRows(proforma.rows), [proforma.rows])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const patch = useCallback(
    (partial: Partial<Proforma>) => onChange({ ...proforma, ...partial }),
    [proforma, onChange],
  )

  function confirm(msg: string) {
    if (!confirmDeletes) return true
    return window.confirm(msg)
  }

  function addRows(n = rowCount) {
    const count = clampCount(n)
    const base = proforma.rows.length
    const newRows: Row[] = []
    for (let i = 0; i < count; i++) {
      const cells: Record<string, Cell> = {}
      proforma.columns.forEach((col) => {
        cells[col.id] = emptyCell()
      })
      newRows.push({ id: uid('row'), cells, order: base + i })
    }
    patch({ rows: [...proforma.rows, ...newRows] })
  }

  function addColumns(n = colCount) {
    const count = clampCount(n)
    const start = proforma.columns.length
    const newCols: Column[] = []
    for (let i = 0; i < count; i++) {
      const col: Column = {
        id: uid('col'),
        name: `Column ${start + i + 1}`,
        width: defaultColumnWidth,
        hidden: false,
        order: start + i,
        color: null,
      }
      newCols.push(col)
    }
    patch({
      columns: [...proforma.columns, ...newCols],
      rows: proforma.rows.map((r) => {
        const cells = { ...r.cells }
        newCols.forEach((c) => {
          cells[c.id] = emptyCell()
        })
        return { ...r, cells }
      }),
    })
  }

  function deleteRows(ids: string[]) {
    if (!ids.length) return
    if (!confirm(`Delete ${ids.length} row(s)?`)) return
    patch({ rows: proforma.rows.filter((r) => !ids.includes(r.id)) })
    setSelectedRows(new Set())
  }

  function deleteColumns(ids: string[]) {
    if (!ids.length) return
    if (!confirm(`Delete ${ids.length} column(s)?`)) return
    patch({
      columns: proforma.columns.filter((c) => !ids.includes(c.id)),
      rows: proforma.rows.map((r) => {
        const cells = { ...r.cells }
        ids.forEach((id) => delete cells[id])
        return { ...r, cells }
      }),
    })
    setSelectedCols(new Set())
  }

  function duplicateRows(ids: string[]) {
    const toDup = proforma.rows.filter((r) => ids.includes(r.id))
    const maxOrder = Math.max(0, ...proforma.rows.map((r) => r.order))
    const copies = toDup.map((r, i) => ({
      ...r,
      id: uid('row'),
      order: maxOrder + i + 1,
      cells: Object.fromEntries(Object.entries(r.cells).map(([k, v]) => [k, { ...v }])),
    }))
    patch({ rows: [...proforma.rows, ...copies] })
  }

  function updateCell(rowId: string, colId: string, cell: Cell) {
    patch({
      rows: proforma.rows.map((r) =>
        r.id === rowId ? { ...r, cells: { ...r.cells, [colId]: cell } } : r,
      ),
    })
  }

  function selectRow(id: string, multi: boolean) {
    setSelectedRows((prev) => {
      const next = new Set(multi ? prev : [])
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectCol(id: string, multi: boolean) {
    setSelectedCols((prev) => {
      let next = new Set(multi ? prev : [])
      if (multi && lastColClick.current && columns.length) {
        const ids = columns.map((c) => c.id)
        const a = ids.indexOf(lastColClick.current)
        const b = ids.indexOf(id)
        if (a >= 0 && b >= 0) {
          const [lo, hi] = a < b ? [a, b] : [b, a]
          next = new Set([...next, ...ids.slice(lo, hi + 1)])
        }
      }
      if (next.has(id)) next.delete(id)
      else next.add(id)
      lastColClick.current = id
      return next
    })
  }

  function selectAllCols() {
    if (selectedCols.size === columns.length) setSelectedCols(new Set())
    else setSelectedCols(new Set(columns.map((c) => c.id)))
  }

  const rowIds = [...selectedRows]
  const colIds = [...selectedCols]

  function onRowDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const sorted = getSortedRows(proforma.rows)
    const oldIndex = sorted.findIndex((r) => r.id === active.id)
    const newIndex = sorted.findIndex((r) => r.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    const reordered = [...sorted]
    const [moved] = reordered.splice(oldIndex, 1)
    reordered.splice(newIndex, 0, moved)
    patch({ rows: reordered.map((r, i) => ({ ...r, order: i })) })
  }

  function onColDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const visible = getVisibleColumns(proforma.columns)
    const oldIndex = visible.findIndex((c) => c.id === active.id)
    const newIndex = visible.findIndex((c) => c.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    const reordered = [...visible]
    const [moved] = reordered.splice(oldIndex, 1)
    reordered.splice(newIndex, 0, moved)
    const orderMap = new Map(reordered.map((c, i) => [c.id, i]))
    patch({
      columns: proforma.columns.map((c) => ({
        ...c,
        order: orderMap.has(c.id) ? orderMap.get(c.id)! : c.order + 100,
      })),
    })
  }

  return (
    <div className="flex h-full flex-col bg-white">
      <div
        className={`flex shrink-0 flex-wrap items-center gap-2 border-b ${ui.border} bg-slate-50/80 px-3 py-2`}
      >
        <CountButton label="Row" count={rowCount} onCountChange={setRowCount} onAction={() => addRows()} />
        <CountButton
          label="Column"
          count={colCount}
          onCountChange={setColCount}
          onAction={() => addColumns()}
        />

        {rowIds.length > 0 && (
          <>
            <button type="button" onClick={() => duplicateRows(rowIds)} className={ui.btnSecondary + ' py-1.5 text-[11px]'}>
              <Copy className="mr-1 inline h-3 w-3" />
              Rows ({rowIds.length})
            </button>
            <button
              type="button"
              onClick={() => deleteRows(rowIds)}
              className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-[11px] text-red-700 hover:bg-red-100"
            >
              Delete rows
            </button>
          </>
        )}

        {colIds.length > 0 && (
          <>
            <button
              type="button"
              onClick={() => deleteColumns(colIds)}
              className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-[11px] text-red-700"
            >
              Delete cols ({colIds.length})
            </button>
            <span className="text-[11px] text-slate-500">{colIds.length} column(s) selected</span>
          </>
        )}

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {onCreateProforma && (
            <button type="button" onClick={onCreateProforma} className={ui.btnSecondary + ' py-1.5 text-[11px]'}>
              <FilePlus className="mr-1 inline h-3.5 w-3.5" />
              New proforma
            </button>
          )}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowExport(!showExport)}
              className={ui.btnPrimary + ' py-1.5 text-[11px]'}
            >
              <Download className="mr-1 inline h-3.5 w-3.5" />
              Export Excel
            </button>
            {showExport && (
              <div className={`absolute right-0 top-full z-40 mt-1 w-52 p-1 ${ui.card}`}>
                {[
                  ['Whole table', () => exportProformaToExcel(proforma)],
                  ['Selected rows', () => exportProformaToExcel(proforma, { rowIds }), rowIds.length === 0],
                  ['Selected columns', () => exportProformaToExcel(proforma, { columnIds: colIds }), colIds.length === 0],
                  ['Visible columns', () => exportProformaToExcel(proforma, { columnIds: columns.map((c) => c.id) })],
                ].map(([label, fn, disabled]) => (
                  <button
                    key={label as string}
                    type="button"
                    disabled={!!disabled}
                    className="block w-full rounded px-2 py-1.5 text-left text-[11px] hover:bg-slate-50 disabled:opacity-40"
                    onClick={() => {
                      ;(fn as () => void)()
                      setShowExport(false)
                    }}
                  >
                    {label as string}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onColDragEnd}>
          <table className="border-collapse text-[12px]" style={{ tableLayout: 'fixed' }}>
            <thead className="sticky top-0 z-20">
              <tr>
                <th className="sticky left-0 z-30 w-10 border-b border-r border-slate-200 bg-slate-100">
                  <input
                    type="checkbox"
                    checked={columns.length > 0 && selectedCols.size === columns.length}
                    onChange={selectAllCols}
                    className="m-2 rounded border-slate-300"
                    title="Select all columns"
                  />
                </th>
                <SortableContext items={columns.map((c) => c.id)} strategy={horizontalListSortingStrategy}>
                  {columns.map((col) => (
                    <SortableHeader
                      key={col.id}
                      column={col}
                      selected={selectedCols.has(col.id)}
                      onSelect={selectCol}
                      onRename={(name) =>
                        patch({
                          columns: proforma.columns.map((c) =>
                            c.id === col.id ? { ...c, name } : c,
                          ),
                        })
                      }
                      onResize={(width) =>
                        patch({
                          columns: proforma.columns.map((c) =>
                            c.id === col.id ? { ...c, width } : c,
                          ),
                        })
                      }
                      onColor={(color) =>
                        patch({
                          columns: proforma.columns.map((c) =>
                            c.id === col.id ? { ...c, color } : c,
                          ),
                        })
                      }
                      onHide={() =>
                        patch({
                          columns: proforma.columns.map((c) =>
                            c.id === col.id ? { ...c, hidden: true } : c,
                          ),
                        })
                      }
                      onDelete={() => {
                        if (!confirm('Delete this column?')) return
                        deleteColumns([col.id])
                      }}
                    />
                  ))}
                </SortableContext>
              </tr>
            </thead>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onRowDragEnd}>
              <SortableContext items={rows.map((r) => r.id)} strategy={verticalListSortingStrategy}>
                <tbody>
                  {rows.map((row) => (
                    <SortableRow
                      key={row.id}
                      row={row}
                      columns={columns}
                      selected={selectedRows.has(row.id)}
                      compact={compact}
                      onSelect={selectRow}
                      onUpdateCell={updateCell}
                    />
                  ))}
                </tbody>
              </SortableContext>
            </DndContext>
          </table>
        </DndContext>
        {rows.length === 0 && (
          <p className="py-12 text-center text-[12px] text-slate-400">
            No rows yet. Set a number and click + Row.
          </p>
        )}
      </div>
    </div>
  )
}
