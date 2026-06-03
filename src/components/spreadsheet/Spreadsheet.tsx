import type React from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
  FilePlus,
  GripVertical,
  Plus,
} from 'lucide-react'
import type { Cell, CellAlign, Client, Column, MergedRegion, Proforma, Row } from '../../../shared/types'
import { cn, uid } from '../../lib/utils'
import { exportProformaToExcel, getSortedRows, getVisibleColumns } from '../../lib/excel'
import {
  updateSelection,
  selectionModeFromMouseEvent,
  updateCellSelection,
  cellKeysInRect,
} from '../../lib/selection'
import { colorStyle } from '../../lib/colors'
import {
  applyFormatPatch,
  cellKey,
  cellStyleClasses,
  collectTargetCellKeys,
  createMergeFromCells,
  emptyCell,
  getMergeAt,
  isHiddenByMerge,
  isMergeAnchor,
  normalizeCell,
  parseCellKey,
  toggleFormat,
} from '../../lib/cell-format'
import { DownloadNameModal } from './DownloadNameModal'
import { InvoicePreviewModal } from './InvoicePreviewModal'
import { FormatToolbar } from './FormatToolbar'
import { columnLetter } from '../../lib/spreadsheet-labels'
import { ui } from '../../lib/theme'

function clampCount(n: number) {
  return Math.max(1, Math.min(200, Math.floor(n) || 1))
}

interface SpreadsheetProps {
  proforma: Proforma
  onChange: (proforma: Proforma) => void
  compact?: boolean
  confirmDeletes?: boolean
  defaultColumnWidth?: number
  defaultRowsToAdd?: number
  defaultColsToAdd?: number
  showGridLines?: boolean
  onCreateProforma?: () => void
  client?: Client
  invoiceMeta?: { companyName: string; footer: string; currency: string }
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
  cellStyle,
  compact,
  selected,
  onChange,
  onMouseDown,
  onMouseEnter,
}: {
  cell: Cell
  cellStyle?: React.CSSProperties
  compact?: boolean
  selected: boolean
  onChange: (cell: Cell) => void
  onMouseDown: (e: React.MouseEvent) => void
  onMouseEnter: () => void
}) {
  const h = compact ? 'min-h-[28px]' : 'min-h-[34px]'
  const inputClass = cn(
    'w-full bg-transparent px-2 py-1 text-[12px] outline-none',
    cellStyleClasses(cell),
  )

  return (
    <div
      className={cn(
        'relative border-r border-slate-200',
        h,
        selected && 'ring-2 ring-inset ring-violet-400 z-[1]',
      )}
      style={cellStyle}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
    >
      {cell.type === 'notes' ? (
        <textarea
          value={cell.value}
          onChange={(e) => onChange({ ...cell, value: e.target.value })}
          rows={compact ? 1 : 2}
          className={cn(inputClass, 'resize-none')}
          onMouseDown={(e) => e.stopPropagation()}
        />
      ) : cell.type === 'date' ? (
        <input
          type="date"
          value={cell.value}
          onChange={(e) => onChange({ ...cell, value: e.target.value })}
          className={inputClass}
          onMouseDown={(e) => e.stopPropagation()}
        />
      ) : cell.type === 'number' ? (
        <input
          type="number"
          value={cell.value}
          onChange={(e) => onChange({ ...cell, value: e.target.value })}
          className={cn(inputClass, 'tabular-nums')}
          onMouseDown={(e) => e.stopPropagation()}
        />
      ) : (
        <input
          value={cell.value}
          onChange={(e) => onChange({ ...cell, value: e.target.value })}
          className={inputClass}
          onMouseDown={(e) => e.stopPropagation()}
        />
      )}
    </div>
  )
}

function SortableRow({
  row,
  columns,
  merges,
  selected,
  selectedCells,
  compact,
  rowNumber,
  onSelect,
  onRowHeaderEnter,
  onUpdateCell,
  onCellMouseDown,
  onCellMouseEnter,
}: {
  row: Row
  columns: Column[]
  merges?: MergedRegion[]
  selected: boolean
  selectedCells: Set<string>
  compact?: boolean
  rowNumber: number
  onSelect: (id: string, e: React.MouseEvent, contextMenu?: boolean) => void
  onRowHeaderEnter: () => void
  onUpdateCell: (rowId: string, colId: string, cell: Cell) => void
  onCellMouseDown: (rowId: string, colId: string, e: React.MouseEvent) => void
  onCellMouseEnter: (rowId: string, colId: string) => void
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
      onContextMenu={(e) => { e.preventDefault(); onSelect(row.id, e, true) }}
    >
      <td
        className={cn(
          'sticky left-0 z-10 w-9 cursor-default select-none border-r border-slate-200 bg-slate-100 p-0 text-center',
          selected && 'bg-violet-200 ring-2 ring-inset ring-violet-500',
        )}
        onMouseDown={(e) => onSelect(row.id, e)}
        onMouseEnter={onRowHeaderEnter}
      >
        <div className="flex flex-col items-center justify-center py-1">
          {selected && (
            <button
              type="button"
              className="mb-0.5 cursor-grab text-slate-500"
              {...attributes}
              {...listeners}
              onMouseDown={(e) => e.stopPropagation()}
              title="Переместить строку"
            >
              <GripVertical className="h-3 w-3" />
            </button>
          )}
          <span className="text-[11px] font-medium text-slate-600">{rowNumber}</span>
        </div>
      </td>
      {columns.map((col) => {
        if (isHiddenByMerge(merges, row.id, col.id)) return null
        const cell = normalizeCell(row.cells[col.id])
        const cellStyle = colorStyle(cell.color) ?? colorStyle(col.color)
        const key = cellKey(row.id, col.id)
        const merge = getMergeAt(merges, row.id, col.id)
        const span =
          merge && isMergeAnchor(merge, row.id, col.id)
            ? { rowSpan: merge.rowIds.length, colSpan: merge.colIds.length }
            : undefined
        return (
          <td
            key={col.id}
            className="p-0 align-top"
            style={{ width: col.width, maxWidth: col.width }}
            rowSpan={span?.rowSpan}
            colSpan={span?.colSpan}
          >
            <CellEditor
              cell={cell}
              cellStyle={cellStyle}
              compact={compact}
              selected={selectedCells.has(key)}
              onChange={(next) => onUpdateCell(row.id, col.id, next)}
              onMouseDown={(e) => onCellMouseDown(row.id, col.id, e)}
              onMouseEnter={() => onCellMouseEnter(row.id, col.id)}
            />
          </td>
        )
      })}
    </tr>
  )
}

function SortableColumnHeader({
  column,
  letter,
  selected,
  onMouseDown,
  onMouseEnter,
  onResize,
}: {
  column: Column
  letter: string
  selected: boolean
  onMouseDown: (e: React.MouseEvent) => void
  onMouseEnter: () => void
  onResize: (width: number) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: column.id,
  })

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
        'relative select-none border-r border-b border-slate-200 bg-slate-100 p-0',
        selected && 'bg-violet-200 ring-2 ring-inset ring-violet-500',
      )}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
    >
      <div className="flex items-center justify-center gap-0.5 py-1.5">
        {selected && (
          <button
            type="button"
            className="cursor-grab text-slate-500"
            {...attributes}
            {...listeners}
            onMouseDown={(e) => e.stopPropagation()}
            title="Переместить колонку"
          >
            <GripVertical className="h-3 w-3" />
          </button>
        )}
        <span className="text-[11px] font-semibold text-slate-700">{letter}</span>
      </div>
      <div
        className="absolute bottom-0 right-0 top-0 w-1.5 cursor-col-resize hover:bg-violet-400/60"
        onMouseDown={(e) => {
          e.preventDefault()
          e.stopPropagation()
          const startX = e.clientX
          const startW = column.width
          const onMove = (ev: MouseEvent) =>
            onResize(Math.max(48, Math.min(480, startW + ev.clientX - startX)))
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
  defaultRowsToAdd = 1,
  defaultColsToAdd = 1,
  showGridLines = true,
  onCreateProforma,
  client,
  invoiceMeta,
}: SpreadsheetProps) {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [selectedCols, setSelectedCols] = useState<Set<string>>(new Set())
  const [showExport, setShowExport] = useState(false)
  const [excelDownload, setExcelDownload] = useState<
    null | { scope: 'all' | 'selected' | 'visible' }
  >(null)
  const [invoiceOpen, setInvoiceOpen] = useState(false)
  const [rowCount, setRowCount] = useState(defaultRowsToAdd)
  const [colCount, setColCount] = useState(defaultColsToAdd)
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set())
  const cellAnchor = useRef<string | null>(null)
  const dragSelect = useRef(false)
  const rowDragSelect = useRef(false)
  const colDragSelect = useRef(false)

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
        name: '',
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

  const allCellKeys = useMemo(
    () => rows.flatMap((r) => columns.map((c) => cellKey(r.id, c.id))),
    [rows, columns],
  )

  function syncCellsFromCols(colSet: Set<string>) {
    const keys = new Set<string>()
    for (const colId of colSet) {
      for (const row of rows) keys.add(cellKey(row.id, colId))
    }
    setSelectedCells(keys)
  }

  function syncCellsFromRows(rowSet: Set<string>) {
    const keys = new Set<string>()
    for (const rowId of rowSet) {
      for (const col of columns) keys.add(cellKey(rowId, col.id))
    }
    setSelectedCells(keys)
  }


  function clearAllSelection() {
    setSelectedRows(new Set())
    setSelectedCols(new Set())
    setSelectedCells(new Set())
    rowAnchor.current = null
    colAnchor.current = null
    cellAnchor.current = null
    dragSelect.current = false
    rowDragSelect.current = false
    colDragSelect.current = false
  }

  function applyToTargetCells(mutator: (cell: Cell) => Cell) {
    const keys = collectTargetCellKeys(
      proforma,
      columns.map((c) => c.id),
      rows,
      selectedCells,
      selectedRows,
      selectedCols,
    )
    if (!keys.length) return
    const keySet = new Set(keys)
    patch({
      rows: proforma.rows.map((r) => {
        let changed = false
        const cells = { ...r.cells }
        for (const k of keySet) {
          const { rowId, colId } = parseCellKey(k)
          if (rowId !== r.id) continue
          cells[colId] = mutator(normalizeCell(cells[colId]))
          changed = true
        }
        return changed ? { ...r, cells } : r
      }),
    })
  }

  function onCellMouseDown(rowId: string, colId: string, e: React.MouseEvent) {
    if (e.button !== 0) return
    const key = cellKey(rowId, colId)
    const mode = selectionModeFromMouseEvent(e)
    if (mode === 'replace' || mode === 'range') {
      dragSelect.current = true
      cellAnchor.current = key
    }
    setSelectedCells((prev) => {
      const next = updateCellSelection(prev, key, allCellKeys, mode, cellAnchor.current)
      if (mode === 'replace' || mode === 'range') cellAnchor.current = key
      return next
    })
    if (mode === 'replace') {
      setSelectedRows(new Set())
      setSelectedCols(new Set())
    }
  }

  function onCellMouseEnter(rowId: string, colId: string) {
    if (!dragSelect.current || !cellAnchor.current) return
    const key = cellKey(rowId, colId)
    const { rowId: ar, colId: ac } = parseCellKey(cellAnchor.current)
    setSelectedCells(
      cellKeysInRect(
        ar,
        ac,
        rowId,
        colId,
        rows.map((r) => r.id),
        columns.map((c) => c.id),
      ),
    )
    void key
  }

  useEffect(() => {
    const up = () => {
      dragSelect.current = false
      rowDragSelect.current = false
      colDragSelect.current = false
    }
    window.addEventListener('mouseup', up)
    return () => window.removeEventListener('mouseup', up)
  }, [])

  function mergeSelectedCells() {
    const keys = collectTargetCellKeys(
      proforma,
      columns.map((c) => c.id),
      rows,
      selectedCells,
      selectedRows,
      selectedCols,
    )
    if (keys.length < 2) return
    const merge = createMergeFromCells(proforma, keys, rows, columns)
    if (!merge) return
    const merges = [...(proforma.merges || []), merge]
    patch({ merges })
    clearAllSelection()
  }

  function selectionSummary() {
    const parts: string[] = []
    if (selectedCells.size) parts.push(`${selectedCells.size} cells`)
    if (selectedRows.size) parts.push(`${selectedRows.size} rows`)
    if (selectedCols.size) parts.push(`${selectedCols.size} cols`)
    return parts.join(' · ') || 'Selection'
  }

  const rowAnchor = useRef<string | null>(null)
  const colAnchor = useRef<string | null>(null)

  function selectRow(id: string, e: React.MouseEvent, contextMenu = false) {
    e.preventDefault()
    const mode = selectionModeFromMouseEvent(e, contextMenu, false)
    const ids = rows.map((r) => r.id)
    const next = updateSelection(selectedRows, id, ids, mode, rowAnchor.current)
    if (mode === 'replace' || mode === 'range') rowAnchor.current = id
    if (mode === 'replace' || mode === 'range') rowDragSelect.current = true
    setSelectedRows(next)
    if (mode === 'replace') setSelectedCols(new Set())
    syncCellsFromRows(next)
  }

  function onRowHeaderEnter(id: string) {
    if (!rowDragSelect.current || !rowAnchor.current) return
    const ids = rows.map((r) => r.id)
    const a = ids.indexOf(rowAnchor.current)
    const b = ids.indexOf(id)
    if (a < 0 || b < 0) return
    const [lo, hi] = a < b ? [a, b] : [b, a]
    const next = new Set(ids.slice(lo, hi + 1))
    setSelectedRows(next)
    syncCellsFromRows(next)
  }

  function selectCol(id: string, e: React.MouseEvent, contextMenu = false) {
    e.preventDefault()
    const mode = selectionModeFromMouseEvent(e, contextMenu, false)
    const ids = columns.map((c) => c.id)
    const next = updateSelection(selectedCols, id, ids, mode, colAnchor.current)
    if (mode === 'replace' || mode === 'range') colAnchor.current = id
    if (mode === 'replace' || mode === 'range') colDragSelect.current = true
    setSelectedCols(next)
    if (mode === 'replace') setSelectedRows(new Set())
    syncCellsFromCols(next)
  }

  function onColHeaderEnter(id: string) {
    if (!colDragSelect.current || !colAnchor.current) return
    const ids = columns.map((c) => c.id)
    const a = ids.indexOf(colAnchor.current)
    const b = ids.indexOf(id)
    if (a < 0 || b < 0) return
    const [lo, hi] = a < b ? [a, b] : [b, a]
    const next = new Set(ids.slice(lo, hi + 1))
    setSelectedCols(next)
    syncCellsFromCols(next)
  }

  function selectAllGrid(e: React.MouseEvent) {
    e.preventDefault()
    const allR = new Set(rows.map((r) => r.id))
    const allC = new Set(columns.map((c) => c.id))
    setSelectedRows(allR)
    setSelectedCols(allC)
    setSelectedCells(new Set(allCellKeys))
  }


  function defaultExcelName(scope: string) {
    const base = proforma.number || 'proforma'
    const date = new Date().toISOString().slice(0, 10)
    return `${base}_${scope}_${date}.xlsx`
  }

  function runExcelExport(scope: 'all' | 'selected' | 'visible', filename: string) {
    const opts: { rowIds?: string[]; columnIds?: string[]; filename: string } = { filename }
    if (scope === 'selected') {
      const keys = collectTargetCellKeys(
        proforma,
        columns.map((c) => c.id),
        rows,
        selectedCells,
        selectedRows,
        selectedCols,
      )
      const rSet = new Set<string>()
      const cSet = new Set<string>()
      keys.forEach((k) => {
        const { rowId, colId } = parseCellKey(k)
        rSet.add(rowId)
        cSet.add(colId)
      })
      if (rSet.size) opts.rowIds = [...rSet]
      if (cSet.size) opts.columnIds = [...cSet]
    } else if (scope === 'visible') {
      opts.columnIds = columns.map((c) => c.id)
    }
    exportProformaToExcel(proforma, opts)
  }

  const rowIds = [...selectedRows]
  const colIds = [...selectedCols]
  const hasSelection =
    rowIds.length > 0 || colIds.length > 0 || selectedCells.size > 0
  const hasFormatSelection = hasSelection

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
          </>
        )}

        {hasSelection && (
          <button
            type="button"
            onClick={clearAllSelection}
            className={ui.btnSecondary + ' py-1.5 text-[11px]'}
          >
            Снять выделение
          </button>
        )}

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {client && (
            <button
              type="button"
              onClick={() => setInvoiceOpen(true)}
              className={ui.btnSecondary + ' py-1.5 text-[11px]'}
            >
              <FilePlus className="mr-1 inline h-3.5 w-3.5" />
              Create invoice
            </button>
          )}
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
                {(
                  [
                    ['Whole table', 'all' as const, false],
                    ['Selected', 'selected' as const, !hasSelection],
                    ['Visible columns', 'visible' as const, false],
                  ] as const
                ).map(([label, scope, disabled]) => (
                  <button
                    key={label}
                    type="button"
                    disabled={disabled}
                    className="block w-full rounded px-2 py-1.5 text-left text-[11px] hover:bg-slate-50 disabled:opacity-40"
                    onClick={() => {
                      setShowExport(false)
                      setExcelDownload({ scope })
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {hasFormatSelection && (
        <FormatToolbar
          selectionLabel={selectionSummary()}
          onClearSelection={clearAllSelection}
          onToggleBold={() =>
            applyToTargetCells((c) => toggleFormat(c, 'bold'))
          }
          onToggleItalic={() =>
            applyToTargetCells((c) => toggleFormat(c, 'italic'))
          }
          onToggleUnderline={() =>
            applyToTargetCells((c) => toggleFormat(c, 'underline'))
          }
          onAlign={(align: CellAlign) =>
            applyToTargetCells((c) => applyFormatPatch(c, { align }))
          }
          onColor={(color) =>
            applyToTargetCells((c) => ({ ...c, color }))
          }
          onMerge={mergeSelectedCells}
          canMerge={
            collectTargetCellKeys(
              proforma,
              columns.map((c) => c.id),
              rows,
              selectedCells,
              selectedRows,
              selectedCols,
            ).length >= 2
          }
          selectedColCount={colIds.length}
          onHideSelectedColumns={() => {
            patch({
              columns: proforma.columns.map((c) =>
                colIds.includes(c.id) ? { ...c, hidden: true } : c,
              ),
            })
            clearAllSelection()
          }}
          onDeleteSelectedColumns={() => deleteColumns(colIds)}
        />
      )}

      <div className="min-h-0 flex-1 overflow-auto">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onColDragEnd}>
          <table className={cn('border-collapse text-[12px]', showGridLines && 'border border-slate-200')} style={{ tableLayout: 'fixed' }}>
            <thead className="sticky top-0 z-20">
              <tr>
                <th
                  className="sticky left-0 z-30 w-9 cursor-pointer select-none border-b border-r border-slate-200 bg-slate-100"
                  onMouseDown={selectAllGrid}
                  title="Выделить всё"
                />
                <SortableContext items={columns.map((c) => c.id)} strategy={horizontalListSortingStrategy}>
                  {columns.map((col, colIndex) => (
                    <SortableColumnHeader
                      key={col.id}
                      column={col}
                      letter={columnLetter(colIndex)}
                      selected={selectedCols.has(col.id)}
                      onMouseDown={(e) => selectCol(col.id, e)}
                      onMouseEnter={() => onColHeaderEnter(col.id)}
                      onResize={(width) =>
                        patch({
                          columns: proforma.columns.map((c) =>
                            c.id === col.id ? { ...c, width } : c,
                          ),
                        })
                      }
                    />
                  ))}
                </SortableContext>
              </tr>
            </thead>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onRowDragEnd}>
              <SortableContext items={rows.map((r) => r.id)} strategy={verticalListSortingStrategy}>
                <tbody>
                  {rows.map((row, rowIndex) => (
                    <SortableRow
                      key={row.id}
                      row={row}
                      columns={columns}
                      merges={proforma.merges}
                      selected={selectedRows.has(row.id)}
                      selectedCells={selectedCells}
                      compact={compact}
                      rowNumber={rowIndex + 1}
                      onSelect={selectRow}
                      onRowHeaderEnter={() => onRowHeaderEnter(row.id)}
                      onUpdateCell={updateCell}
                      onCellMouseDown={onCellMouseDown}
                      onCellMouseEnter={onCellMouseEnter}
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

      {excelDownload && (
        <DownloadNameModal
          title="Export Excel"
          defaultName={defaultExcelName(excelDownload.scope)}
          extension=".xlsx"
          onClose={() => setExcelDownload(null)}
          onConfirm={(filename) => {
            runExcelExport(excelDownload.scope, filename)
            setExcelDownload(null)
          }}
        />
      )}
      {invoiceOpen && client && (
        <InvoicePreviewModal
          proforma={proforma}
          client={client}
          rowIds={
            rowIds.length
              ? rowIds
              : selectedCells.size
                ? [...new Set([...selectedCells].map((k) => parseCellKey(k).rowId))]
                : undefined
          }
          columnIds={
            colIds.length
              ? colIds
              : selectedCells.size
                ? [...new Set([...selectedCells].map((k) => parseCellKey(k).colId))]
                : undefined
          }
          initial={{
            companyName: invoiceMeta?.companyName || '',
            invoiceNumber: proforma.number,
            date: proforma.date,
            status: proforma.status,
            currency: invoiceMeta?.currency || '',
            footer: invoiceMeta?.footer || '',
            billToName: client.name,
            billToCompany: client.company,
            billToCountry: client.country,
            billToPhone: client.phone,
          }}
          onClose={() => setInvoiceOpen(false)}
        />
      )}
    </div>
  )
}