import { useCallback, useMemo, useState } from 'react'
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
  GripVertical,
  Plus,
  Trash2,
  Palette,
} from 'lucide-react'
import type {
  Cell,
  CellColor,
  CellType,
  Column,
  Proforma,
  Row,
} from '../../../shared/types'
import { cn, uid } from '../../lib/utils'
import { exportProformaToExcel, getSortedRows, getVisibleColumns } from '../../lib/excel'

const COLORS: { id: CellColor; class: string }[] = [
  { id: 'green', class: 'bg-emerald-500/20' },
  { id: 'red', class: 'bg-red-500/20' },
  { id: 'yellow', class: 'bg-yellow-500/20' },
  { id: 'blue', class: 'bg-blue-500/20' },
  { id: 'orange', class: 'bg-orange-500/20' },
  { id: 'purple', class: 'bg-purple-500/20' },
]

const CELL_TYPES: CellType[] = ['text', 'number', 'date', 'status', 'notes']

interface SpreadsheetProps {
  proforma: Proforma
  onChange: (proforma: Proforma) => void
}

function emptyCell(): Cell {
  return { value: '', type: 'text', color: null }
}

function SortableRow({
  row,
  columns,
  selected,
  onSelect,
  onUpdateCell,
  onContext,
}: {
  row: Row
  columns: Column[]
  selected: boolean
  onSelect: (id: string, multi: boolean) => void
  onUpdateCell: (rowId: string, colId: string, cell: Cell) => void
  onContext: (rowId: string, e: React.MouseEvent) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: row.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={cn(
        'group border-t border-[#1f1f27]',
        selected && 'bg-violet-500/5',
      )}
      onContextMenu={(e) => onContext(row.id, e)}
    >
      <td className="w-8 px-1 py-0">
        <div className="flex items-center gap-0.5">
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => onSelect(row.id, (e.nativeEvent as MouseEvent).shiftKey)}
            className="rounded border-[#3f3f46]"
          />
          <button
            type="button"
            className="cursor-grab text-[#52525b] opacity-0 group-hover:opacity-100"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
      {columns.map((col) => {
        const cell = row.cells[col.id] || emptyCell()
        return (
          <td key={col.id} className="p-0" style={{ minWidth: col.width }}>
            <CellEditor
              cell={cell}
              colorClass={COLORS.find((c) => c.id === cell.color)?.class}
              onChange={(next) => onUpdateCell(row.id, col.id, next)}
            />
          </td>
        )
      })}
    </tr>
  )
}

function CellEditor({
  cell,
  colorClass,
  onChange,
}: {
  cell: Cell
  colorClass?: string
  onChange: (cell: Cell) => void
}) {
  const [menu, setMenu] = useState(false)

  return (
    <div
      className={cn(
        'relative min-h-[32px] border-r border-[#1f1f27]',
        colorClass,
      )}
    >
      {cell.type === 'notes' ? (
        <textarea
          value={cell.value}
          onChange={(e) => onChange({ ...cell, value: e.target.value })}
          rows={2}
          className="w-full resize-none bg-transparent px-2 py-1.5 text-[12px] outline-none"
        />
      ) : cell.type === 'date' ? (
        <input
          type="date"
          value={cell.value}
          onChange={(e) => onChange({ ...cell, value: e.target.value })}
          className="w-full bg-transparent px-2 py-1.5 text-[12px] outline-none"
        />
      ) : cell.type === 'number' ? (
        <input
          type="number"
          value={cell.value}
          onChange={(e) => onChange({ ...cell, value: e.target.value })}
          className="w-full bg-transparent px-2 py-1.5 text-[12px] tabular-nums outline-none"
        />
      ) : (
        <input
          value={cell.value}
          onChange={(e) => onChange({ ...cell, value: e.target.value })}
          className="w-full bg-transparent px-2 py-1.5 text-[12px] outline-none"
        />
      )}
      <button
        type="button"
        onClick={() => setMenu(!menu)}
        className="absolute right-0 top-0 p-1 text-[#52525b] opacity-0 hover:text-white focus:opacity-100 group-hover:opacity-60"
      >
        <Palette className="h-3 w-3" />
      </button>
      {menu && (
        <div className="absolute right-0 top-full z-30 rounded-lg border border-[#27272f] bg-[#141419] p-2 shadow-xl">
          <p className="mb-1 text-[10px] text-[#52525b]">Color</p>
          <div className="mb-2 flex gap-1">
            {COLORS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  onChange({ ...cell, color: c.id })
                  setMenu(false)
                }}
                className={cn('h-4 w-4 rounded', c.class, 'ring-1 ring-white/10')}
              />
            ))}
            <button
              type="button"
              onClick={() => {
                onChange({ ...cell, color: null })
                setMenu(false)
              }}
              className="px-1 text-[10px] text-[#71717a]"
            >
              Clear
            </button>
          </div>
          <p className="mb-1 text-[10px] text-[#52525b]">Type</p>
          <select
            value={cell.type}
            onChange={(e) =>
              onChange({ ...cell, type: e.target.value as CellType })
            }
            className="w-full rounded border border-[#27272f] bg-[#09090b] px-1 py-0.5 text-[11px]"
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

function SortableHeader({
  column,
  onRename,
  onResize,
  onHide,
  onDelete,
}: {
  column: Column
  onRename: (name: string) => void
  onResize: (width: number) => void
  onHide: () => void
  onDelete: () => void
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
        minWidth: column.width,
      }}
      className="group relative border-r border-[#1f1f27] bg-[#0c0c0f] px-0 py-0 text-left"
    >
      <div className="flex items-center gap-1 px-2 py-2">
        <button
          type="button"
          className="cursor-grab text-[#52525b] opacity-0 group-hover:opacity-100"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-3 w-3" />
        </button>
        <input
          value={column.name}
          onChange={(e) => onRename(e.target.value)}
          className="min-w-0 flex-1 bg-transparent text-[11px] font-medium uppercase tracking-wide text-[#a1a1aa] outline-none"
        />
        <button
          type="button"
          onClick={onHide}
          className="text-[#52525b] opacity-0 hover:text-white group-hover:opacity-100"
        >
          <EyeOff className="h-3 w-3" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="text-[#52525b] opacity-0 hover:text-red-400 group-hover:opacity-100"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
      <div
        className="absolute bottom-0 right-0 top-0 w-1 cursor-col-resize hover:bg-violet-500/50"
        onMouseDown={(e) => {
          e.preventDefault()
          const startX = e.clientX
          const startW = column.width
          const onMove = (ev: MouseEvent) => {
            onResize(Math.max(60, startW + ev.clientX - startX))
          }
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

export function Spreadsheet({ proforma, onChange }: SpreadsheetProps) {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [showExport, setShowExport] = useState(false)

  const columns = useMemo(
    () => getVisibleColumns(proforma.columns),
    [proforma.columns],
  )
  const rows = useMemo(() => getSortedRows(proforma.rows), [proforma.rows])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const patch = useCallback(
    (partial: Partial<Proforma>) => onChange({ ...proforma, ...partial }),
    [proforma, onChange],
  )

  function addRow() {
    const order = proforma.rows.length
    const cells: Record<string, Cell> = {}
    proforma.columns.forEach((col) => {
      cells[col.id] = emptyCell()
    })
    const row: Row = { id: uid('row'), cells, order }
    patch({ rows: [...proforma.rows, row] })
  }

  function deleteRows(ids: string[]) {
    patch({ rows: proforma.rows.filter((r) => !ids.includes(r.id)) })
    setSelectedRows(new Set())
  }

  function duplicateRows(ids: string[]) {
    const toDup = proforma.rows.filter((r) => ids.includes(r.id))
    const maxOrder = Math.max(0, ...proforma.rows.map((r) => r.order))
    const copies = toDup.map((r, i) => ({
      ...r,
      id: uid('row'),
      order: maxOrder + i + 1,
      cells: Object.fromEntries(
        Object.entries(r.cells).map(([k, v]) => [k, { ...v }]),
      ),
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

  function addColumn() {
    const order = proforma.columns.length
    const col: Column = {
      id: uid('col'),
      name: 'New column',
      width: 140,
      hidden: false,
      order,
    }
    patch({
      columns: [...proforma.columns, col],
      rows: proforma.rows.map((r) => ({
        ...r,
        cells: { ...r.cells, [col.id]: emptyCell() },
      })),
    })
  }

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
    patch({
      rows: reordered.map((r, i) => ({ ...r, order: i })),
    })
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

  function selectRow(id: string, multi: boolean) {
    setSelectedRows((prev) => {
      const next = new Set(multi ? prev : [])
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectedIds = [...selectedRows]

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-[#1f1f27] px-3 py-2">
        <button
          type="button"
          onClick={addRow}
          className="flex items-center gap-1 rounded-md bg-[#1a1a22] px-2.5 py-1.5 text-[11px] hover:bg-[#27272f]"
        >
          <Plus className="h-3 w-3" /> Row
        </button>
        <button
          type="button"
          onClick={addColumn}
          className="flex items-center gap-1 rounded-md bg-[#1a1a22] px-2.5 py-1.5 text-[11px] hover:bg-[#27272f]"
        >
          <Plus className="h-3 w-3" /> Column
        </button>
        {selectedIds.length > 0 && (
          <>
            <button
              type="button"
              onClick={() => duplicateRows(selectedIds)}
              className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] text-[#a1a1aa] hover:bg-[#1a1a22]"
            >
              <Copy className="h-3 w-3" /> Duplicate ({selectedIds.length})
            </button>
            <button
              type="button"
              onClick={() => deleteRows(selectedIds)}
              className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] text-red-400 hover:bg-red-500/10"
            >
              <Trash2 className="h-3 w-3" /> Delete
            </button>
          </>
        )}
        <div className="ml-auto relative">
          <button
            type="button"
            onClick={() => setShowExport(!showExport)}
            className="flex items-center gap-1 rounded-md bg-violet-600/20 px-2.5 py-1.5 text-[11px] text-violet-300 hover:bg-violet-600/30"
          >
            <Download className="h-3 w-3" /> Export Excel
          </button>
          {showExport && (
            <div className="absolute right-0 top-full z-40 mt-1 w-48 rounded-lg border border-[#27272f] bg-[#141419] p-1 shadow-xl">
              <button
                type="button"
                className="block w-full rounded px-2 py-1.5 text-left text-[11px] hover:bg-[#1a1a22]"
                onClick={() => {
                  exportProformaToExcel(proforma)
                  setShowExport(false)
                }}
              >
                Whole table
              </button>
              <button
                type="button"
                disabled={selectedIds.length === 0}
                className="block w-full rounded px-2 py-1.5 text-left text-[11px] hover:bg-[#1a1a22] disabled:opacity-40"
                onClick={() => {
                  exportProformaToExcel(proforma, { rowIds: selectedIds })
                  setShowExport(false)
                }}
              >
                Selected rows
              </button>
              <button
                type="button"
                disabled={columns.length === 0}
                className="block w-full rounded px-2 py-1.5 text-left text-[11px] hover:bg-[#1a1a22] disabled:opacity-40"
                onClick={() => {
                  const colIds = columns.map((c) => c.id)
                  exportProformaToExcel(proforma, { columnIds: colIds })
                  setShowExport(false)
                }}
              >
                Visible columns
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onColDragEnd}
        >
          <table className="w-max min-w-full border-collapse">
            <thead>
              <tr>
                <th className="w-8 bg-[#0c0c0f]" />
                <SortableContext
                  items={columns.map((c) => c.id)}
                  strategy={horizontalListSortingStrategy}
                >
                  {columns.map((col) => (
                    <SortableHeader
                      key={col.id}
                      column={col}
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
                      onHide={() =>
                        patch({
                          columns: proforma.columns.map((c) =>
                            c.id === col.id ? { ...c, hidden: true } : c,
                          ),
                        })
                      }
                      onDelete={() => {
                        if (!confirm('Delete column and its data?')) return
                        patch({
                          columns: proforma.columns.filter((c) => c.id !== col.id),
                          rows: proforma.rows.map((r) => {
                            const cells = { ...r.cells }
                            delete cells[col.id]
                            return { ...r, cells }
                          }),
                        })
                      }}
                    />
                  ))}
                </SortableContext>
              </tr>
            </thead>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={onRowDragEnd}
            >
              <SortableContext
                items={rows.map((r) => r.id)}
                strategy={verticalListSortingStrategy}
              >
                <tbody>
                  {rows.map((row) => (
                    <SortableRow
                      key={row.id}
                      row={row}
                      columns={columns}
                      selected={selectedRows.has(row.id)}
                      onSelect={selectRow}
                      onUpdateCell={updateCell}
                      onContext={(id, e) => {
                        e.preventDefault()
                        selectRow(id, true)
                      }}
                    />
                  ))}
                </tbody>
              </SortableContext>
            </DndContext>
          </table>
        </DndContext>
        {rows.length === 0 && (
          <p className="py-12 text-center text-[12px] text-[#52525b]">
            No rows yet. Click &quot;Row&quot; to add your first line item.
          </p>
        )}
      </div>
    </div>
  )
}
