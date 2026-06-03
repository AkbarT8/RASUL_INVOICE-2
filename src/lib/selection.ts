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

  if (mode === 'range' && anchorId) {
    const a = allIds.indexOf(anchorId)
    const b = allIds.indexOf(id)
    if (a >= 0 && b >= 0) {
      const [lo, hi] = a < b ? [a, b] : [b, a]
      return new Set(allIds.slice(lo, hi + 1))
    }
  }

  if (prev.size === 1 && prev.has(id)) return new Set()
  return new Set([id])
}

export function selectionModeFromMouseEvent(
  e: Pick<MouseEvent, 'shiftKey' | 'ctrlKey' | 'metaKey' | 'button'>,
  contextMenu = false,
): SelectionMode {
  if (contextMenu) return 'add'
  if (e.shiftKey) return 'range'
  if (e.ctrlKey || e.metaKey) return 'toggle'
  return 'replace'
}
