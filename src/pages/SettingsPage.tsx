import { useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { getClientCredentials } from '../lib/persistence'
import { ui } from '../lib/theme'
import { Eye, EyeOff, Plus, Trash2 } from 'lucide-react'
import {
  loadAdminAccounts,
  saveAdminAccounts,
  type AdminAccount,
} from '../lib/admins'
import { uid } from '../lib/utils'

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

      <div className="mx-auto w-full max-w-2xl space-y-5 p-6">
        <section className={`p-5 ${ui.card}`}>
          <h3 className="text-[14px] font-semibold text-slate-900">Account</h3>
          <p className={`mt-1 text-[12px] ${ui.textMuted}`}>
            Signed in as <strong>{username}</strong>
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
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-[12px] font-medium text-slate-600">New password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`mt-1 w-full ${ui.input}`}
                />
              </div>
              <div>
                <label className="text-[12px] font-medium text-slate-600">Confirm password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`mt-1 w-full ${ui.input}`}
                />
              </div>
            </div>
            {credMsg && (
              <p className={`text-[12px] ${credMsg.ok ? 'text-emerald-600' : 'text-red-600'}`}>
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
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-[12px] font-medium text-slate-600">Default status</label>
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
              <label className="text-[12px] font-medium text-slate-600">Number prefix</label>
              <input
                value={settings.proformaPrefix}
                onChange={(e) =>
                  updateStore((s) => ({
                    ...s,
                    settings: { ...s.settings, proformaPrefix: e.target.value },
                  }))
                }
                className={`mt-1 w-full ${ui.input}`}
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-slate-600">Column width (px)</label>
              <input
                type="number"
                min={48}
                max={480}
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
                className={`mt-1 w-full ${ui.input}`}
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-slate-600">Currency symbol</label>
              <input
                value={settings.currencySymbol}
                onChange={(e) =>
                  updateStore((s) => ({
                    ...s,
                    settings: { ...s.settings, currencySymbol: e.target.value },
                  }))
                }
                className={`mt-1 w-full ${ui.input}`}
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-slate-600">Rows to add (+Row)</label>
              <input
                type="number"
                min={1}
                max={200}
                value={settings.defaultRowsToAdd}
                onChange={(e) =>
                  updateStore((s) => ({
                    ...s,
                    settings: {
                      ...s.settings,
                      defaultRowsToAdd: Number(e.target.value) || 1,
                    },
                  }))
                }
                className={`mt-1 w-full ${ui.input}`}
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-slate-600">Columns to add (+Col)</label>
              <input
                type="number"
                min={1}
                max={200}
                value={settings.defaultColsToAdd}
                onChange={(e) =>
                  updateStore((s) => ({
                    ...s,
                    settings: {
                      ...s.settings,
                      defaultColsToAdd: Number(e.target.value) || 1,
                    },
                  }))
                }
                className={`mt-1 w-full ${ui.input}`}
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-slate-600">Auto-save delay (ms)</label>
              <input
                type="number"
                min={200}
                max={5000}
                step={100}
                value={settings.autoSaveMs}
                onChange={(e) =>
                  updateStore((s) => ({
                    ...s,
                    settings: {
                      ...s.settings,
                      autoSaveMs: Number(e.target.value) || 400,
                    },
                  }))
                }
                className={`mt-1 w-full ${ui.input}`}
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-slate-600">Date format</label>
              <select
                value={settings.dateFormat}
                onChange={(e) =>
                  updateStore((s) => ({
                    ...s,
                    settings: {
                      ...s.settings,
                      dateFormat: e.target.value as 'eu' | 'us' | 'iso',
                    },
                  }))
                }
                className={`mt-1 w-full ${ui.input}`}
              >
                <option value="eu">DD.MM.YYYY</option>
                <option value="us">MM/DD/YYYY</option>
                <option value="iso">YYYY-MM-DD</option>
              </select>
            </div>
          </div>
        </section>

        <section className={`p-5 ${ui.card}`}>
          <h3 className="text-[14px] font-semibold text-slate-900">Invoice export</h3>
          <div className="mt-4 space-y-3">
            <div>
              <label className="text-[12px] font-medium text-slate-600">Company name on invoice</label>
              <input
                value={settings.invoiceCompanyName}
                onChange={(e) =>
                  updateStore((s) => ({
                    ...s,
                    settings: { ...s.settings, invoiceCompanyName: e.target.value },
                  }))
                }
                className={`mt-1 w-full ${ui.input}`}
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-slate-600">Invoice footer text</label>
              <textarea
                value={settings.invoiceFooter}
                onChange={(e) =>
                  updateStore((s) => ({
                    ...s,
                    settings: { ...s.settings, invoiceFooter: e.target.value },
                  }))
                }
                rows={2}
                className={`mt-1 w-full resize-none ${ui.input}`}
              />
            </div>
          </div>
        </section>


        <section className={`p-5 ${ui.card}`}>
          <AdminAccountsSection />
        </section>

        <section className={`p-5 ${ui.card}`}>
          <h3 className="text-[14px] font-semibold text-slate-900">Table & safety</h3>
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
                checked={settings.showGridLines}
                onChange={(e) =>
                  updateStore((s) => ({
                    ...s,
                    settings: { ...s.settings, showGridLines: e.target.checked },
                  }))
                }
                className="rounded border-slate-300 text-violet-600"
              />
              <span className="text-[13px] text-slate-700">Show grid lines in spreadsheet</span>
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
              <span className="text-[13px] text-slate-700">Confirm before delete</span>
            </label>
          </ul>
          <p className={`mt-4 text-[11px] leading-relaxed ${ui.textMuted}`}>
            Selection tips: click to select one; Ctrl+click to toggle multiple; Shift+click for
            range; right-click to add to selection without clearing others.
          </p>
        </section>
      </div>
    </div>
  )
}

function AdminAccountsSection() {
  const [accounts, setAccounts] = useState<AdminAccount[]>(() => loadAdminAccounts())
  const [label, setLabel] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [revealed, setRevealed] = useState<Record<string, boolean>>({})
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  function persist(next: AdminAccount[]) {
    setAccounts(next)
    saveAdminAccounts(next)
  }

  function addAccount(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    if (!username.trim() || !password) {
      setMsg({ ok: false, text: 'Укажите логин и пароль' })
      return
    }
    if (accounts.some((a) => a.username === username.trim())) {
      setMsg({ ok: false, text: 'Такой логин уже есть' })
      return
    }
    const acc: AdminAccount = {
      id: uid('admin'),
      username: username.trim(),
      password,
      label: label.trim() || username.trim(),
      createdAt: new Date().toISOString(),
    }
    persist([...accounts, acc])
    setLabel('')
    setUsername('')
    setPassword('')
    setMsg({ ok: true, text: 'Дополнительный админ создан' })
  }

  function removeAccount(id: string) {
    if (!window.confirm('Удалить этого админа?')) return
    persist(accounts.filter((a) => a.id !== id))
  }

  return (
    <>
      <h3 className="text-[14px] font-semibold text-slate-900">Дополнительные админы</h3>
      <p className={`mt-1 text-[12px] ${ui.textMuted}`}>
        Создайте второй (и другие) аккаунты для входа. Логин и пароль хранятся локально и
        скрыты по умолчанию.
      </p>
      <form onSubmit={addAccount} className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-[12px] font-medium text-slate-600">Подпись</label>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Напр. Менеджер"
            className={`mt-1 w-full ${ui.input}`}
          />
        </div>
        <div>
          <label className="text-[12px] font-medium text-slate-600">Логин</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={`mt-1 w-full ${ui.input}`}
            required
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-[12px] font-medium text-slate-600">Пароль</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`mt-1 w-full ${ui.input}`}
            required
          />
        </div>
        {msg && (
          <p className={`sm:col-span-2 text-[12px] ${msg.ok ? 'text-emerald-600' : 'text-red-600'}`}>
            {msg.text}
          </p>
        )}
        <div className="sm:col-span-2">
          <button type="submit" className={ui.btnPrimary}>
            <Plus className="mr-1 inline h-4 w-4" />
            Добавить админа
          </button>
        </div>
      </form>
      {accounts.length > 0 && (
        <ul className="mt-5 space-y-2">
          {accounts.map((a) => (
            <li
              key={a.id}
              className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2"
            >
              <span className="text-[13px] font-medium text-slate-800">{a.label}</span>
              <span className="text-[12px] text-slate-500">@{a.username}</span>
              <code className="rounded bg-white px-2 py-0.5 text-[11px] text-slate-600">
                {revealed[a.id] ? a.password : '••••••••'}
              </code>
              <button
                type="button"
                className="ml-auto rounded p-1 text-slate-500 hover:bg-white"
                onClick={() => setRevealed((r) => ({ ...r, [a.id]: !r[a.id] }))}
                title={revealed[a.id] ? 'Скрыть' : 'Показать пароль'}
              >
                {revealed[a.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={() => removeAccount(a.id)}
                className="rounded p-1 text-red-500 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
