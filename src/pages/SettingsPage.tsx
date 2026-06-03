import { useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { getClientCredentials } from '../lib/persistence'
import { ui } from '../lib/theme'
import { Eye, EyeOff, Check } from 'lucide-react'

export function SettingsPage() {
  const settings = useAppStore((s) => s.store.settings)
  const updateStore = useAppStore((s) => s.updateStore)
  const updateCredentials = useAppStore((s) => s.updateCredentials)
  const username = useAppStore((s) => s.username)

  const [newUsername, setNewUsername] = useState(getClientCredentials().username)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [credMsg, setCredMsg] = useState<{ ok: boolean; text: string } | null>(null)

  function saveCredentials(e: React.FormEvent) {
    e.preventDefault()
    setCredMsg(null)
    if (!newUsername.trim()) {
      setCredMsg({ ok: false, text: 'Username is required' })
      return
    }
    if (newPassword && newPassword !== confirmPassword) {
      setCredMsg({ ok: false, text: 'New passwords do not match' })
      return
    }
    try {
      updateCredentials({
        username: newUsername.trim(),
        newPassword: newPassword || undefined,
        currentPassword,
      })
      setCredMsg({ ok: true, text: 'Login credentials updated' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setCredMsg({
        ok: false,
        text: err instanceof Error ? err.message : 'Could not update credentials',
      })
    }
  }

  return (
    <div className="flex h-full flex-col overflow-auto bg-slate-50">
      <header className={`shrink-0 ${ui.surface} border-b ${ui.border} px-6 py-5`}>
        <h2 className="text-[18px] font-semibold text-slate-900">Settings</h2>
        <p className={`mt-1 text-[13px] ${ui.textMuted}`}>Workspace preferences</p>
      </header>

      <div className="mx-auto w-full max-w-2xl space-y-6 p-6">
        <section className={`p-5 ${ui.card}`}>
          <h3 className="text-[14px] font-semibold text-slate-900">Account</h3>
          <p className={`mt-1 text-[12px] ${ui.textMuted}`}>
            Signed in as <span className="font-medium text-slate-700">{username}</span>
          </p>
          <form onSubmit={saveCredentials} className="mt-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-[12px] font-medium text-slate-600">Username</label>
                <input
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className={`mt-1 w-full ${ui.input}`}
                />
              </div>
              <div>
                <label className="text-[12px] font-medium text-slate-600">
                  Current password
                </label>
                <div className="relative mt-1">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className={`w-full pr-10 ${ui.input}`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-[12px] font-medium text-slate-600">
                  New password (optional)
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`mt-1 w-full ${ui.input}`}
                />
              </div>
              <div>
                <label className="text-[12px] font-medium text-slate-600">
                  Confirm new password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`mt-1 w-full ${ui.input}`}
                />
              </div>
            </div>
            {credMsg && (
              <p
                className={`text-[12px] ${credMsg.ok ? 'text-emerald-600' : 'text-red-600'}`}
              >
                {credMsg.text}
              </p>
            )}
            <button type="submit" className={ui.btnPrimary}>
              Save credentials
            </button>
          </form>
        </section>

        <section className={`p-5 ${ui.card}`}>
          <h3 className="text-[14px] font-semibold text-slate-900">Proforma defaults</h3>
          <div className="mt-4 space-y-4">
            <div>
              <label className="text-[12px] font-medium text-slate-600">
                Default status for new proformas
              </label>
              <input
                value={settings.defaultStatus}
                onChange={(e) =>
                  updateStore((s) => ({
                    ...s,
                    settings: { ...s.settings, defaultStatus: e.target.value },
                  }))
                }
                className={`mt-1 w-full ${ui.input}`}
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-slate-600">
                Default column width (px)
              </label>
              <input
                type="number"
                min={60}
                max={400}
                value={settings.defaultColumnWidth}
                onChange={(e) =>
                  updateStore((s) => ({
                    ...s,
                    settings: {
                      ...s.settings,
                      defaultColumnWidth: Number(e.target.value) || 120,
                    },
                  }))
                }
                className={`mt-1 w-full max-w-[200px] ${ui.input}`}
              />
            </div>
          </div>
        </section>

        <section className={`p-5 ${ui.card}`}>
          <h3 className="text-[14px] font-semibold text-slate-900">Workspace behavior</h3>
          <ul className="mt-4 space-y-3">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={settings.compactTable}
                onChange={(e) =>
                  updateStore((s) => ({
                    ...s,
                    settings: { ...s.settings, compactTable: e.target.checked },
                  }))
                }
                className="rounded border-slate-300 text-violet-600"
              />
              <span className="text-[13px] text-slate-700">Compact table rows</span>
            </label>
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={settings.confirmDeletes}
                onChange={(e) =>
                  updateStore((s) => ({
                    ...s,
                    settings: { ...s.settings, confirmDeletes: e.target.checked },
                  }))
                }
                className="rounded border-slate-300 text-violet-600"
              />
              <span className="text-[13px] text-slate-700">
                Confirm before deleting rows, columns, or clients
              </span>
            </label>
          </ul>
        </section>

        <section className={`p-5 ${ui.card}`}>
          <h3 className="text-[14px] font-semibold text-slate-900">Data</h3>
          <p className={`mt-2 flex items-start gap-2 text-[12px] leading-relaxed ${ui.textMuted}`}>
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            Changes auto-save to your browser. Export proformas to Excel from the spreadsheet
            toolbar at any time.
          </p>
        </section>
      </div>
    </div>
  )
}
