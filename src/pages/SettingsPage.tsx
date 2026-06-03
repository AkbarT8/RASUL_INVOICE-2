import { useAppStore } from '../store/useAppStore'

export function SettingsPage() {
  const settings = useAppStore((s) => s.store.settings)
  const updateStore = useAppStore((s) => s.updateStore)

  return (
    <div className="flex h-full flex-col overflow-auto">
      <header className="border-b border-[#1f1f27] px-6 py-5">
        <h2 className="text-[18px] font-semibold">Settings</h2>
        <p className="mt-1 text-[13px] text-[#71717a]">Workspace preferences</p>
      </header>
      <div className="max-w-md space-y-6 p-6">
        <div>
          <label className="text-[12px] text-[#a1a1aa]">Default proforma status</label>
          <input
            value={settings.defaultStatus}
            onChange={(e) =>
              updateStore((s) => ({
                ...s,
                settings: { ...s.settings, defaultStatus: e.target.value },
              }))
            }
            className="mt-1.5 w-full rounded-lg border border-[#27272f] bg-[#0f0f12] px-3 py-2 text-[13px] outline-none focus:border-violet-500/50"
          />
        </div>
        <p className="text-[11px] leading-relaxed text-[#52525b]">
          Data auto-saves after each change. Hidden columns can be restored by
          adding a column with the same name or editing the data store.
        </p>
      </div>
    </div>
  )
}
