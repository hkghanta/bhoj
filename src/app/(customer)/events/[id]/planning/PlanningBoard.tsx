'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Clock, MapPin, Phone, Mail, User, Plus, Pencil, Trash2, Loader2,
  Printer, Building2, UserCheck, Heart, ChevronDown, ChevronUp, X,
  Check, Circle, CalendarDays, LinkIcon,
} from 'lucide-react'

// ── Types ───────────────────────────────────────────────────────────────────

type PlatformVendor = {
  id: string
  vendor: {
    id: string
    business_name: string
    vendor_type: string
    city: string
    phone_business: string | null
    phone_cell: string | null
    email: string | null
    profile_photo_url: string | null
  }
  quote: {
    id: string
    total_estimate: string | null
    price_per_head: string | null
    currency: string
    notes: string | null
  } | null
  role: string | null
  setup_time: string | null
  service_start: string | null
  service_end: string | null
  notes: string | null
}

type PlanItem = {
  id: string
  source: 'PLATFORM' | 'EXTERNAL' | 'PERSONAL'
  title: string
  role: string | null
  contact_name: string | null
  contact_phone: string | null
  contact_email: string | null
  start_time: string | null
  end_time: string | null
  location: string | null
  notes: string | null
  sort_order: number
}

type TimelineEntry = {
  id: string
  title: string
  start_time: string
  end_time: string | null
  category: string | null
  vendor_name: string | null
  location: string | null
}

type ChecklistItem = {
  id: string
  category: string
  item_name: string
  status: string // PENDING, SEARCHING, SHORTLISTED, FINALIZED, NOT_NEEDED
  due_date: string | null
  notes: string | null
  external_vendor_name: string | null
  external_vendor_phone: string | null
  linked_plan_item_id: string | null
  linked_plan_item: { id: string; title: string } | null
}

type ReadinessMap = Record<string, { done: number; total: number }>

// Unified item for display
type UnifiedItem = {
  id: string
  source: 'PLATFORM' | 'EXTERNAL' | 'PERSONAL'
  title: string
  role: string | null
  contact_name: string | null
  contact_phone: string | null
  contact_email: string | null
  start_time: string | null
  end_time: string | null
  location: string | null
  notes: string | null
  price: string | null
  currency: string | null
  vendor_type: string | null
  profile_photo_url: string | null
}

type Props = {
  eventId: string
  eventName: string
  eventDate: string
  city: string
  venueName: string | null
  guestCount: number
  currency: string
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const VENDOR_TYPE_LABELS: Record<string, string> = {
  CATERER: 'Catering', DECORATOR: 'Decorator', PHOTOGRAPHER: 'Photography',
  VIDEOGRAPHER: 'Videography', DJ: 'DJ / Music', FLORIST: 'Florist',
  MEHENDI_ARTIST: 'Mehendi', MAKEUP_HAIR: 'Makeup & Hair', TRANSPORT: 'Transport',
  PANDIT_OFFICIANT: 'Pandit / Officiant', MC_HOST: 'MC / Host',
  INVITATION_DESIGNER: 'Invitations', SECURITY: 'Security',
  BARTENDER: 'Bartender', LIVE_BAND: 'Live Band', DHOL_PLAYER: 'Dhol Player',
  TENT_MARQUEE: 'Tent / Marquee', FOOD_TRUCK: 'Food Truck',
  DESSERT_VENDOR: 'Desserts', LIGHTING: 'Lighting',
  GAMES_ENTERTAINMENT: 'Entertainment', FURNITURE_RENTAL: 'Furniture',
  EQUIPMENT_RENTAL: 'Equipment', CHAI_STATION: 'Chai Station',
  CLASSICAL_MUSICIAN: 'Musician', CHOREOGRAPHER: 'Choreographer',
}

const SOURCE_STYLES = {
  PLATFORM: { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700', label: 'OneSeva', icon: Building2 },
  EXTERNAL: { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700', label: 'External', icon: UserCheck },
  PERSONAL: { bg: 'bg-purple-50', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-700', label: 'Personal', icon: Heart },
}

const CHECKLIST_CATEGORIES: Record<string, string> = {
  'Food & Drink': '\u{1F37D}', 'Venue & Decor': '\u{1F338}', 'Photography': '\u{1F4F7}',
  'Entertainment': '\u{1F3B5}', 'Beauty & Wellness': '\u{1F484}', 'Ceremony': '\u{1F64F}', 'Admin': '\u{1F4CB}',
}

const CHECKLIST_CATEGORY_LIST = Object.keys(CHECKLIST_CATEGORIES)

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  PENDING: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Pending' },
  SEARCHING: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Searching' },
  SHORTLISTED: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Shortlisted' },
  FINALIZED: { bg: 'bg-green-100', text: 'text-green-700', label: 'Finalized' },
  NOT_NEEDED: { bg: 'bg-gray-50', text: 'text-gray-400', label: 'Not Needed' },
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function formatCurrency(amount: string | number, currency: string) {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(n)) return ''
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)
}

// ── Add/Edit Form ───────────────────────────────────────────────────────────

function PlanItemForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial?: PlanItem | null
  onSave: (data: Omit<PlanItem, 'id' | 'sort_order'>) => void
  onCancel: () => void
  saving: boolean
}) {
  const [source, setSource] = useState<'EXTERNAL' | 'PERSONAL'>(initial?.source === 'PERSONAL' ? 'PERSONAL' : 'EXTERNAL')
  const [title, setTitle] = useState(initial?.title ?? '')
  const [role, setRole] = useState(initial?.role ?? '')
  const [contactName, setContactName] = useState(initial?.contact_name ?? '')
  const [contactPhone, setContactPhone] = useState(initial?.contact_phone ?? '')
  const [contactEmail, setContactEmail] = useState(initial?.contact_email ?? '')
  const [startTime, setStartTime] = useState(initial?.start_time ? new Date(initial.start_time).toTimeString().slice(0, 5) : '')
  const [endTime, setEndTime] = useState(initial?.end_time ? new Date(initial.end_time).toTimeString().slice(0, 5) : '')
  const [location, setLocation] = useState(initial?.location ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')

  const inputCls = 'w-full rounded-xl border-2 border-brand-border px-3.5 py-2.5 text-sm focus:border-brand/40 focus:ring-2 focus:ring-brand/20 outline-none bg-white dark:bg-cream-2 text-text-1 placeholder:text-text-4'

  return (
    <div className="bg-white dark:bg-cream-2 rounded-2xl border-2 border-brand-border p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-black text-text-1">{initial ? 'Edit Item' : 'Add to Plan'}</h3>
        <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-cream"><X className="h-4 w-4 text-text-4" /></button>
      </div>

      {/* Source toggle */}
      <div className="flex gap-2 mb-5">
        {(['EXTERNAL', 'PERSONAL'] as const).map(s => {
          const st = SOURCE_STYLES[s]
          const Icon = st.icon
          return (
            <button key={s} type="button" onClick={() => setSource(s)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold border-2 transition-all ${
                source === s ? `${st.bg} ${st.border} text-text-1` : 'border-brand-border text-text-3 hover:border-brand/40'
              }`}>
              <Icon className="h-4 w-4" />
              {s === 'EXTERNAL' ? 'External Vendor' : 'Personal / Helper'}
            </button>
          )
        })}
      </div>

      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-bold text-text-2 mb-1.5">
              {source === 'EXTERNAL' ? 'Vendor / Business Name' : 'Item / Task'} *
            </label>
            <input className={inputCls} value={title} onChange={e => setTitle(e.target.value)}
              placeholder={source === 'EXTERNAL' ? 'e.g. Rose & Bloom Decorators' : 'e.g. Bring garlands from home'} />
          </div>
          <div>
            <label className="block text-sm font-bold text-text-2 mb-1.5">Role / Service</label>
            <input className={inputCls} value={role} onChange={e => setRole(e.target.value)}
              placeholder={source === 'EXTERNAL' ? 'e.g. Decorator, Cake, Flowers' : 'e.g. Pickup, Setup, Coordination'} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-bold text-text-2 mb-1.5">Contact Name</label>
            <input className={inputCls} value={contactName} onChange={e => setContactName(e.target.value)}
              placeholder="e.g. Sarah, Uncle Raj" />
          </div>
          <div>
            <label className="block text-sm font-bold text-text-2 mb-1.5">Phone</label>
            <input className={inputCls} value={contactPhone} onChange={e => setContactPhone(e.target.value)}
              placeholder="+44 7700 900123" />
          </div>
          <div>
            <label className="block text-sm font-bold text-text-2 mb-1.5">Email</label>
            <input className={inputCls} value={contactEmail} onChange={e => setContactEmail(e.target.value)}
              placeholder="sarah@email.com" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-bold text-text-2 mb-1.5">Start Time</label>
            <input type="time" className={inputCls} value={startTime} onChange={e => setStartTime(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-bold text-text-2 mb-1.5">End Time</label>
            <input type="time" className={inputCls} value={endTime} onChange={e => setEndTime(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-bold text-text-2 mb-1.5">Location / Area</label>
            <input className={inputCls} value={location} onChange={e => setLocation(e.target.value)}
              placeholder="e.g. Main Hall, Kitchen" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-text-2 mb-1.5">Notes</label>
          <textarea className={inputCls} rows={2} value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Instructions, special requirements, things to remember..." />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onCancel}
            className="px-4 py-2.5 rounded-xl border-2 border-brand-border text-sm font-bold text-text-3 hover:bg-cream transition-colors">
            Cancel
          </button>
          <button type="button" disabled={saving || !title.trim()} onClick={() => {
            // Build datetime from time inputs using event date
            const buildDT = (t: string) => t ? new Date(`2000-01-01T${t}:00`).toISOString() : null
            onSave({
              source,
              title: title.trim(),
              role: role || null,
              contact_name: contactName || null,
              contact_phone: contactPhone || null,
              contact_email: contactEmail || null,
              start_time: buildDT(startTime),
              end_time: buildDT(endTime),
              location: location || null,
              notes: notes || null,
            })
          }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-black transition-colors disabled:opacity-60"
            style={{ boxShadow: '0 4px 16px rgba(232,85,16,0.28)' }}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {initial ? 'Update' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Task Form ──────────────────────────────────────────────────────────────

function TaskForm({
  planItems,
  onSave,
  onCancel,
  saving,
}: {
  planItems: PlanItem[]
  onSave: (data: { item_name: string; category: string; due_date: string | null; notes: string | null; linked_plan_item_id: string | null }) => void
  onCancel: () => void
  saving: boolean
}) {
  const [itemName, setItemName] = useState('')
  const [category, setCategory] = useState(CHECKLIST_CATEGORY_LIST[0])
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [linkedPlanItemId, setLinkedPlanItemId] = useState('')

  const inputCls = 'w-full rounded-xl border-2 border-brand-border px-3.5 py-2.5 text-sm focus:border-brand/40 focus:ring-2 focus:ring-brand/20 outline-none bg-white dark:bg-cream-2 text-text-1 placeholder:text-text-4'

  return (
    <div className="bg-white dark:bg-cream-2 rounded-2xl border-2 border-brand-border p-6 shadow-sm mb-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-black text-text-1">Add Task</h3>
        <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-cream"><X className="h-4 w-4 text-text-4" /></button>
      </div>
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-bold text-text-2 mb-1.5">Task Name *</label>
            <input className={inputCls} value={itemName} onChange={e => setItemName(e.target.value)}
              placeholder="e.g. Book photographer, Order flowers" />
          </div>
          <div>
            <label className="block text-sm font-bold text-text-2 mb-1.5">Category</label>
            <select className={inputCls} value={category} onChange={e => setCategory(e.target.value)}>
              {CHECKLIST_CATEGORY_LIST.map(cat => (
                <option key={cat} value={cat}>{CHECKLIST_CATEGORIES[cat]} {cat}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-bold text-text-2 mb-1.5">Due Date</label>
            <input type="date" className={inputCls} value={dueDate} onChange={e => setDueDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-bold text-text-2 mb-1.5">Link to Plan Item</label>
            <select className={inputCls} value={linkedPlanItemId} onChange={e => setLinkedPlanItemId(e.target.value)}>
              <option value="">None</option>
              {planItems.map(pi => (
                <option key={pi.id} value={pi.id}>{pi.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-text-2 mb-1.5">Notes</label>
            <input className={inputCls} value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Optional notes" />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onCancel}
            className="px-4 py-2.5 rounded-xl border-2 border-brand-border text-sm font-bold text-text-3 hover:bg-cream transition-colors">
            Cancel
          </button>
          <button type="button" disabled={saving || !itemName.trim()} onClick={() => {
            onSave({
              item_name: itemName.trim(),
              category,
              due_date: dueDate ? new Date(dueDate).toISOString() : null,
              notes: notes || null,
              linked_plan_item_id: linkedPlanItemId || null,
            })
          }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-black transition-colors disabled:opacity-60"
            style={{ boxShadow: '0 4px 16px rgba(232,85,16,0.28)' }}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add Task
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ──────────────────────────────────────────────────────────

export function PlanningBoard({ eventId, eventName, eventDate, city, venueName, guestCount, currency }: Props) {
  const [loading, setLoading] = useState(true)
  const [platformVendors, setPlatformVendors] = useState<PlatformVendor[]>([])
  const [planItems, setPlanItems] = useState<PlanItem[]>([])
  const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>([])
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([])
  const [readiness, setReadiness] = useState<ReadinessMap>({})
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<PlanItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [view, setView] = useState<'todo' | 'board' | 'timeline'>('todo')
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [printMode, setPrintMode] = useState<'summary' | 'details' | null>(null)
  const printRef = useRef<HTMLDivElement>(null)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [savingTask, setSavingTask] = useState(false)

  async function fetchData() {
    setLoading(true)
    try {
      const res = await fetch(`/api/events/${eventId}/planning`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setPlatformVendors(data.platform_vendors)
      setPlanItems(data.plan_items)
      setTimelineEntries(data.timeline_entries)
      setChecklistItems(data.checklist_items ?? [])
      setReadiness(data.readiness ?? {})
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [eventId])

  async function handleSave(data: Omit<PlanItem, 'id' | 'sort_order'>) {
    setSaving(true)
    try {
      const url = editItem
        ? `/api/events/${eventId}/plan-items/${editItem.id}`
        : `/api/events/${eventId}/plan-items`
      // Strip null/empty values so zod validation passes
      const cleaned = Object.fromEntries(
        Object.entries(data).filter(([, v]) => v !== null && v !== '')
      )
      const res = await fetch(url, {
        method: editItem ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleaned),
      })
      if (!res.ok) throw new Error()
      setShowForm(false)
      setEditItem(null)
      fetchData()
    } catch { /* ignore */ } finally {
      setSaving(false)
    }
  }

  async function handleDelete(itemId: string) {
    if (!confirm('Remove this item from the plan?')) return
    try {
      await fetch(`/api/events/${eventId}/plan-items/${itemId}`, { method: 'DELETE' })
      fetchData()
    } catch { /* ignore */ }
  }

  async function toggleChecklistStatus(item: ChecklistItem) {
    const newStatus = item.status === 'FINALIZED' ? 'PENDING' : 'FINALIZED'
    try {
      await fetch(`/api/events/${eventId}/checklist/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      fetchData()
    } catch { /* ignore */ }
  }

  async function updateChecklistLink(itemId: string, linkedPlanItemId: string | null) {
    try {
      await fetch(`/api/events/${eventId}/checklist/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linked_plan_item_id: linkedPlanItemId }),
      })
      fetchData()
    } catch { /* ignore */ }
  }

  async function handleAddTask(data: { item_name: string; category: string; due_date: string | null; notes: string | null; linked_plan_item_id: string | null }) {
    setSavingTask(true)
    try {
      const res = await fetch(`/api/events/${eventId}/checklist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        console.error('[PlanningBoard] Add task failed:', res.status, err)
        alert(`Failed to add task: ${err.detail || err.error || res.statusText}`)
        return
      }
      setShowTaskForm(false)
      fetchData()
    } catch (e) {
      console.error('[PlanningBoard] Add task error:', e)
      alert('Failed to add task. Check console for details.')
    } finally {
      setSavingTask(false)
    }
  }

  function toggleExpand(id: string) {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
  }

  // Build unified list
  const unified: UnifiedItem[] = [
    ...platformVendors.map(pv => ({
      id: `pv-${pv.id}`,
      source: 'PLATFORM' as const,
      title: pv.vendor.business_name,
      role: pv.role || VENDOR_TYPE_LABELS[pv.vendor.vendor_type] || pv.vendor.vendor_type,
      contact_name: null,
      contact_phone: pv.vendor.phone_business || pv.vendor.phone_cell,
      contact_email: pv.vendor.email,
      start_time: pv.service_start,
      end_time: pv.service_end,
      location: null,
      notes: pv.notes,
      price: pv.quote?.total_estimate ?? null,
      currency: pv.quote?.currency ?? currency,
      vendor_type: pv.vendor.vendor_type,
      profile_photo_url: pv.vendor.profile_photo_url,
    })),
    ...planItems.map(pi => ({
      id: `pi-${pi.id}`,
      source: pi.source as 'EXTERNAL' | 'PERSONAL',
      title: pi.title,
      role: pi.role,
      contact_name: pi.contact_name,
      contact_phone: pi.contact_phone,
      contact_email: pi.contact_email,
      start_time: pi.start_time,
      end_time: pi.end_time,
      location: pi.location,
      notes: pi.notes,
      price: null,
      currency: null,
      vendor_type: null,
      profile_photo_url: null,
    })),
  ]

  // Sort: items with start_time first (by time), then items without
  const withTime = unified.filter(i => i.start_time).sort((a, b) => new Date(a.start_time!).getTime() - new Date(b.start_time!).getTime())
  const withoutTime = unified.filter(i => !i.start_time)
  const sorted = [...withTime, ...withoutTime]


  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-text-4" /></div>
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-text-1">Event Plan</h1>
          <p className="text-text-3 mt-1">Your complete event runsheet — vendors, helpers, and timeline.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative print:hidden">
            <button onClick={() => setPrintMode(prev => prev ? null : 'summary')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-brand-border text-sm font-bold text-text-2 hover:bg-cream transition-colors">
              <Printer className="h-4 w-4" /> Print
            </button>
            {printMode !== null && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-cream-2 rounded-xl border-2 border-brand-border shadow-lg z-20 overflow-hidden">
                <button onClick={() => { setPrintMode('summary'); setTimeout(() => { window.print(); setPrintMode(null) }, 300) }}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-cream transition-colors border-b border-brand-border/40">
                  <p className="font-bold text-text-1">Summary</p>
                  <p className="text-xs text-text-4">Compact table view</p>
                </button>
                <button onClick={() => { setPrintMode('details'); setTimeout(() => { window.print(); setPrintMode(null) }, 300) }}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-cream transition-colors">
                  <p className="font-bold text-text-1">Full Details</p>
                  <p className="text-xs text-text-4">Contact, notes, everything</p>
                </button>
              </div>
            )}
          </div>
          {view !== 'todo' && (
            <button onClick={() => { setEditItem(null); setShowForm(true) }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-black transition-colors print:hidden"
              style={{ boxShadow: '0 4px 16px rgba(232,85,16,0.28)' }}>
              <Plus className="h-4 w-4" /> Add Item
            </button>
          )}
        </div>
      </div>

      {/* View toggle */}
      <div className="flex gap-2 mb-6 print:hidden">
        {([
          { key: 'todo', label: 'To-Do List' },
          { key: 'board', label: 'Event Day' },
          { key: 'timeline', label: 'Timeline' },
        ] as const).map(v => (
          <button key={v.key} onClick={() => setView(v.key as 'todo' | 'board' | 'timeline')}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${
              view === v.key ? 'bg-text-1 text-white' : 'bg-cream text-text-3 hover:bg-cream-2'
            }`}>
            {v.label}
          </button>
        ))}
      </div>

      {/* Add/Edit form */}
      {showForm && (
        <div className="mb-6 print:hidden">
          <PlanItemForm
            initial={editItem}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditItem(null) }}
            saving={saving}
          />
        </div>
      )}

      {/* Print header (hidden on screen) */}
      <div ref={printRef} className="hidden print:block mb-4 border-b-2 border-black pb-3">
        <h1 className="text-2xl font-black">{eventName}</h1>
        <p className="text-sm mt-1">
          {formatDate(eventDate)}
          {venueName && ` · ${venueName}`}
          {city && ` · ${city}`}
        </p>
      </div>

      {/* Print summary table (hidden on screen) */}
      {printMode === 'summary' && sorted.length > 0 && (
        <table className="hidden print:table w-full text-[11px] border-collapse mb-4" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '14%' }} />
            <col style={{ width: '20%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '16%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '26%' }} />
          </colgroup>
          <thead>
            <tr className="border-b-2 border-black text-left bg-gray-100">
              <th className="py-2 px-2 font-bold">Time</th>
              <th className="py-2 px-2 font-bold">Item</th>
              <th className="py-2 px-2 font-bold">Role</th>
              <th className="py-2 px-2 font-bold">Contact</th>
              <th className="py-2 px-2 font-bold">Location</th>
              <th className="py-2 px-2 font-bold">Notes</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((item, i) => (
              <tr key={item.id} className={`border-b border-gray-300 ${i % 2 === 0 ? '' : 'bg-gray-50'}`}>
                <td className="py-2 px-2 whitespace-nowrap align-top">
                  {item.start_time ? formatTime(item.start_time) : '—'}
                  {item.end_time && <><br /><span className="text-gray-500">to {formatTime(item.end_time)}</span></>}
                </td>
                <td className="py-2 px-2 font-medium align-top">{item.title}</td>
                <td className="py-2 px-2 align-top">{item.role ?? '—'}</td>
                <td className="py-2 px-2 align-top">
                  {item.contact_name && <span className="font-medium">{item.contact_name}</span>}
                  {item.contact_phone && <><br /><span className="text-gray-600">{item.contact_phone}</span></>}
                  {!item.contact_name && !item.contact_phone && '—'}
                </td>
                <td className="py-2 px-2 align-top">{item.location ?? '—'}</td>
                <td className="py-2 px-2 text-gray-600 align-top" style={{ wordBreak: 'break-word' }}>
                  {item.notes ? `${item.notes.slice(0, 80)}${item.notes.length > 80 ? '…' : ''}` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* ── To-Do List View ──────────────────────────────────────── */}
      {view === 'todo' && (
        <div className="print:hidden">
          {/* Add Task button */}
          {!showTaskForm && (
            <button onClick={() => setShowTaskForm(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-black transition-colors mb-6"
              style={{ boxShadow: '0 4px 16px rgba(232,85,16,0.28)' }}>
              <Plus className="h-4 w-4" /> Add Task
            </button>
          )}

          {/* Inline add task form */}
          {showTaskForm && (
            <TaskForm
              planItems={planItems}
              onSave={handleAddTask}
              onCancel={() => setShowTaskForm(false)}
              saving={savingTask}
            />
          )}

          {checklistItems.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-brand-border rounded-2xl">
              <Circle className="h-10 w-10 text-text-4 mx-auto mb-3" />
              <p className="text-base text-text-3 font-bold">No tasks yet</p>
              <p className="text-sm text-text-4 mt-1">
                Add pre-event tasks like booking vendors, ordering decorations, confirming menus.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(
                checklistItems.reduce<Record<string, ChecklistItem[]>>((acc, item) => {
                  const cat = item.category || 'Other'
                  if (!acc[cat]) acc[cat] = []
                  acc[cat].push(item)
                  return acc
                }, {})
              ).map(([category, items]) => (
                <div key={category}>
                  <h3 className="text-sm font-black text-text-2 mb-3 flex items-center gap-2">
                    <span>{CHECKLIST_CATEGORIES[category] || '\u{1F4CB}'}</span> {category}
                    <span className="text-xs font-medium text-text-4">
                      ({items.filter(i => i.status === 'FINALIZED').length}/{items.length} done)
                    </span>
                  </h3>
                  <div className="space-y-2">
                    {items.map(item => {
                      const ss = STATUS_STYLES[item.status] || STATUS_STYLES.PENDING
                      const isDone = item.status === 'FINALIZED'
                      return (
                        <div key={item.id} className={`rounded-xl border-2 ${isDone ? 'border-green-200 bg-green-50/50' : 'border-brand-border bg-white dark:bg-cream-2'} p-3 flex items-start gap-3 transition-colors`}>
                          {/* Checkbox */}
                          <button onClick={() => toggleChecklistStatus(item)}
                            className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                              isDone ? 'bg-green-500 border-green-500 text-white' : 'border-brand-border hover:border-brand/40'
                            }`}>
                            {isDone && <Check className="h-3 w-3" />}
                          </button>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`font-bold text-sm ${isDone ? 'line-through text-text-4' : 'text-text-1'}`}>
                                {item.item_name}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ss.bg} ${ss.text}`}>
                                {ss.label}
                              </span>
                              {item.linked_plan_item && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 flex items-center gap-1">
                                  <LinkIcon className="h-2.5 w-2.5" /> {item.linked_plan_item.title}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-text-4 flex-wrap">
                              {item.due_date && (
                                <span className="flex items-center gap-1">
                                  <CalendarDays className="h-3 w-3" />
                                  {new Date(item.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                              )}
                              {item.external_vendor_name && (
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" /> {item.external_vendor_name}
                                </span>
                              )}
                              {item.notes && (
                                <span className="text-text-4 truncate max-w-[200px]">{item.notes}</span>
                              )}
                            </div>
                          </div>

                          {/* Link dropdown */}
                          <select
                            value={item.linked_plan_item_id || ''}
                            onChange={e => updateChecklistLink(item.id, e.target.value || null)}
                            className="text-xs rounded-lg border border-brand-border px-2 py-1 bg-white dark:bg-cream-2 text-text-3 max-w-[140px] truncate"
                            title="Link to plan item"
                          >
                            <option value="">No link</option>
                            {planItems.map(pi => (
                              <option key={pi.id} value={pi.id}>{pi.title}</option>
                            ))}
                          </select>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {view !== 'todo' && sorted.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-brand-border rounded-2xl print:hidden">
          <User className="h-10 w-10 text-text-4 mx-auto mb-3" />
          <p className="text-base text-text-3 font-bold">No items in your plan yet</p>
          <p className="text-sm text-text-4 mt-1">
            Booked vendors appear automatically. Add external vendors and personal helpers manually.
          </p>
        </div>
      ) : view === 'board' ? (
        /* ── Board View ─────────────────────────────────────────────── */
        <div className={`space-y-3 ${printMode === 'summary' ? 'print:hidden' : ''}`}>
          {/* Readiness summary bar */}
          {(() => {
            const readinessEntries = Object.values(readiness)
            if (readinessEntries.length === 0) return null
            const totalReady = readinessEntries.filter(r => r.done === r.total).length
            const totalItems = readinessEntries.length
            const pct = Math.round((totalReady / totalItems) * 100)
            return (
              <div className="rounded-2xl border-2 border-brand-border bg-cream p-4 mb-3 print:hidden">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-black text-text-1">{totalReady}/{totalItems} items ready</span>
                  <span className="text-xs font-bold text-text-3">{pct}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-brand-border/40 overflow-hidden">
                  <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })()}
          {sorted.map(item => {
            const st = SOURCE_STYLES[item.source]
            const Icon = st.icon
            const isExpanded = expanded[item.id]
            // Readiness badge for plan items
            const realPlanId = item.source !== 'PLATFORM' ? item.id.replace('pi-', '') : null
            const itemReadiness = realPlanId ? readiness[realPlanId] : null

            return (
              <div key={item.id} className={`rounded-2xl border-2 ${st.border} ${st.bg} overflow-hidden transition-shadow hover:shadow-md print:border print:shadow-none`}>
                {/* Main row */}
                <div className="flex items-center gap-4 p-4 cursor-pointer" onClick={() => toggleExpand(item.id)}>
                  {/* Icon / Photo */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${st.badge}`}>
                    {item.profile_photo_url ? (
                      <img src={item.profile_photo_url} alt="" className="w-10 h-10 rounded-xl object-cover" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-black text-text-1 text-base">{item.title}</h3>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${st.badge}`}>{st.label}</span>
                      {item.role && <span className="text-xs font-semibold text-text-3 bg-white/60 px-2 py-0.5 rounded-full">{item.role}</span>}
                      {itemReadiness && (
                        itemReadiness.done === itemReadiness.total ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Ready ✓</span>
                        ) : itemReadiness.done > 0 ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">{itemReadiness.done}/{itemReadiness.total} tasks done</span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">Not ready</span>
                        )
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-text-3 flex-wrap">
                      {item.start_time && (
                        <span className="flex items-center gap-1 font-medium">
                          <Clock className="h-3.5 w-3.5" />
                          {formatTime(item.start_time)}
                          {item.end_time && <> — {formatTime(item.end_time)}</>}
                        </span>
                      )}
                      {item.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" /> {item.location}
                        </span>
                      )}
                      {item.price && item.currency && (
                        <span className="font-bold text-text-1">{formatCurrency(item.price, item.currency)}</span>
                      )}
                    </div>
                  </div>

                  {/* Expand toggle */}
                  <div className="flex-shrink-0 print:hidden">
                    {isExpanded ? <ChevronUp className="h-5 w-5 text-text-4" /> : <ChevronDown className="h-5 w-5 text-text-4" />}
                  </div>
                </div>

                {/* Expanded details — always visible in print */}
                {(isExpanded || false) && (
                  <div className="border-t border-brand-border/40 px-4 py-4 bg-white/50 print:hidden">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-sm">
                      {(item.contact_name || item.contact_phone || item.contact_email) && (
                        <div>
                          <p className="text-xs font-bold uppercase text-text-4 mb-1">Contact</p>
                          {item.contact_name && <p className="flex items-center gap-1.5 text-text-1 font-medium"><User className="h-3.5 w-3.5 text-text-3" /> {item.contact_name}</p>}
                          {item.contact_phone && <p className="flex items-center gap-1.5 text-text-2 mt-0.5"><Phone className="h-3.5 w-3.5 text-text-3" /> {item.contact_phone}</p>}
                          {item.contact_email && <p className="flex items-center gap-1.5 text-text-2 mt-0.5"><Mail className="h-3.5 w-3.5 text-text-3" /> {item.contact_email}</p>}
                        </div>
                      )}
                      {item.start_time && (
                        <div>
                          <p className="text-xs font-bold uppercase text-text-4 mb-1">Schedule</p>
                          <p className="text-text-1 font-medium">
                            {formatTime(item.start_time)}
                            {item.end_time && <> — {formatTime(item.end_time)}</>}
                          </p>
                        </div>
                      )}
                      {item.location && (
                        <div>
                          <p className="text-xs font-bold uppercase text-text-4 mb-1">Location</p>
                          <p className="text-text-1 font-medium">{item.location}</p>
                        </div>
                      )}
                    </div>
                    {item.notes && (
                      <div className="mt-3 pt-3 border-t border-brand-border/30">
                        <p className="text-xs font-bold uppercase text-text-4 mb-1">Notes</p>
                        <p className="text-sm text-text-2">{item.notes}</p>
                      </div>
                    )}
                    {/* Edit/Delete for non-platform items */}
                    {item.source !== 'PLATFORM' && (
                      <div className="flex gap-2 mt-4 print:hidden">
                        <button onClick={(e) => {
                          e.stopPropagation()
                          const pi = planItems.find(p => `pi-${p.id}` === item.id)
                          if (pi) { setEditItem(pi); setShowForm(true) }
                        }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-brand-border text-xs font-bold text-text-3 hover:bg-cream">
                          <Pencil className="h-3 w-3" /> Edit
                        </button>
                        <button onClick={(e) => {
                          e.stopPropagation()
                          const realId = item.id.replace('pi-', '')
                          handleDelete(realId)
                        }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-xs font-bold text-red-500 hover:bg-red-50">
                          <Trash2 className="h-3 w-3" /> Remove
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Print-only: summary (compact) */}
                {printMode === 'summary' && (
                  <div className="hidden print:block border-t border-gray-200 px-4 py-1.5 text-xs">
                    <p className="text-gray-600">
                      {[
                        item.contact_name,
                        item.contact_phone,
                        item.location && `@ ${item.location}`,
                      ].filter(Boolean).join(' · ')}
                      {item.notes && ` — ${item.notes.slice(0, 80)}${item.notes.length > 80 ? '…' : ''}`}
                    </p>
                  </div>
                )}
                {/* Print-only: full details */}
                {printMode === 'details' && (
                  <div className="hidden print:block border-t border-gray-200 px-4 py-3 text-xs">
                    <div className="grid grid-cols-3 gap-2">
                      {(item.contact_name || item.contact_phone || item.contact_email) && (
                        <div>
                          <p className="font-bold uppercase mb-0.5">Contact</p>
                          {item.contact_name && <p>{item.contact_name}</p>}
                          {item.contact_phone && <p>{item.contact_phone}</p>}
                          {item.contact_email && <p>{item.contact_email}</p>}
                        </div>
                      )}
                      {item.start_time && (
                        <div>
                          <p className="font-bold uppercase mb-0.5">Schedule</p>
                          <p>{formatTime(item.start_time)}{item.end_time && ` — ${formatTime(item.end_time)}`}</p>
                        </div>
                      )}
                      {item.location && (
                        <div>
                          <p className="font-bold uppercase mb-0.5">Location</p>
                          <p>{item.location}</p>
                        </div>
                      )}
                    </div>
                    {item.notes && <p className="mt-1"><span className="font-bold">Notes:</span> {item.notes}</p>}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : view === 'timeline' ? (
        /* ── Timeline View ──────────────────────────────────────────── */
        <div className={`relative pl-8 w-full ${printMode === 'summary' ? 'print:hidden' : ''}`}>
          <div className="absolute left-3.5 top-0 bottom-0 w-0.5 bg-brand-border" />
          <div className="space-y-4 w-full">
            {withTime.map(item => {
              const st = SOURCE_STYLES[item.source]

              return (
                <div key={item.id} className="relative w-full">
                  <div className={`absolute -left-[18px] top-5 w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                    item.source === 'PLATFORM' ? 'bg-blue-500' : item.source === 'EXTERNAL' ? 'bg-amber-500' : 'bg-purple-500'
                  }`} />
                  <div className={`rounded-2xl border-2 ${st.border} bg-white p-4 shadow-sm w-full`}>
                    <div className="flex items-center gap-2 text-sm text-text-3 mb-2">
                      <Clock className="h-3.5 w-3.5" />
                      <span className="font-bold text-text-1">
                        {formatTime(item.start_time!)}
                        {item.end_time && <> — {formatTime(item.end_time)}</>}
                      </span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${st.badge}`}>{st.label}</span>
                    </div>
                    <div className="flex items-start justify-between gap-6">
                      <div className="min-w-0">
                        <h3 className="font-black text-text-1">{item.title}</h3>
                        {item.role && <p className="text-sm text-text-3">{item.role}</p>}
                        {item.notes && <p className="text-xs text-text-4 mt-1.5">{item.notes}</p>}
                      </div>
                      {(item.contact_name || item.contact_phone || item.location) && (
                        <div className="flex-shrink-0 text-right space-y-1 text-xs text-text-3">
                          {item.contact_name && <p className="flex items-center justify-end gap-1 font-medium text-text-2"><User className="h-3 w-3" /> {item.contact_name}</p>}
                          {item.contact_phone && <p className="flex items-center justify-end gap-1"><Phone className="h-3 w-3" /> {item.contact_phone}</p>}
                          {item.location && <p className="flex items-center justify-end gap-1"><MapPin className="h-3 w-3" /> {item.location}</p>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Items without time */}
          {withoutTime.length > 0 && (
            <div className="mt-8">
              <p className="text-sm font-black text-text-2 mb-3 -ml-8">Other Items (no time set)</p>
              <div className="space-y-3 -ml-8">
                {withoutTime.map(item => {
                  const st = SOURCE_STYLES[item.source]
                  return (
                    <div key={item.id} className={`rounded-xl border ${st.border} ${st.bg} p-3`}>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${st.badge}`}>{st.label}</span>
                        <span className="font-bold text-sm text-text-1">{item.title}</span>
                        {item.role && <span className="text-xs text-text-3">· {item.role}</span>}
                      </div>
                      {item.contact_name && <p className="text-xs text-text-3 mt-1">{item.contact_name} {item.contact_phone && `· ${item.contact_phone}`}</p>}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Summary footer */}
      {sorted.length > 0 && (
        <div className="mt-8 p-4 rounded-2xl bg-cream border-2 border-brand-border/60 print:hidden">
          <div className="flex flex-wrap gap-6 text-sm">
            <div>
              <span className="text-text-4 font-medium">Total items</span>
              <p className="text-lg font-black text-text-1">{sorted.length}</p>
            </div>
            <div>
              <span className="text-text-4 font-medium">Platform vendors</span>
              <p className="text-lg font-black text-blue-700">{platformVendors.length}</p>
            </div>
            <div>
              <span className="text-text-4 font-medium">External vendors</span>
              <p className="text-lg font-black text-amber-700">{planItems.filter(p => p.source === 'EXTERNAL').length}</p>
            </div>
            <div>
              <span className="text-text-4 font-medium">Personal / helpers</span>
              <p className="text-lg font-black text-purple-700">{planItems.filter(p => p.source === 'PERSONAL').length}</p>
            </div>
            {platformVendors.some(pv => pv.quote?.total_estimate) && (
              <div className="ml-auto">
                <span className="text-text-4 font-medium">Total booked</span>
                <p className="text-lg font-black text-text-1">
                  {formatCurrency(
                    platformVendors.reduce((sum, pv) => sum + (pv.quote?.total_estimate ? parseFloat(pv.quote.total_estimate) : 0), 0),
                    currency
                  )}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Print footer */}
      <div className="hidden print:block fixed bottom-0 left-0 right-0 text-center text-[9px] text-gray-400 py-2 border-t border-gray-200">
        Powered by OneSeva · oneseva.com
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          nav, header, aside, .print\\:hidden { display: none !important; }
          .hidden.print\\:block { display: block !important; }
          .hidden.print\\:table { display: table !important; }
          body { font-size: 11px; }
          @page { margin: 1.5cm 1.5cm 2cm; }
        }
      `}</style>
    </div>
  )
}
