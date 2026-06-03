export type OpenTab =
  | { id: string; type: 'client'; clientId: string }
  | { id: string; type: 'proforma'; clientId: string; proformaId: string }

const TABS_KEY = 'proforma_open_tabs'

type TabInput =
  | { type: 'client'; clientId: string }
  | { type: 'proforma'; clientId: string; proformaId: string }

export function tabKey(tab: TabInput): string {
  if (tab.type === 'client') return `c:${tab.clientId}`
  return `p:${tab.clientId}:${tab.proformaId}`
}

export function loadOpenTabs(): OpenTab[] {
  try {
    const raw = localStorage.getItem(TABS_KEY)
    if (!raw) return []
    return JSON.parse(raw) as OpenTab[]
  } catch {
    return []
  }
}

export function saveOpenTabs(tabs: OpenTab[]): void {
  localStorage.setItem(TABS_KEY, JSON.stringify(tabs))
}

export function makeTab(input: TabInput): OpenTab {
  return { id: tabKey(input), ...input }
}
