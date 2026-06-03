import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import type { SearchResult } from '../../shared/types'

export function SearchPage() {
  const searchFn = useAppStore((s) => s.search)
  const [q, setQ] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!q.trim()) {
      setResults([])
      return
    }
    const t = setTimeout(async () => {
      setLoading(true)
      try {
        const data = await searchFn(q.trim())
        setResults(data)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 150)
    return () => clearTimeout(t)
  }, [q, searchFn])

  function resultLink(r: SearchResult): string {
    if (r.type === 'client') return `/clients/${r.id}`
    if (r.proformaId && r.clientId)
      return `/clients/${r.clientId}/proformas/${r.proformaId}`
    return '/clients'
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="border-b border-[#1f1f27] px-6 py-5">
        <h2 className="text-[18px] font-semibold">Search</h2>
        <div className="relative mt-4 max-w-xl">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#52525b]" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Clients, proformas, articles, notes…"
            className="w-full rounded-lg border border-[#27272f] bg-[#0f0f12] py-2.5 pl-10 pr-4 text-[14px] outline-none focus:border-violet-500/50"
          />
        </div>
      </header>
      <div className="flex-1 overflow-auto p-4">
        {loading && <p className="text-[12px] text-[#52525b]">Searching…</p>}
        {!loading && q && results.length === 0 && (
          <p className="text-[12px] text-[#52525b]">No results.</p>
        )}
        <ul className="space-y-1">
          {results.map((r) => (
            <li key={r.id}>
              <Link
                to={resultLink(r)}
                className="block rounded-lg border border-transparent px-3 py-2.5 transition hover:border-[#27272f] hover:bg-[#0f0f12]"
              >
                <div className="flex items-center gap-2">
                  <span className="rounded bg-[#1a1a22] px-1.5 py-0.5 text-[10px] uppercase text-[#71717a]">
                    {r.type}
                  </span>
                  <span className="font-medium">{r.title}</span>
                </div>
                <p className="mt-0.5 text-[12px] text-[#71717a]">{r.subtitle}</p>
                {r.snippet && (
                  <p className="mt-1 text-[11px] text-[#52525b]">{r.snippet}</p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
