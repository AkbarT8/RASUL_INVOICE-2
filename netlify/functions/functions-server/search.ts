import type { Handler } from '@netlify/functions'
import { isAuthenticated, unauthorized } from './lib/auth'
import { loadStore } from './lib/store'
import type { SearchResult } from '../../shared/types'

export const handler: Handler = async (event) => {
  if (!isAuthenticated(event)) return unauthorized()

  const q = (event.queryStringParameters?.q || '').trim().toLowerCase()
  if (!q) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([]),
    }
  }

  const store = await loadStore()
  const results: SearchResult[] = []

  for (const client of store.clients) {
    const hay = [client.name, client.company, client.phone, client.country, client.notes]
      .join(' ')
      .toLowerCase()
    if (hay.includes(q)) {
      results.push({
        type: 'client',
        id: client.id,
        title: client.name,
        subtitle: client.company || 'Client',
        snippet: client.notes?.slice(0, 120) || '',
      })
    }
  }

  for (const proforma of store.proformas) {
    const client = store.clients.find((c) => c.id === proforma.clientId)
    const proformaHay = [proforma.number, proforma.status, proforma.notes]
      .join(' ')
      .toLowerCase()
    if (proformaHay.includes(q)) {
      results.push({
        type: 'proforma',
        id: proforma.id,
        clientId: proforma.clientId,
        proformaId: proforma.id,
        title: proforma.number,
        subtitle: client?.name || 'Proforma',
        snippet: proforma.notes?.slice(0, 120) || '',
      })
    }

    for (const row of proforma.rows) {
      for (const col of proforma.columns) {
        const cell = row.cells[col.id]
        if (!cell?.value) continue
        if (cell.value.toLowerCase().includes(q)) {
          const isNotes = cell.type === 'notes' || col.name.toLowerCase().includes('note')
          results.push({
            type: isNotes ? 'note' : 'article',
            id: `${proforma.id}-${row.id}-${col.id}`,
            clientId: proforma.clientId,
            proformaId: proforma.id,
            title: cell.value.slice(0, 80),
            subtitle: `${proforma.number} · ${col.name}`,
            snippet: client?.name || '',
          })
        }
      }
    }

    if (proforma.notes.toLowerCase().includes(q)) {
      results.push({
        type: 'note',
        id: `pf-note-${proforma.id}`,
        clientId: proforma.clientId,
        proformaId: proforma.id,
        title: proforma.number,
        subtitle: 'Proforma notes',
        snippet: proforma.notes.slice(0, 120),
      })
    }
  }

  const deduped = results.filter(
    (item, index, arr) => arr.findIndex((x) => x.id === item.id) === index,
  )

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(deduped.slice(0, 50)),
  }
}
