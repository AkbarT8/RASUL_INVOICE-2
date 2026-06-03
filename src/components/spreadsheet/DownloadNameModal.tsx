import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { ui } from '../../lib/theme'

export function DownloadNameModal({
  title,
  defaultName,
  extension,
  onConfirm,
  onClose,
}: {
  title: string
  defaultName: string
  extension: string
  onConfirm: (filename: string) => void
  onClose: () => void
}) {
  const [name, setName] = useState(defaultName.replace(/\.(xlsx|xls)$/i, ''))

  useEffect(() => {
    setName(defaultName.replace(/\.(xlsx|xls)$/i, ''))
  }, [defaultName])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    const filename = trimmed.endsWith(extension) ? trimmed : `${trimmed}${extension}`
    onConfirm(filename)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 p-4">
      <div className={`w-full max-w-md p-5 ${ui.card}`}>
        <div className="mb-4 flex items-start justify-between">
          <h3 className="text-[15px] font-semibold text-slate-900">{title}</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-[12px] font-medium text-slate-600">File name</label>
            <div className="mt-1 flex">
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`flex-1 rounded-l-lg ${ui.input}`}
                placeholder="my-export"
              />
              <span className="flex items-center rounded-r-lg border border-l-0 border-slate-200 bg-slate-50 px-3 text-[12px] text-slate-500">
                {extension}
              </span>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className={ui.btnSecondary}>
              Cancel
            </button>
            <button type="submit" className={ui.btnPrimary}>
              Download
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
