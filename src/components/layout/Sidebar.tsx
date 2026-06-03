import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Search,
  Settings,
  LogOut,
  FileSpreadsheet,
  FolderOpen,
  X,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useAppStore } from '../../store/useAppStore'
import { motion } from 'framer-motion'
import { ui } from '../../lib/theme'

const links = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/clients', icon: Users, label: 'Clients', end: false },
  { to: '/search', icon: Search, label: 'Search', end: true },
  { to: '/settings', icon: Settings, label: 'Settings', end: true },
]

export function Sidebar() {
  const logout = useAppStore((s) => s.logout)
  const username = useAppStore((s) => s.username)
  const saving = useAppStore((s) => s.saving)
  const store = useAppStore((s) => s.store)
  const openTabs = useAppStore((s) => s.openTabs)
  const unpinTab = useAppStore((s) => s.unpinTab)

  function tabLabel(tab: (typeof openTabs)[0]) {
    if (tab.type === 'client') {
      return store.clients.find((c) => c.id === tab.clientId)?.name || 'Client'
    }
    const pf = store.proformas.find((p) => p.id === tab.proformaId)
    return pf?.number || 'Proforma'
  }

  function tabTo(tab: (typeof openTabs)[0]) {
    if (tab.type === 'client') return `/clients/${tab.clientId}`
    return `/clients/${tab.clientId}/proformas/${tab.proformaId}`
  }

  return (
    <aside
      className={`flex h-full w-[260px] shrink-0 flex-col border-r ${ui.border} ${ui.surface}`}
    >
      <div className={`border-b ${ui.border} px-4 py-4`}>
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-400">
          Workspace
        </p>
        <h1 className="mt-1 text-[15px] font-semibold tracking-tight text-slate-900">
          Proforma
        </h1>
        {saving && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-1 text-[11px] text-violet-600"
          >
            Saving…
          </motion.p>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        {links.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'mb-0.5 flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] transition-colors',
                isActive ? ui.navActive : ui.navIdle,
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0 opacity-80" />
            {label}
          </NavLink>
        ))}

        {openTabs.length > 0 && (
          <div className="mt-3 border-t border-slate-100 pt-3">
            <p className="px-3 pb-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">
              Open ({openTabs.length})
            </p>
            <ul className="space-y-0.5">
              {openTabs.map((tab) => (
                <li key={tab.id} className="group flex items-center gap-0.5">
                  <NavLink
                    to={tabTo(tab)}
                    className={({ isActive }) =>
                      cn(
                        'flex min-w-0 flex-1 items-center gap-2 rounded-md py-1.5 pl-2 pr-1 text-[12px] transition-colors',
                        isActive ? ui.navActive : ui.navIdle,
                      )
                    }
                  >
                    {tab.type === 'client' ? (
                      <FolderOpen className="h-3.5 w-3.5 shrink-0 text-violet-500" />
                    ) : (
                      <FileSpreadsheet className="h-3.5 w-3.5 shrink-0 text-violet-500" />
                    )}
                    <span className="truncate">{tabLabel(tab)}</span>
                  </NavLink>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      unpinTab(tab.id)
                    }}
                    className="rounded p-1 text-slate-400 opacity-0 hover:bg-slate-100 hover:text-slate-700 group-hover:opacity-100"
                    title="Close tab"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </nav>

      <div className={`border-t ${ui.border} p-3`}>
        <p className="truncate px-2 text-[11px] text-slate-400">{username}</p>
        <button
          type="button"
          onClick={() => logout()}
          className={`mt-2 flex w-full items-center gap-2 rounded-md px-2 py-2 text-[12px] ${ui.navIdle}`}
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
