'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChecklistStatus } from '@prisma/client'
import { Pencil, Check, X, Search } from 'lucide-react'
import Link from 'next/link'

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
}

const STATUS_CONFIG: Record<string, { label: string; dot: string; badge: string }> = {
  PENDING:     { label: 'Pending',     dot: 'bg-cream-2',    badge: 'bg-cream text-text-3' },
  SEARCHING:   { label: 'Searching',   dot: 'bg-blue-400',   badge: 'bg-blue-50 text-blue-700' },
  SHORTLISTED: { label: 'Shortlisted', dot: 'bg-amber-400',  badge: 'bg-amber-50 text-amber-700' },
  FINALIZED:   { label: 'Finalized',   dot: 'bg-green-500',  badge: 'bg-green-50 text-green-700' },
  NOT_NEEDED:  { label: 'Not needed',  dot: 'bg-cream-2',    badge: 'bg-cream text-text-4' },
}

const ALL_STATUSES = Object.keys(STATUS_CONFIG)

const CATEGORY_ICONS: Record<string, string> = {
  'Food & Drink':    '🍽',
  'Venue & Decor':   '🌸',
  'Photography':     '📷',
  'Entertainment':   '🎵',
  'Beauty & Wellness': '💄',
  'Ceremony':        '🙏',
  'Admin':           '📋',
}

const CATEGORY_ORDER = [
  'Food & Drink', 'Venue & Decor', 'Photography',
  'Entertainment', 'Beauty & Wellness', 'Ceremony', 'Admin',
]

export function EventChecklistTable({ eventId, items, currency }: Props) {
  const router = useRouter()
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
    router.refresh()
  }

  const grouped = items.reduce<Record<string, ChecklistItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {})

  const fmt = (n: unknown) =>
    n != null && n !== ''
      ? new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(n))
      : null

  return (
    <div className="space-y-6">
      {Object.entries(grouped).sort(([a], [b]) => {
        const ai = CATEGORY_ORDER.indexOf(a)
        const bi = CATEGORY_ORDER.indexOf(b)
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
      }).map(([category, categoryItems]) => {
        const icon = CATEGORY_ICONS[category] ?? '📌'
        const doneCount = categoryItems.filter(i => i.status === 'FINALIZED' || i.status === 'NOT_NEEDED').length
        return (
          <div key={category}>
            {/* Category header */}
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="flex items-center gap-2">
                <span className="text-base">{icon}</span>
                <span className="text-sm font-bold text-text-2">{category}</span>
              </div>
              <span className="text-xs text-text-4">{doneCount}/{categoryItems.length} done</span>
            </div>

            {/* Item rows */}
            <div className="rounded-2xl border border-brand-border bg-white dark:bg-cream-2 divide-y overflow-hidden">
              {categoryItems.map(item => {
                const isEditing = editingId === item.id
                const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.PENDING
                const finalPrice = fmt(item.finalized_price)
                const quotedPrice = fmt(item.quoted_price)

                if (isEditing) {
                  return (
                    <div key={item.id} className="bg-cream p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-text-1">{item.item_name}</span>
                        <div className="flex gap-1">
                          <button onClick={() => saveEdit(item.id)} disabled={saving}
                            className="p-1.5 text-green-600 hover:bg-green-100 rounded-xl transition-colors">
                            <Check className="h-4 w-4" />
                          </button>
                          <button onClick={() => setEditingId(null)}
                            className="p-1.5 text-text-4 hover:bg-cream-2 rounded-xl transition-colors">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                        <div>
                          <label className="text-xs text-text-4 mb-1 block">Status</label>
                          <Select
                            value={String(editValues.status)}
                            onValueChange={(v: string | null) => setEditValues(ev => ({ ...ev, status: v as ChecklistStatus }))}
                          >
                            <SelectTrigger className="h-8 text-sm bg-white dark:bg-cream-2"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {ALL_STATUSES.map(s => (
                                <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-xs text-text-4 mb-1 block">Vendor</label>
                          <Input
                            value={String(editValues.external_vendor_name ?? '')}
                            onChange={e => setEditValues(v => ({ ...v, external_vendor_name: e.target.value }))}
                            className="h-8 text-sm bg-white dark:bg-cream-2"
                            placeholder="Vendor name"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-text-4 mb-1 block">Quoted price</label>
                          <Input type="number"
                            value={String(editValues.quoted_price ?? '')}
                            onChange={e => setEditValues(v => ({ ...v, quoted_price: e.target.value }))}
                            className="h-8 text-sm bg-white dark:bg-cream-2"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-text-4 mb-1 block">Finalized price</label>
                          <Input type="number"
                            value={String(editValues.finalized_price ?? '')}
                            onChange={e => setEditValues(v => ({ ...v, finalized_price: e.target.value }))}
                            className="h-8 text-sm bg-white dark:bg-cream-2"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-text-4 mb-1 block">Deposit paid</label>
                          <Input type="number"
                            value={String(editValues.deposit_amount ?? '')}
                            onChange={e => setEditValues(v => ({ ...v, deposit_amount: e.target.value }))}
                            className="h-8 text-sm bg-white dark:bg-cream-2"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-text-4 mb-1 block">Notes</label>
                          <Input
                            value={String(editValues.notes ?? '')}
                            onChange={e => setEditValues(v => ({ ...v, notes: e.target.value }))}
                            className="h-8 text-sm bg-white dark:bg-cream-2"
                            placeholder="Notes…"
                          />
                        </div>
                      </div>
                    </div>
                  )
                }

                return (
                  <div key={item.id} className={`flex items-center gap-3 px-4 py-3 group hover:bg-cream transition-colors ${
                    item.status === 'NOT_NEEDED' ? 'opacity-50' : ''
                  }`}>
                    {/* Status dot */}
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${cfg.dot}`} />

                    {/* Item name + vendor */}
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm font-medium ${item.status === 'FINALIZED' ? 'text-text-4 line-through' : 'text-text-1'}`}>
                        {item.item_name}
                      </span>
                      {item.external_vendor_name && (
                        <span className="ml-2 text-xs text-text-4">{item.external_vendor_name}</span>
                      )}
                      {item.notes && (
                        <p className="text-xs text-text-4 mt-0.5 truncate">{item.notes}</p>
                      )}
                    </div>

                    {/* Prices */}
                    <div className="text-right flex-shrink-0 hidden sm:block">
                      {finalPrice ? (
                        <span className="text-sm font-semibold text-text-1">{finalPrice}</span>
                      ) : quotedPrice ? (
                        <span className="text-sm text-text-4">{quotedPrice}</span>
                      ) : null}
                    </div>

                    {/* Status badge */}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${cfg.badge}`}>
                      {cfg.label}
                    </span>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {(item.status === 'PENDING' || item.status === 'SEARCHING') && (
                        <Link href={`/events/${eventId}/vendors`}
                          className="p-1.5 text-brand hover:bg-cream rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                          title="Find vendors">
                          <Search className="h-3.5 w-3.5" />
                        </Link>
                      )}
                      <button onClick={() => startEdit(item)}
                        className="p-1.5 text-text-4 hover:text-text-3 hover:bg-cream rounded-xl transition-colors opacity-0 group-hover:opacity-100">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
