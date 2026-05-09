'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { QuoteForm, type FormData } from '@/components/quotes/QuoteForm'
import { DishLibrary } from '@/components/quotes/DishLibrary'
import { MenuCategory } from '@prisma/client'
import { format } from 'date-fns'
import Link from 'next/link'
import {
  CheckCircle2, Clock, XCircle, Eye, ChevronLeft, Plus, Trash2,
  Users, Leaf, UtensilsCrossed, Pencil,
  BookOpen, ChevronDown, ChevronUp, AlertTriangle, Package2, Tag, Search,
  ScrollText,
} from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────────

type LibraryItem = {
  id: string; name: string; description: string | null; category: MenuCategory
  is_vegetarian: boolean; is_vegan: boolean; is_jain: boolean; is_halal: boolean
  contains_nuts: boolean; contains_gluten: boolean; contains_dairy: boolean
  contains_eggs: boolean; contains_soy: boolean; contains_shellfish: boolean
  spice_level: string
}

type GlobalDishSuggestion = {
  id: string
  name: string
  description: string | null
  category: MenuCategory
  is_vegetarian: boolean
  is_vegan: boolean
  is_jain: boolean
  is_halal: boolean
  contains_nuts: boolean
  contains_gluten: boolean
  contains_dairy: boolean
  spice_level: string
}

type QuoteItem = {
  id?: string
  item_name: string
  description?: string | null
  category: MenuCategory
  is_vegetarian: boolean
  is_jain: boolean
  is_halal: boolean
  contains_nuts: boolean
  contains_gluten: boolean
  contains_dairy: boolean
  sort_order: number
  _localId: string
}

type TrayLine = {
  _localId: string
  item_name: string
  serves_note: string
  unit_price: string   // string for controlled input
  qty: string
}

type Quote = {
  id: string
  status: string
  pricing_type: 'PER_HEAD' | 'PER_TRAY'
  price_per_head: number | null
  total_estimate: number
  currency: string
  notes: string | null
  tasting_offered: boolean
  tasting_cost: number | null
  tasting_date: string | null
  tasting_location: string | null
  expires_at: string | null
  discount_type: string | null
  discount_value: number | null
  discount_note: string | null
  menu_items: (Omit<QuoteItem, '_localId'> & { id: string })[]
  tray_lines: { id: string; item_name: string; serves_note: string | null; unit_price: number; qty: number; line_total: number }[]
  contract: { id: string; status: string; contract_number: string } | null
  match: {
    event_request: {
      event: { event_name: string; guest_count: number; currency: string; city: string; event_date: string }
      menu_preference: {
        cuisine_preferences: string[]
        service_style: string | null
        is_vegetarian: boolean; is_vegan: boolean; is_jain: boolean; is_halal: boolean
        nut_free: boolean; gluten_free: boolean; dairy_free: boolean; egg_free: boolean
        soy_free: boolean; shellfish_free: boolean; special_notes: string | null
        pricing_preference: string | null
        customer_tray_requests: { item_name: string; qty: number }[] | null
        soup_salad_count: number | null; appetizer_count: number | null; main_count: number | null
        bread_count: number | null; rice_biryani_count: number | null; dal_count: number | null
        dessert_count: number | null; beverage_count: number | null; live_counter_count: number | null
      } | null
    }
  }
}

// ─── Constants ──────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  SOUP_SALAD: 'Soups & Salads', APPETIZER: 'Appetizers', MAIN_COURSE: 'Mains',
  BREAD: 'Breads', RICE_BIRYANI: 'Rice & Biryani', DAL: 'Dal',
  DESSERT: 'Desserts', BEVERAGE: 'Beverages', LIVE_COUNTER: 'Live Counters', OTHER: 'Other',
}

const CATEGORIES = Object.keys(CATEGORY_LABELS) as MenuCategory[]


const STATUS_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  SENT:     { label: 'Sent',     icon: <Clock className="h-3.5 w-3.5" />,        color: 'text-blue-600 bg-blue-50' },
  VIEWED:   { label: 'Viewed',   icon: <Eye className="h-3.5 w-3.5" />,          color: 'text-purple-600 bg-purple-50' },
  ACCEPTED: { label: 'Accepted', icon: <CheckCircle2 className="h-3.5 w-3.5" />, color: 'text-green-600 bg-green-50' },
  DECLINED: { label: 'Declined', icon: <XCircle className="h-3.5 w-3.5" />,      color: 'text-red-600 bg-red-50' },
}

const SENT_STATUSES = new Set(['SENT', 'VIEWED', 'ACCEPTED', 'DECLINED'])

let localIdSeq = 0
function mkId() { return `local_${++localIdSeq}` }

function blankLine(): TrayLine {
  return { _localId: mkId(), item_name: '', serves_note: '', unit_price: '', qty: '1' }
}

// ─── Tray Bill component ─────────────────────────────────────────────────────

function TrayBill({
  lines, currency, discountType, discountValue, discountNote, guestCount,
}: {
  lines: TrayLine[]
  currency: string
  discountType: string
  discountValue: string
  discountNote: string
  guestCount: number
}) {
  const validLines = lines.filter(l => l.item_name.trim() && Number(l.unit_price) > 0 && Number(l.qty) > 0)
  const subtotal = validLines.reduce((s, l) => s + Number(l.unit_price) * Number(l.qty), 0)
  let discount = 0
  if (discountType === 'FLAT' && Number(discountValue) > 0) discount = Math.min(Number(discountValue), subtotal)
  if (discountType === 'PERCENTAGE' && Number(discountValue) > 0) discount = subtotal * Number(discountValue) / 100
  const total = Math.max(0, subtotal - discount)

  if (validLines.length === 0) return null

  return (
    <div className="bg-cream border border-brand-border rounded-xl p-5 mt-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-bold text-brand">Live bill</h4>
        <span className="text-xs text-brand">{guestCount} guests · for reference only</span>
      </div>
      <table className="w-full text-sm mb-3">
        <thead>
          <tr className="text-xs text-brand border-b border-brand-border">
            <th className="text-left pb-1.5 font-medium">Item</th>
            <th className="text-center pb-1.5 font-medium w-16">Qty</th>
            <th className="text-right pb-1.5 font-medium w-20">Unit</th>
            <th className="text-right pb-1.5 font-medium w-20">Total</th>
          </tr>
        </thead>
        <tbody>
          {validLines.map(l => (
            <tr key={l._localId} className="border-b border-brand-border last:border-0">
              <td className="py-1.5 text-text-1 font-medium">
                {l.item_name}
                {l.serves_note && <span className="text-xs text-text-4 ml-1">({l.serves_note})</span>}
              </td>
              <td className="py-1.5 text-center text-text-3">×{l.qty}</td>
              <td className="py-1.5 text-right text-text-3">{currency} {Number(l.unit_price).toFixed(0)}</td>
              <td className="py-1.5 text-right font-medium text-text-1">{currency} {(Number(l.unit_price) * Number(l.qty)).toFixed(0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="space-y-1 text-sm border-t border-brand-border pt-2">
        <div className="flex justify-between text-text-3">
          <span>Subtotal</span>
          <span>{currency} {subtotal.toFixed(0)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-green-700">
            <span>
              Discount
              {discountType === 'PERCENTAGE' ? ` (${discountValue}%)` : ''}
              {discountNote ? ` — ${discountNote}` : ''}
            </span>
            <span>− {currency} {discount.toFixed(0)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-brand text-base pt-1 border-t border-brand-border">
          <span>Total</span>
          <span>{currency} {total.toFixed(0)}</span>
        </div>
      </div>
    </div>
  )
}

// ─── Read-only Tray Bill ─────────────────────────────────────────────────────

function ReadonlyTrayBill({ quote }: { quote: Quote }) {
  const { tray_lines, currency, discount_type, discount_value, discount_note, total_estimate } = quote
  const subtotal = tray_lines.reduce((s, l) => s + Number(l.line_total), 0)
  const discount = subtotal - Number(total_estimate)

  return (
    <div className="bg-white dark:bg-cream-2 rounded-2xl border border-brand-border p-6 mb-6">
      <h2 className="text-lg font-bold text-text-1 mb-4 flex items-center gap-2">
        <Package2 className="h-4 w-4 text-brand" /> Tray Order
      </h2>
      <table className="w-full text-sm mb-4">
        <thead>
          <tr className="text-sm text-text-4 border-b">
            <th className="text-left pb-2 font-medium">Item</th>
            <th className="text-center pb-2 font-medium w-16">Serves</th>
            <th className="text-center pb-2 font-medium w-12">Qty</th>
            <th className="text-right pb-2 font-medium w-20">Unit price</th>
            <th className="text-right pb-2 font-medium w-20">Total</th>
          </tr>
        </thead>
        <tbody>
          {tray_lines.map(l => (
            <tr key={l.id} className="border-b last:border-0">
              <td className="py-2 font-medium text-text-1">{l.item_name}</td>
              <td className="py-2 text-center text-xs text-text-4">{l.serves_note || '—'}</td>
              <td className="py-2 text-center text-text-2">×{l.qty}</td>
              <td className="py-2 text-right text-text-3">{currency} {Number(l.unit_price).toFixed(0)}</td>
              <td className="py-2 text-right font-bold text-text-1">{currency} {Number(l.line_total).toFixed(0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="space-y-1.5 text-sm border-t pt-3 max-w-xs ml-auto">
        <div className="flex justify-between text-text-4">
          <span>Subtotal</span>
          <span>{currency} {subtotal.toFixed(0)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-green-700">
            <span>
              Discount
              {discount_type === 'PERCENTAGE' ? ` (${discount_value}%)` : ''}
              {discount_note ? ` — ${discount_note}` : ''}
            </span>
            <span>− {currency} {discount.toFixed(0)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-text-1 text-base pt-1 border-t">
          <span>Total</span>
          <span>{currency} {Number(total_estimate).toFixed(0)}</span>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function MenuBuilderPage() {
  const { quoteId } = useParams<{ quoteId: string }>()
  const router = useRouter()

  const [quote, setQuote]             = useState<Quote | null>(null)
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([])
  const [menuItems, setMenuItems]     = useState<QuoteItem[]>([])
  const [saving, setSaving]           = useState(false)
  const [sending, setSending]         = useState(false)
  const [creatingContract, setCreatingContract] = useState(false)
  const [showLibrary, setShowLibrary] = useState(false)
  const [editMode, setEditMode]       = useState(false)

  // Pricing mode
  const [pricingMode, setPricingMode] = useState<'PER_HEAD' | 'PER_TRAY'>('PER_HEAD')

  // Tray mode state
  const [trayLines, setTrayLines]       = useState<TrayLine[]>([blankLine()])
  const [discountType, setDiscountType] = useState<'NONE' | 'FLAT' | 'PERCENTAGE'>('NONE')
  const [discountValue, setDiscountValue] = useState('')
  const [discountNote, setDiscountNote]   = useState('')
  const [trayNotes, setTrayNotes]       = useState('')

  // Per-head form state
  const [newName, setNewName]   = useState('')
  const [newDesc, setNewDesc]   = useState('')
  const [newCat, setNewCat]     = useState<MenuCategory>('MAIN_COURSE')
  const [newVeg, setNewVeg]     = useState(false)
  const [newHalal, setNewHalal] = useState(false)
  const [newJain, setNewJain]   = useState(false)
  const [newNuts, setNewNuts]   = useState(false)
  const [newGluten, setNewGluten] = useState(false)
  const [newDairy, setNewDairy] = useState(false)

  // Dish autocomplete state
  const [dishSuggestions, setDishSuggestions] = useState<GlobalDishSuggestion[]>([])
  const [showDishSuggestions, setShowDishSuggestions] = useState(false)
  const dishSearchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    Promise.all([
      fetch(`/api/quotes/${quoteId}`).then(r => r.json()),
      fetch('/api/vendor/menu-items').then(r => r.json()),
    ]).then(([quoteData, items]) => {
      setQuote(quoteData)
      setMenuItems((quoteData.menu_items ?? []).map((m: QuoteItem) => ({ ...m, _localId: mkId() })))
      setLibraryItems(Array.isArray(items) ? items : [])
      // Restore pricing mode & tray state
      if (quoteData.pricing_type === 'PER_TRAY') {
        setPricingMode('PER_TRAY')
        if (quoteData.tray_lines?.length > 0) {
          setTrayLines(quoteData.tray_lines.map((l: Quote['tray_lines'][0]) => ({
            _localId: mkId(),
            item_name: l.item_name,
            serves_note: l.serves_note ?? '',
            unit_price: String(l.unit_price),
            qty: String(l.qty),
          })))
        }
        if (quoteData.discount_type) setDiscountType(quoteData.discount_type as any)
        if (quoteData.discount_value) setDiscountValue(String(quoteData.discount_value))
        if (quoteData.discount_note) setDiscountNote(quoteData.discount_note)
        if (quoteData.notes) setTrayNotes(quoteData.notes)
      }
    })
  }, [quoteId])

  // ── Dish autocomplete ───────────────────────────────────────────────────

  function onNewNameChange(value: string) {
    setNewName(value)
    if (dishSearchTimeout.current) clearTimeout(dishSearchTimeout.current)
    if (value.length < 2) { setDishSuggestions([]); setShowDishSuggestions(false); return }
    dishSearchTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/dishes?q=${encodeURIComponent(value)}&limit=6`)
        if (!res.ok) return
        const data: GlobalDishSuggestion[] = await res.json()
        if (data.length > 0) { setDishSuggestions(data); setShowDishSuggestions(true) }
        else { setDishSuggestions([]); setShowDishSuggestions(false) }
      } catch {}
    }, 250)
  }

  function fillFromDishSuggestion(s: GlobalDishSuggestion) {
    setNewName(s.name)
    setNewDesc(s.description ?? '')
    setNewCat(s.category)
    setNewVeg(s.is_vegetarian)
    setNewHalal(s.is_halal)
    setNewJain(s.is_jain)
    setNewNuts(s.contains_nuts)
    setNewGluten(s.contains_gluten)
    setNewDairy(s.contains_dairy)
    setDishSuggestions([])
    setShowDishSuggestions(false)
  }

  // ── Per-head helpers ────────────────────────────────────────────────────

  function addCustomItem() {
    if (!newName.trim()) return
    setMenuItems(prev => [...prev, {
      item_name: newName.trim(), description: newDesc.trim() || null,
      category: newCat, is_vegetarian: newVeg, is_halal: newHalal, is_jain: newJain,
      contains_nuts: newNuts, contains_gluten: newGluten, contains_dairy: newDairy,
      sort_order: prev.length, _localId: mkId(),
    }])
    setNewName(''); setNewDesc(''); setNewVeg(false); setNewHalal(false); setNewJain(false)
    setNewNuts(false); setNewGluten(false); setNewDairy(false)
  }

  function addLibraryItem(item: LibraryItem) {
    if (menuItems.some(m => m.item_name === item.name && m.category === item.category)) return
    setMenuItems(prev => [...prev, {
      item_name: item.name, description: item.description, category: item.category,
      is_vegetarian: item.is_vegetarian, is_halal: item.is_halal, is_jain: item.is_jain,
      contains_nuts: item.contains_nuts, contains_gluten: item.contains_gluten,
      contains_dairy: item.contains_dairy, sort_order: prev.length, _localId: mkId(),
    }])
  }

  function removeItem(localId: string) {
    setMenuItems(prev => prev.filter(m => m._localId !== localId))
  }

  // ── Tray helpers ────────────────────────────────────────────────────────

  function updateTrayLine(localId: string, field: keyof TrayLine, value: string) {
    setTrayLines(prev => prev.map(l => l._localId === localId ? { ...l, [field]: value } : l))
  }

  function removeTrayLine(localId: string) {
    setTrayLines(prev => prev.length > 1 ? prev.filter(l => l._localId !== localId) : prev)
  }

  // ── Persist helpers ─────────────────────────────────────────────────────

  async function persistMenu() {
    await fetch(`/api/quotes/${quoteId}/menu-items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        replace: true,
        items: menuItems.map((item, i) => ({
          item_name: item.item_name, description: item.description ?? null,
          category: item.category, is_vegetarian: item.is_vegetarian,
          is_jain: item.is_jain, is_halal: item.is_halal,
          contains_nuts: item.contains_nuts, contains_gluten: item.contains_gluten,
          contains_dairy: item.contains_dairy, sort_order: i,
        })),
      }),
    })
  }

  async function persistTrayLines() {
    const validLines = trayLines.filter(l => l.item_name.trim() && Number(l.unit_price) > 0 && Number(l.qty) > 0)
    if (validLines.length === 0) return
    await fetch(`/api/quotes/${quoteId}/tray-lines`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lines: validLines.map(l => ({
          item_name: l.item_name.trim(),
          serves_note: l.serves_note.trim() || undefined,
          unit_price: Number(l.unit_price),
          qty: Number(l.qty),
        })),
        discount_type:  discountType !== 'NONE' ? discountType : null,
        discount_value: discountType !== 'NONE' && discountValue ? Number(discountValue) : null,
        discount_note:  discountNote.trim() || null,
      }),
    })
  }

  // ── Save / Send ─────────────────────────────────────────────────────────

  async function handleSaveDraft(formData: FormData) {
    setSaving(true)
    if (pricingMode === 'PER_TRAY') {
      await persistTrayLines()
      await fetch(`/api/quotes/${quoteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: trayNotes, status: 'DRAFT' }),
      })
    } else {
      await persistMenu()
      await fetch(`/api/quotes/${quoteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price_per_head: formData.price_per_head || null,
          total_estimate: formData.price_per_head * (quote?.match.event_request.event.guest_count ?? 1),
          notes: formData.notes,
          tasting_offered: formData.tasting_offered,
          tasting_cost: formData.tasting_offered ? formData.tasting_cost : null,
          tasting_date: formData.tasting_offered && formData.tasting_date ? new Date(formData.tasting_date).toISOString() : null,
          tasting_location: formData.tasting_offered ? formData.tasting_location : null,
          status: 'DRAFT',
        }),
      })
    }
    setSaving(false)
  }

  async function handleSend(formData: FormData) {
    if (pricingMode === 'PER_TRAY') {
      const valid = trayLines.filter(l => l.item_name.trim() && Number(l.unit_price) > 0 && Number(l.qty) > 0)
      if (valid.length === 0) { alert('Add at least one tray item before sending.'); return }
    } else {
      if (!formData.price_per_head || formData.price_per_head <= 0) return
    }
    if (!confirm('Send this quote to the customer? They will be notified.')) return
    setSending(true)
    if (pricingMode === 'PER_TRAY') {
      await persistTrayLines()
      await fetch(`/api/quotes/${quoteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: trayNotes,
          status: 'SENT',
          expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
        }),
      })
    } else {
      await persistMenu()
      await fetch(`/api/quotes/${quoteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price_per_head: formData.price_per_head,
          total_estimate: formData.price_per_head * (quote?.match.event_request.event.guest_count ?? 1),
          notes: formData.notes,
          tasting_offered: formData.tasting_offered,
          tasting_cost: formData.tasting_offered ? formData.tasting_cost : null,
          tasting_date: formData.tasting_offered && formData.tasting_date ? new Date(formData.tasting_date).toISOString() : null,
          tasting_location: formData.tasting_offered ? formData.tasting_location : null,
          status: 'SENT',
          expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
        }),
      })
    }
    setSending(false)
    router.push('/vendor/quotes')
  }

  async function handleCreateContract() {
    if (!quote) return
    setCreatingContract(true)
    try {
      const res = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quote_id: quote.id }),
      })
      if (res.ok) {
        const { contract } = await res.json()
        router.push(`/vendor/contracts/${contract.id}`)
      } else {
        const err = await res.json()
        alert(err.error ?? 'Failed to create contract')
      }
    } finally {
      setCreatingContract(false)
    }
  }

  if (!quote) return <div className="text-text-4 p-8">Loading…</div>

  const pref = quote.match.event_request.menu_preference
  const event = quote.match.event_request.event
  const isSent = SENT_STATUSES.has(quote.status) && !editMode
  const statusMeta = STATUS_META[quote.status]
  const byCategory = menuItems.reduce<Record<string, QuoteItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {})

  // ── READ-ONLY VIEW ────────────────────────────────────────────────────────
  if (isSent) {
    return (
      <div className="max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/vendor/quotes" className="text-text-4 hover:text-text-3">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-text-1">{event.event_name}</h1>
              {statusMeta && (
                <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${statusMeta.color}`}>
                  {statusMeta.icon} {statusMeta.label}
                </span>
              )}
            </div>
            <p className="text-sm text-text-4 mt-0.5">{event.city} · {format(new Date(event.event_date), 'd MMM yyyy')} · {event.guest_count} guests</p>
          </div>
          <div className="flex items-center gap-2">
            {(quote.status === 'SENT' || quote.status === 'VIEWED') && (
              <button onClick={() => setEditMode(true)}
                className="flex items-center gap-1.5 text-sm font-bold text-brand border border-brand-border px-3 py-1.5 rounded-xl hover:bg-cream">
                <Pencil className="h-3.5 w-3.5" /> Edit quote
              </button>
            )}
            {quote.status === 'ACCEPTED' && !quote.contract && (
              <button onClick={handleCreateContract} disabled={creatingContract}
                className="flex items-center gap-1.5 text-sm font-bold text-white bg-brand px-4 py-1.5 rounded-xl hover:bg-brand/90 disabled:opacity-50">
                <ScrollText className="h-3.5 w-3.5" /> {creatingContract ? 'Creating…' : 'Create Contract'}
              </button>
            )}
            {quote.contract && (
              <Link href={`/vendor/contracts/${quote.contract.id}`}
                className="flex items-center gap-1.5 text-sm font-bold text-brand border border-brand-border px-3 py-1.5 rounded-xl hover:bg-cream">
                <ScrollText className="h-3.5 w-3.5" /> View Contract
              </Link>
            )}
          </div>
        </div>

        {/* Tray bill or per-head pricing */}
        {quote.pricing_type === 'PER_TRAY' && quote.tray_lines.length > 0
          ? <ReadonlyTrayBill quote={quote} />
          : (
            <div className="bg-white dark:bg-cream-2 rounded-2xl border border-brand-border p-6 mb-6">
              <h2 className="text-lg font-bold text-text-1 mb-4">Pricing</h2>
              <div className="flex gap-4">
                {quote.price_per_head && (
                  <div className="bg-cream rounded-xl p-5 text-center flex-1">
                    <div className="text-xs text-brand font-medium mb-1">Per head</div>
                    <div className="text-2xl font-bold tracking-tight text-brand">{quote.currency} {Number(quote.price_per_head).toFixed(0)}</div>
                  </div>
                )}
                <div className="bg-cream rounded-xl p-5 text-center flex-1">
                  <div className="text-xs text-brand font-medium mb-1">Total estimate</div>
                  <div className="text-2xl font-bold tracking-tight text-brand">{quote.currency} {Number(quote.total_estimate).toLocaleString()}</div>
                  <div className="text-xs text-brand mt-0.5">{event.guest_count} guests</div>
                </div>
                {quote.tasting_offered && (
                  <div className="bg-green-50 rounded-xl p-5 text-center flex-1">
                    <div className="text-xs text-green-600 font-medium mb-1">Tasting</div>
                    <div className="text-lg font-bold text-green-700">
                      {quote.tasting_cost ? `${quote.currency} ${Number(quote.tasting_cost).toFixed(0)}` : 'Free'}
                    </div>
                    {quote.tasting_date && <div className="text-xs text-green-500 mt-0.5">{format(new Date(quote.tasting_date), 'd MMM yyyy')}</div>}
                  </div>
                )}
              </div>
            </div>
          )
        }

        {/* Per-head menu items */}
        {quote.pricing_type === 'PER_HEAD' && menuItems.length > 0 && (
          <div className="bg-white dark:bg-cream-2 rounded-2xl border border-brand-border p-6 mb-6">
            <h2 className="text-lg font-bold text-text-1 mb-5">Proposed menu <span className="text-text-4 font-normal text-sm">({menuItems.length} items)</span></h2>
            <div className="space-y-6">
              {Object.entries(byCategory).map(([cat, items]) => (
                <div key={cat}>
                  <h3 className="text-xs font-bold text-text-4 uppercase tracking-widest mb-3">{CATEGORY_LABELS[cat] ?? cat}</h3>
                  <div className="space-y-4">
                    {items.map(item => (
                      <div key={item._localId} className="py-2 border-b border-cream last:border-0">
                        <span className="font-medium text-text-1 text-sm">{item.item_name}</span>
                        {item.description && <p className="text-xs text-text-4 mt-0.5">{item.description}</p>}
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {item.is_vegetarian && <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.5 rounded-full font-medium"><Leaf className="h-3 w-3 inline mr-0.5" />Vegetarian</span>}
                          {item.is_jain && <span className="text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 px-1.5 py-0.5 rounded-full font-medium">🌱 Jain</span>}
                          {(item.contains_nuts || item.contains_gluten || item.contains_dairy) && (
                            <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full font-medium">
                              <AlertTriangle className="h-3 w-3 inline mr-0.5" />
                              Contains: {[item.contains_nuts && 'nuts', item.contains_gluten && 'gluten', item.contains_dairy && 'dairy'].filter(Boolean).join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {quote.notes && (
          <div className="bg-white dark:bg-cream-2 rounded-2xl border border-brand-border p-6 mb-6">
            <h2 className="text-lg font-bold text-text-1 mb-2">Notes</h2>
            <p className="text-sm text-text-3 whitespace-pre-wrap">{quote.notes}</p>
          </div>
        )}

        {pref && (
          <div className="bg-cream rounded-2xl border border-brand-border p-6">
            <h2 className="font-bold text-text-2 mb-3 flex items-center gap-2 text-sm">
              <UtensilsCrossed className="h-4 w-4 text-text-4" /> Customer's requirements
            </h2>
            {pref.pricing_preference && pref.pricing_preference !== 'NO_PREFERENCE' && (
              <div className={`mb-3 flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-xl border ${
                pref.pricing_preference === 'PER_TRAY'
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : 'bg-blue-50 border-blue-200 text-blue-800'
              }`}>
                {pref.pricing_preference === 'PER_TRAY' ? '🫕' : '👤'}
                <span>Customer prefers <strong>{pref.pricing_preference === 'PER_TRAY' ? 'tray / quantity pricing' : 'per-person pricing'}</strong></span>
              </div>
            )}
            <div className="flex flex-wrap gap-1.5">
              {pref.cuisine_preferences.map(c => <span key={c} className="text-xs bg-cream text-brand px-2 py-0.5 rounded-full border border-brand-border">{c}</span>)}
              {pref.is_vegetarian && <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-100">Vegetarian</span>}
              {pref.is_halal && <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100">Halal</span>}
            </div>
            {pref.customer_tray_requests && pref.customer_tray_requests.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-bold text-text-4 uppercase tracking-wide mb-2">Customer's tray wishlist</p>
                <div className="space-y-1">
                  {pref.customer_tray_requests.map((r, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold flex-shrink-0">{r.qty}</span>
                      <span className="text-text-2">{r.item_name}</span>
                      <span className="text-xs text-text-4">tray{r.qty !== 1 ? 's' : ''}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {pref.special_notes && <p className="text-sm text-text-4 italic mt-3">"{pref.special_notes}"</p>}
          </div>
        )}
      </div>
    )
  }

  // ── EDIT / BUILD VIEW ─────────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => editMode ? setEditMode(false) : router.push('/vendor/quotes')} className="text-text-4 hover:text-text-3">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-text-1">{editMode ? 'Edit quote' : 'Build quote'}</h1>
          <p className="text-sm text-text-4 mt-0.5">
            {event.event_name} · {event.city} · <span className="font-medium text-brand">{event.guest_count} guests</span> · {format(new Date(event.event_date), 'd MMM yyyy')}
          </p>
        </div>
        {pref && (
          <div className="flex gap-1 flex-wrap justify-end max-w-xs">
            {pref.cuisine_preferences.slice(0, 2).map(c => <span key={c} className="text-xs bg-cream text-brand px-2 py-0.5 rounded-full border border-brand-border">{c}</span>)}
            {pref.is_vegetarian && <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-100">Veg</span>}
            {pref.is_halal && <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100">Halal</span>}
          </div>
        )}
      </div>

      {/* Pricing mode toggle */}
      <div className="bg-white dark:bg-cream-2 rounded-2xl border border-brand-border p-5 mb-6 flex items-center gap-4">
        <span className="text-sm font-medium text-text-2">Pricing mode:</span>
        <div className="flex rounded-xl border border-brand-border overflow-hidden">
          <button
            onClick={() => setPricingMode('PER_HEAD')}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${pricingMode === 'PER_HEAD' ? 'bg-brand text-white' : 'bg-white text-text-3 hover:bg-cream'}`}
          >
            <Users className="h-3.5 w-3.5" /> Per head
          </button>
          <button
            onClick={() => setPricingMode('PER_TRAY')}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors border-l border-brand-border ${pricingMode === 'PER_TRAY' ? 'bg-brand text-white' : 'bg-white text-text-3 hover:bg-cream'}`}
          >
            <Package2 className="h-3.5 w-3.5" /> By tray
          </button>
        </div>
        <p className="text-xs text-text-4 ml-auto">
          {pricingMode === 'PER_TRAY' ? 'Set tray items with quantities and prices' : 'Set a price per person × guest count'}
        </p>
      </div>

      {/* ── TRAY MODE ── */}
      {pricingMode === 'PER_TRAY' && (
        <div className="max-w-3xl space-y-5">
          {/* Tray items table */}
          <div className="bg-white dark:bg-cream-2 rounded-2xl border border-brand-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-text-1">Tray items</h3>
              <span className="text-xs text-text-4 flex items-center gap-1">
                <Users className="h-3.5 w-3.5" /> {event.guest_count} guests · enter quantities for this order
              </span>
            </div>

            {/* Header row */}
            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-text-4 mb-2 px-1">
              <span className="col-span-4">Item name</span>
              <span className="col-span-2">Serves (note)</span>
              <span className="col-span-2 text-right">Unit price ({event.currency})</span>
              <span className="col-span-2 text-right">Qty (trays)</span>
              <span className="col-span-1 text-right">Line total</span>
              <span className="col-span-1" />
            </div>

            <div className="space-y-2">
              {trayLines.map((line, i) => {
                const lineTotal = Number(line.unit_price) > 0 && Number(line.qty) > 0
                  ? Number(line.unit_price) * Number(line.qty) : 0
                return (
                  <div key={line._localId} className="grid grid-cols-12 gap-2 items-center">
                    <input
                      className="col-span-4 border border-brand-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                      placeholder="e.g. Chicken Biryani Full Tray"
                      value={line.item_name}
                      onChange={e => updateTrayLine(line._localId, 'item_name', e.target.value)}
                    />
                    <input
                      className="col-span-2 border border-brand-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                      placeholder="serves 8–10"
                      value={line.serves_note}
                      onChange={e => updateTrayLine(line._localId, 'serves_note', e.target.value)}
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="col-span-2 border border-brand-border rounded-xl px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-brand"
                      placeholder="0"
                      value={line.unit_price}
                      onChange={e => updateTrayLine(line._localId, 'unit_price', e.target.value)}
                    />
                    <input
                      type="number"
                      min="1"
                      step="1"
                      className="col-span-2 border border-brand-border rounded-xl px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-brand"
                      placeholder="1"
                      value={line.qty}
                      onChange={e => updateTrayLine(line._localId, 'qty', e.target.value)}
                    />
                    <span className={`col-span-1 text-right text-sm font-medium ${lineTotal > 0 ? 'text-text-1' : 'text-text-4'}`}>
                      {lineTotal > 0 ? `${event.currency} ${lineTotal.toFixed(0)}` : '—'}
                    </span>
                    <button
                      onClick={() => removeTrayLine(line._localId)}
                      className="col-span-1 flex justify-center text-text-4 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )
              })}
            </div>

            <button
              onClick={() => setTrayLines(prev => [...prev, blankLine()])}
              className="mt-3 flex items-center gap-1.5 text-sm text-brand hover:text-brand font-medium"
            >
              <Plus className="h-4 w-4" /> Add another item
            </button>

            {/* Live bill */}
            <TrayBill
              lines={trayLines}
              currency={event.currency}
              discountType={discountType}
              discountValue={discountValue}
              discountNote={discountNote}
              guestCount={event.guest_count}
            />
          </div>

          {/* Discount */}
          <div className="bg-white dark:bg-cream-2 rounded-2xl border border-brand-border p-6">
            <h3 className="text-lg font-bold text-text-1 mb-4 flex items-center gap-2"><Tag className="h-4 w-4 text-green-600" /> Discount (optional)</h3>
            <div className="flex gap-3 flex-wrap items-end">
              <div>
                <label className="block text-xs text-text-4 mb-1">Type</label>
                <select
                  value={discountType}
                  onChange={e => setDiscountType(e.target.value as any)}
                  className="border border-brand-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                >
                  <option value="NONE">No discount</option>
                  <option value="FLAT">Flat amount ({event.currency})</option>
                  <option value="PERCENTAGE">Percentage (%)</option>
                </select>
              </div>
              {discountType !== 'NONE' && (
                <div>
                  <label className="block text-xs text-text-4 mb-1">
                    {discountType === 'FLAT' ? `Amount (${event.currency})` : 'Percentage (%)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={discountType === 'PERCENTAGE' ? '100' : undefined}
                    step={discountType === 'FLAT' ? '1' : '0.1'}
                    value={discountValue}
                    onChange={e => setDiscountValue(e.target.value)}
                    className="w-32 border border-brand-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                    placeholder={discountType === 'FLAT' ? '0' : '0'}
                  />
                </div>
              )}
              {discountType !== 'NONE' && (
                <div className="flex-1 min-w-48">
                  <label className="block text-xs text-text-4 mb-1">Reason (shown to customer)</label>
                  <input
                    value={discountNote}
                    onChange={e => setDiscountNote(e.target.value)}
                    placeholder="e.g. Bulk order, repeat customer…"
                    className="w-full border border-brand-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white dark:bg-cream-2 rounded-2xl border border-brand-border p-6">
            <h3 className="text-lg font-bold text-text-1 mb-3">Additional notes</h3>
            <textarea
              rows={3}
              value={trayNotes}
              onChange={e => setTrayNotes(e.target.value)}
              placeholder="Delivery included, setup time, payment terms…"
              className="w-full border border-brand-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => handleSaveDraft({} as FormData)}
              disabled={saving}
              className="px-6 py-2.5 border border-brand-border text-text-2 rounded-xl text-sm font-bold hover:bg-cream disabled:opacity-40"
            >
              {saving ? 'Saving…' : 'Save draft'}
            </button>
            <button
              onClick={() => handleSend({} as FormData)}
              disabled={sending}
              className="px-6 py-2.5 bg-brand text-white rounded-xl text-sm font-bold hover:bg-brand-hover disabled:opacity-40"
            >
              {sending ? 'Sending…' : 'Send quote to customer →'}
            </button>
          </div>

          {pref?.special_notes && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm text-amber-800">
              <strong className="font-medium">Customer note: </strong>"{pref.special_notes}"
            </div>
          )}
        </div>
      )}

      {/* ── PER HEAD MODE ── */}
      {pricingMode === 'PER_HEAD' && (
        <div className="grid grid-cols-5 gap-6">
          {/* Left: Menu builder */}
          <div className="col-span-3 space-y-5">
            <div className="bg-white dark:bg-cream-2 rounded-2xl border border-brand-border p-6">
              <h3 className="text-lg font-bold text-text-1 mb-4">Add dish to menu</h3>
              <div className="flex gap-2 mb-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-4 pointer-events-none" />
                  <input
                    type="text"
                    value={newName}
                    onChange={e => onNewNameChange(e.target.value)}
                    onBlur={() => setTimeout(() => setShowDishSuggestions(false), 150)}
                    onFocus={() => dishSuggestions.length > 0 && setShowDishSuggestions(true)}
                    onKeyDown={e => e.key === 'Enter' && addCustomItem()}
                    placeholder="Dish name — type to search library…"
                    className="w-full border border-brand-border rounded-xl pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
                  />
                  {showDishSuggestions && dishSuggestions.length > 0 && (
                    <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border rounded-xl shadow-lg overflow-hidden">
                      <div className="px-3 py-1.5 text-xs text-text-4 bg-cream border-b">
                        Global library — click to auto-fill
                      </div>
                      {dishSuggestions.map(s => (
                        <button
                          key={s.id}
                          onMouseDown={() => fillFromDishSuggestion(s)}
                          className="w-full text-left px-4 py-2.5 hover:bg-cream border-b last:border-0 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-text-1 text-sm">{s.name}</span>
                            <span className="text-xs text-text-4 flex-shrink-0">
                              {CATEGORY_LABELS[s.category] ?? s.category}
                            </span>
                          </div>
                          {s.description && (
                            <p className="text-xs text-text-4 mt-0.5 line-clamp-1">{s.description}</p>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <select value={newCat} onChange={e => setNewCat(e.target.value as MenuCategory)}
                  className="border border-brand-border rounded-xl px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30">
                  {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
                </select>
              </div>
              <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)}
                placeholder="Description (optional)"
                rows={2}
                className="w-full border border-brand-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 resize-none mb-3" />
              <div className="flex flex-wrap gap-2 mb-3">
                {[
                  { label: 'Vegetarian', val: newVeg, set: setNewVeg, color: 'green' },
                  { label: 'Halal', val: newHalal, set: setNewHalal, color: 'blue' },
                  { label: 'Jain', val: newJain, set: setNewJain, color: 'yellow' },
                  { label: 'Contains nuts', val: newNuts, set: setNewNuts, color: 'amber' },
                  { label: 'Contains gluten', val: newGluten, set: setNewGluten, color: 'amber' },
                  { label: 'Contains dairy', val: newDairy, set: setNewDairy, color: 'amber' },
                ].map(({ label, val, set, color }) => (
                  <button key={label} type="button" onClick={() => set(!val)}
                    className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${val
                      ? color === 'green' ? 'bg-green-50 text-green-700 border-green-300'
                        : color === 'blue' ? 'bg-blue-50 text-blue-700 border-blue-300'
                        : color === 'yellow' ? 'bg-yellow-50 text-yellow-700 border-yellow-300'
                        : 'bg-amber-50 text-amber-700 border-amber-300'
                      : 'bg-white text-text-4 border-brand-border hover:border-brand-border'}`}>
                    {val ? '✓ ' : ''}{label}
                  </button>
                ))}
              </div>
              <button onClick={addCustomItem} disabled={!newName.trim()}
                className="flex items-center gap-1.5 text-sm bg-brand text-white px-4 py-2 rounded-xl hover:bg-brand/90 disabled:opacity-40 font-bold">
                <Plus className="h-4 w-4" /> Add to menu
              </button>
            </div>

            {menuItems.length > 0 && (
              <div className="bg-white dark:bg-cream-2 rounded-2xl border border-brand-border p-6">
                <h3 className="text-lg font-bold text-text-1 mb-4">Menu <span className="text-text-4 font-normal text-sm">({menuItems.length} items)</span></h3>
                <div className="space-y-5">
                  {Object.entries(byCategory).map(([cat, items]) => (
                    <div key={cat}>
                      <p className="text-xs font-bold text-text-4 uppercase tracking-widest mb-2">{CATEGORY_LABELS[cat] ?? cat}</p>
                      <div className="space-y-1">
                        {items.map(item => (
                          <div key={item._localId} className="flex items-start gap-2 group py-2 border-b border-cream last:border-0">
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-medium text-text-1">{item.item_name}</span>
                              {item.description && <p className="text-xs text-text-4 mt-0.5">{item.description}</p>}
                              <div className="flex gap-1 mt-0.5">
                                {item.is_vegetarian && <span className="text-xs text-green-600 font-medium">V</span>}
                                {item.is_jain && <span className="text-xs text-yellow-600 font-medium">J</span>}
                                {item.contains_nuts && <span className="text-xs text-amber-600">🥜</span>}
                                {item.contains_gluten && <span className="text-xs text-amber-600">🌾</span>}
                                {item.contains_dairy && <span className="text-xs text-amber-600">🥛</span>}
                              </div>
                            </div>
                            <button onClick={() => removeItem(item._localId)}
                              className="opacity-0 group-hover:opacity-100 text-text-4 hover:text-red-500 transition-all mt-0.5 flex-shrink-0">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-cream-2 rounded-2xl border border-brand-border overflow-hidden">
              <button onClick={() => setShowLibrary(v => !v)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-cream transition-colors">
                <div className="flex items-center gap-2 text-sm font-medium text-text-2">
                  <BookOpen className="h-4 w-4 text-text-4" />
                  Browse dish library
                  <span className="text-xs text-text-4 font-normal">({libraryItems.length} dishes)</span>
                </div>
                {showLibrary ? <ChevronUp className="h-4 w-4 text-text-4" /> : <ChevronDown className="h-4 w-4 text-text-4" />}
              </button>
              {showLibrary && (
                <div className="p-5 pt-0 h-96">
                  <DishLibrary
                    items={libraryItems}
                    selectedIds={new Set(menuItems.map(m => m.item_name))}
                    preference={pref}
                    onToggle={item => {
                      const exists = menuItems.some(m => m.item_name === item.name)
                      if (exists) setMenuItems(prev => prev.filter(m => m.item_name !== item.name))
                      else addLibraryItem(item)
                    }}
                  />
                </div>
              )}
            </div>

            {pref?.special_notes && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm text-amber-800">
                <strong className="font-medium">Customer note: </strong>"{pref.special_notes}"
              </div>
            )}
          </div>

          {/* Right: Quote form */}
          <div className="col-span-2">
            <QuoteForm
              quoteId={quoteId}
              guestCount={event.guest_count}
              currency={event.currency}
              initialValues={{
                price_per_head: quote.price_per_head,
                notes: quote.notes,
                tasting_offered: quote.tasting_offered,
                tasting_cost: quote.tasting_cost,
                tasting_date: quote.tasting_date,
                tasting_location: quote.tasting_location,
              }}
              onSaveDraft={handleSaveDraft}
              onSend={handleSend}
              saving={saving}
              sending={sending}
            />
          </div>
        </div>
      )}
    </div>
  )
}
