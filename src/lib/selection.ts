export type SelectionMode = 'replace' | 'toggle' | 'range' | 'add'

export function updateSelection(
  prev: Set<string>,
  id: string,
  allIds: string[],
  mode: SelectionMode,
  anchorId: string | null,
): Set<string> {
  if (mode === 'add') {
    const next = new Set(prev)
    next.add(id)
    return next
  }

  if (mode === 'toggle') {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  }

  if (mode === 'range') {
    if (anchorId) {
      const a = allIds.indexOf(anchorId)
      const b = allIds.indexOf(id)
      if (a >= 0 && b >= 0) {
        const [lo, hi] = a < b ? [a, b] : [b, a]
        return new Set(allIds.slice(lo, hi + 1))
      }
    }
    const next = new Set(prev)
    next.add(id)
    return next
  }

  if (prev.size === 1 && prev.has(id)) return new Set()
  return new Set([id])
}

export function selectionModeFromMouseEvent(
  e: Pick<MouseEvent, 'shiftKey' | 'ctrlKey' | 'metaKey' | 'button'>,
  contextMenu = false,
  fromCheckbox = false,
): SelectionMode {
  if (contextMenu) return 'add'
  if (e.shiftKey) return 'range'
  if (fromCheckbox || e.ctrlKey || e.metaKey) return 'toggle'
  return 'replace'
}

export function cellKeysInRect(
  anchorRowId: string,
  anchorColId: string,
  endRowId: string,
  endColId: string,
  rowIds: string[],
  colIds: string[],
): Set<string> {
  const r0 = rowIds.indexOf(anchorRowId)
  const r1 = rowIds.indexOf(endRowId)
  const c0 = colIds.indexOf(anchorColId)
  const c1 = colIds.indexOf(endColId)
  if (r0 < 0 || r1 < 0 || c0 < 0 || c1 < 0) return new Set()
  const [rl, rh] = r0 < r1 ? [r0, r1] : [r1, r0]
  const [cl, ch] = c0 < c1 ? [c0, c1] : [c1, c0]
  const keys = new Set<string>()
  for (let r = rl; r <= rh; r++) {
    for (let c = cl; c <= ch; c++) {
      keys.add(`${rowIds[r]}:${colIds[c]}`)
    }
  }
  return keys
}

export function updateCellSelection(
  prev: Set<string>,
  key: string,
  allKeys: string[],
  mode: SelectionMode,
  anchorKey: string | null,
): Set<string> {
  if (mode === 'add') {
    const next = new Set(prev)
    next.add(key)
    return next
  }
  if (mode === 'toggle') {
    const next = new Set(prev)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    return next
  }
  if (mode === 'range' && anchorKey) {
    const { rowId: ar, colId: ac } = parseKey(anchorKey)
    const { rowId: er, colId: ec } = parseKey(key)
    const rowIds = [...new Set(allKeys.map((k) => parseKey(k).rowId))]
    const colIds = [...new Set(allKeys.map((k) => parseKey(k).colId))]
    return cellKeysInRect(ar, ac, er, ec, rowIds, colIds)
  }
  if (prev.size === 1 && prev.has(key)) return new Set()
  return new Set([key])
}

function parseKey(key: string) {
  const i = key.indexOf(':')
  return { rowId: key.slice(0, i), colId: key.slice(i + 1) }
}
