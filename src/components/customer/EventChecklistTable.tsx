'use client'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChecklistStatus } from '@prisma/client'
import { Pencil, Check, X } from 'lucide-react'

type ChecklistItem = {
  id: string; category: string; item_name: string; status: ChecklistStatus
  external_vendor_name: string | null; quoted_price: unknown
  finalized_price: unknown; deposit_paid: boolean; deposit_amount: unknown
  balance_due: unknown; notes: string | null
}

type Props = {
  eventId: string
  items: ChecklistItem[]
  currency: string
  onUpdated: () => void
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-700',
  SEARCHING: 'bg-blue-50 text-blue-700',
  SHORTLISTED: 'bg-yellow-50 text-yellow-700',
  FINALIZED: 'bg-green-50 text-green-700',
  NOT_NEEDED: 'bg-gray-50 text-gray-400',
}

const ALL_STATUSES = Object.keys(STATUS_COLORS)

export function EventChecklistTable({ eventId, items, currency, onUpdated }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Record<string, unknown>>({})
  const [saving, setSaving] = useState(false)

  function startEdit(item: ChecklistItem) {
    setEditingId(item.id)
    setEditValues({
      status: item.status,
      external_vendor_name: item.external_vendor_name ?? '',
      quoted_price: item.quoted_price ?? '',
      finalized_price: item.finalized_price ?? '',
      deposit_amount: item.deposit_amount ?? '',
      notes: item.notes ?? '',
    })
  }

  async function saveEdit(id: string) {
    setSaving(true)
    const payload: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(editValues)) {
      payload[k] = v === '' ? null : v
    }
    await fetch(`/api/events/${eventId}/checklist/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    setSaving(false)
    setEditingId(null)
    onUpdated()
  }

  const grouped = items.reduce<Record<string, ChecklistItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {})

  const fmt = (n: unknown) =>
    n != null && n !== ''
      ? new Intl.NumberFormat('en-GB', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(n))
      : '—'

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([category, categoryItems]) => (
        <div key={category}>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">{category}</h3>
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 w-48">Item</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Vendor</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 w-36">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 w-28">Quoted</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 w-28">Finalized</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 w-28">Deposit</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Notes</th>
                  <th className="w-16" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {categoryItems.map(item => {
                  const isEditing = editingId === item.id
                  return (
                    <tr key={item.id} className={`${isEditing ? 'bg-orange-50' : 'hover:bg-gray-50'} transition-colors`}>
                      <td className="px-4 py-3 font-medium text-gray-900">{item.item_name}</td>

                      <td className="px-4 py-3 text-gray-600">
                        {isEditing ? (
                          <Input
                            value={String(editValues.external_vendor_name ?? '')}
                            onChange={e => setEditValues(v => ({ ...v, external_vendor_name: e.target.value }))}
                            className="h-8 text-sm"
                            placeholder="Vendor name"
                          />
                        ) : (
                          item.external_vendor_name ?? <span className="text-gray-300">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {isEditing ? (
                          <Select
                            value={String(editValues.status)}
                            onValueChange={(v: string | null) => setEditValues(ev => ({ ...ev, status: v as ChecklistStatus }))}
                          >
                            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {ALL_STATUSES.map(s => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[item.status] ?? ''}`}>
                            {item.status}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right text-gray-600">
                        {isEditing ? (
                          <Input
                            type="number"
                            value={String(editValues.quoted_price ?? '')}
                            onChange={e => setEditValues(v => ({ ...v, quoted_price: e.target.value }))}
                            className="h-8 text-sm text-right"
                          />
                        ) : fmt(item.quoted_price)}
                      </td>

                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                        {isEditing ? (
                          <Input
                            type="number"
                            value={String(editValues.finalized_price ?? '')}
                            onChange={e => setEditValues(v => ({ ...v, finalized_price: e.target.value }))}
                            className="h-8 text-sm text-right"
                          />
                        ) : fmt(item.finalized_price)}
                      </td>

                      <td className="px-4 py-3 text-right text-gray-600">
                        {isEditing ? (
                          <Input
                            type="number"
                            value={String(editValues.deposit_amount ?? '')}
                            onChange={e => setEditValues(v => ({ ...v, deposit_amount: e.target.value }))}
                            className="h-8 text-sm text-right"
                          />
                        ) : fmt(item.deposit_amount)}
                      </td>

                      <td className="px-4 py-3 text-gray-600">
                        {isEditing ? (
                          <Input
                            value={String(editValues.notes ?? '')}
                            onChange={e => setEditValues(v => ({ ...v, notes: e.target.value }))}
                            className="h-8 text-sm"
                            placeholder="Notes…"
                          />
                        ) : (
                          <span className="truncate max-w-[200px] block">
                            {item.notes ?? <span className="text-gray-300">—</span>}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {isEditing ? (
                          <div className="flex gap-1">
                            <button onClick={() => saveEdit(item.id)} disabled={saving} className="p-1 text-green-600 hover:bg-green-50 rounded">
                              <Check className="h-4 w-4" />
                            </button>
                            <button onClick={() => setEditingId(null)} className="p-1 text-gray-400 hover:bg-gray-100 rounded">
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => startEdit(item)} className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded">
                            <Pencil className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}
