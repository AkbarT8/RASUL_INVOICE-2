import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Search,
  Settings,
  LogOut,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useAppStore } from '../../store/useAppStore'
import { motion } from 'framer-motion'

const links = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/clients', icon: Users, label: 'Clients' },
  { to: '/search', icon: Search, label: 'Search' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export function Sidebar() {
  const logout = useAppStore((s) => s.logout)
  const username = useAppStore((s) => s.username)
  const saving = useAppStore((s) => s.saving)

  return (
    <aside className="flex h-full w-[220px] shrink-0 flex-col border-r border-[#1f1f27] bg-[#0c0c0f]">
      <div className="border-b border-[#1f1f27] px-4 py-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#52525b]">
          Workspace
        </p>
        <h1 className="mt-1 text-[15px] font-semibold tracking-tight text-white">
          Proforma
        </h1>
        {saving && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-1 text-[11px] text-violet-400"
          >
            Saving…
          </motion.p>
        )}
      </div>

      <nav className="flex-1 space-y-0.5 p-2">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] transition-colors',
                isActive
                  ? 'bg-[#1a1a22] text-white'
                  : 'text-[#a1a1aa] hover:bg-[#141419] hover:text-[#e4e4e7]',
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0 opacity-80" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-[#1f1f27] p-3">
        <p className="truncate px-2 text-[11px] text-[#52525b]">{username}</p>
        <button
          type="button"
          onClick={() => logout()}
          className="mt-2 flex w-full items-center gap-2 rounded-md px-2 py-2 text-[12px] text-[#a1a1aa] transition hover:bg-[#141419] hover:text-white"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
