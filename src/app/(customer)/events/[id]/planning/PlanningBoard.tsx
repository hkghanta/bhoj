'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Clock, MapPin, Phone, Mail, User, Plus, Pencil, Trash2, Loader2,
  Printer, Building2, UserCheck, Heart, ChevronDown, ChevronUp, X,
  Check, Circle, CalendarDays, LinkIcon, LayoutList, Network,
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

// ── Workflow templates per service type ────────────────────────────────────
const SERVICE_WORKFLOW_TEMPLATES: Record<string, string[]> = {
  CATERER: ['Identify vendors', 'Shortlist vendors', 'Get quotes', 'Finalize vendor', 'Sign contract', 'Pay deposit', 'Confirm final menu & headcount', 'Final payment'],
  DECORATOR: ['Identify decorators', 'Shortlist decorators', 'Get quotes', 'Finalize decorator', 'Share theme & mood board', 'Confirm setup plan', 'Pay deposit', 'Final walkthrough'],
  PHOTOGRAPHER: ['Identify photographers', 'Review portfolios', 'Get quotes', 'Finalize photographer', 'Sign contract', 'Share shot list', 'Pay deposit', 'Pre-event meeting'],
  DJ: ['Identify DJs', 'Shortlist DJs', 'Get quotes', 'Finalize DJ', 'Share song preferences', 'Confirm equipment needs', 'Pay deposit'],
  MEHENDI_ARTIST: ['Identify artists', 'Review portfolios', 'Get quotes', 'Finalize artist', 'Confirm designs', 'Pay deposit'],
  MAKEUP_HAIR: ['Identify MUA', 'Get quotes', 'Book trial', 'Finalize MUA', 'Share outfit photos', 'Confirm schedule', 'Pay deposit'],
  FLORIST: ['Identify florists', 'Get quotes', 'Finalize florist', 'Confirm arrangements', 'Pay deposit'],
  PANDIT_OFFICIANT: ['Identify pandit / officiant', 'Confirm availability', 'Discuss ceremony details', 'Finalize officiant', 'Share rituals list'],
  MC_HOST: ['Identify MC / host', 'Get quotes', 'Finalize MC', 'Share event flow & script', 'Pre-event rehearsal'],
  TRANSPORT: ['Identify transport', 'Get quotes', 'Finalize transport', 'Confirm routes & timing', 'Pay deposit'],
}

// Fallback template for unknown types
const DEFAULT_WORKFLOW = ['Identify vendors', 'Get quotes', 'Shortlist', 'Finalize vendor', 'Pay deposit', 'Confirm details']

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
        <h3 className="text-lg font-extrabold tracking-tight text-text-1">{initial ? 'Edit Item' : 'Add to Plan'}</h3>
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
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-extrabold tracking-tight transition-colors disabled:opacity-60"
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
        <h3 className="text-lg font-extrabold tracking-tight text-text-1">Add Task</h3>
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
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-extrabold tracking-tight transition-colors disabled:opacity-60"
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
  const [printMode, setPrintMode] = useState<'summary' | 'details' | 'todo' | null>(null)
  const printRef = useRef<HTMLDivElement>(null)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [savingTask, setSavingTask] = useState(false)
  const [todoGroupBy, setTodoGroupBy] = useState<'category' | 'activity'>('category')
  const [printCategories, setPrintCategories] = useState<Set<string>>(new Set())
  const [showPrintFilter, setShowPrintFilter] = useState(false)

  async function fetchData() {
    setLoading(true)
    try {
      const res = await fetch(`/api/events/${eventId}/planning`)
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}))
        console.error('[PlanningBoard] fetchData failed:', res.status, errBody)
        return
      }
      const data = await res.json()
      console.log('[PlanningBoard] fetched checklist_items:', data.checklist_items?.length ?? 0)
      setPlatformVendors(data.platform_vendors)
      setPlanItems(data.plan_items)
      setTimelineEntries(data.timeline_entries)
      setChecklistItems(data.checklist_items ?? [])
      setReadiness(data.readiness ?? {})
    } catch (e) {
      console.error('[PlanningBoard] fetchData error:', e)
    } finally {
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

  async function deleteChecklistItem(itemId: string) {
    try {
      await fetch(`/api/events/${eventId}/checklist/${itemId}`, { method: 'DELETE' })
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
      await fetchData()
    } catch (e) {
      console.error('[PlanningBoard] Add task error:', e)
      alert('Failed to add task. Check console for details.')
    } finally {
      setSavingTask(false)
    }
  }

  const [addingSubtask, setAddingSubtask] = useState<string | null>(null) // unified item id
  const [subtaskName, setSubtaskName] = useState('')
  const [savingSubtask, setSavingSubtask] = useState(false)

  async function handleAddSubtask(planItemId: string, category: string) {
    if (!subtaskName.trim()) return
    setSavingSubtask(true)
    try {
      const res = await fetch(`/api/events/${eventId}/checklist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_name: subtaskName.trim(),
          category,
          linked_plan_item_id: planItemId,
        }),
      })
      if (res.ok) {
        setSubtaskName('')
        setAddingSubtask(null)
        await fetchData()
      }
    } catch { /* ignore */ } finally {
      setSavingSubtask(false)
    }
  }

  async function addWorkflowTemplate(planItemId: string, vendorType: string, category: string) {
    const steps = SERVICE_WORKFLOW_TEMPLATES[vendorType] ?? DEFAULT_WORKFLOW
    for (const step of steps) {
      await fetch(`/api/events/${eventId}/checklist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_name: step,
          category,
          linked_plan_item_id: planItemId,
        }),
      })
    }
    await fetchData()
  }

  function toggleExpand(id: string) {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
  }

  // Build map of plan item id → linked checklist items
  const subtasksByPlanItem: Record<string, ChecklistItem[]> = {}
  for (const ci of checklistItems) {
    if (!ci.linked_plan_item_id) continue
    if (!subtasksByPlanItem[ci.linked_plan_item_id]) subtasksByPlanItem[ci.linked_plan_item_id] = []
    subtasksByPlanItem[ci.linked_plan_item_id].push(ci)
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
          <h1 className="text-3xl font-extrabold tracking-tight tracking-tight text-text-1">Event Plan</h1>
          <p className="text-text-3 mt-1">Your complete event runsheet — vendors, helpers, and timeline.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative print:hidden">
            <button onClick={() => { setPrintMode(prev => prev ? null : 'summary'); setShowPrintFilter(false) }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-brand-border text-sm font-bold text-text-2 hover:bg-cream transition-colors">
              <Printer className="h-4 w-4" /> Print
            </button>
            {printMode !== null && (
              <div className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-cream-2 rounded-xl border-2 border-brand-border shadow-lg z-20 overflow-hidden">
                {view === 'todo' ? (
                  <>
                    {!showPrintFilter ? (
                      <>
                        <button onClick={() => {
                          setPrintCategories(new Set()) // empty = all
                          setPrintMode('todo')
                          setTimeout(() => { window.print(); setPrintMode(null) }, 300)
                        }}
                          className="w-full text-left px-4 py-3 text-sm hover:bg-cream transition-colors border-b border-brand-border/40">
                          <p className="font-bold text-text-1">Print All</p>
                          <p className="text-xs text-text-4">All tasks grouped by {todoGroupBy}</p>
                        </button>
                        <button onClick={() => {
                          const cats = new Set(checklistItems.map(i => i.category || 'Other'))
                          setPrintCategories(cats)
                          setShowPrintFilter(true)
                        }}
                          className="w-full text-left px-4 py-3 text-sm hover:bg-cream transition-colors">
                          <p className="font-bold text-text-1">Select Categories...</p>
                          <p className="text-xs text-text-4">Choose which categories to print</p>
                        </button>
                      </>
                    ) : (
                      <div className="p-3">
                        <p className="text-xs font-extrabold tracking-tight text-text-2 mb-2">Select categories to print:</p>
                        <div className="space-y-1.5 max-h-48 overflow-y-auto">
                          {Array.from(new Set(checklistItems.map(i => i.category || 'Other'))).sort().map(cat => (
                            <label key={cat} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-cream rounded px-1 py-0.5">
                              <input type="checkbox" checked={printCategories.has(cat)}
                                onChange={() => {
                                  const next = new Set(printCategories)
                                  next.has(cat) ? next.delete(cat) : next.add(cat)
                                  setPrintCategories(next)
                                }}
                                className="rounded border-brand-border" />
                              <span>{CHECKLIST_CATEGORIES[cat] || '📋'}</span>
                              <span className="text-text-2">{cat}</span>
                              <span className="text-text-4 text-xs ml-auto">
                                ({checklistItems.filter(i => (i.category || 'Other') === cat).length})
                              </span>
                            </label>
                          ))}
                        </div>
                        <div className="flex gap-2 mt-3 pt-2 border-t border-brand-border/40">
                          <button onClick={() => setShowPrintFilter(false)}
                            className="flex-1 text-xs font-bold text-text-3 hover:text-text-1 py-1.5">Cancel</button>
                          <button onClick={() => {
                            setShowPrintFilter(false)
                            setPrintMode('todo')
                            setTimeout(() => { window.print(); setPrintMode(null); setPrintCategories(new Set()) }, 300)
                          }}
                            disabled={printCategories.size === 0}
                            className="flex-1 text-xs font-bold bg-brand text-white rounded-lg py-1.5 hover:bg-brand-hover disabled:opacity-50">
                            Print {printCategories.size} {printCategories.size === 1 ? 'category' : 'categories'}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
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
                  </>
                )}
              </div>
            )}
          </div>
          {view !== 'todo' && (
            <button onClick={() => { setEditItem(null); setShowForm(true) }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-extrabold tracking-tight transition-colors print:hidden"
              style={{ boxShadow: '0 4px 16px rgba(232,85,16,0.28)' }}>
              <Plus className="h-4 w-4" /> Add Item
            </button>
          )}
        </div>
      </div>

      {/* View toggle */}
      <div className="flex gap-2 mb-6 print:hidden">
        {([
          { key: 'todo', label: 'To-Do List', count: checklistItems.length },
          { key: 'board', label: 'Event Day', count: sorted.length },
          { key: 'timeline', label: 'Timeline', count: timelineEntries.length },
        ] as const).map(v => (
          <button key={v.key} onClick={() => setView(v.key as 'todo' | 'board' | 'timeline')}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-colors flex items-center gap-1.5 ${
              view === v.key ? 'bg-text-1 text-white' : 'bg-cream text-text-3 hover:bg-cream-2'
            }`}>
            {v.label}
            {v.count > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                view === v.key ? 'bg-white/20 text-white' : 'bg-brand-border/30 text-text-4'
              }`}>{v.count}</span>
            )}
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
        <h1 className="text-2xl font-extrabold tracking-tight">{eventName}</h1>
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

      {/* Print full details (hidden on screen) */}
      {printMode === 'details' && sorted.length > 0 && (
        <div className="hidden print:block space-y-0">
          {sorted.map((item, i) => {
            const st = SOURCE_STYLES[item.source]
            const realPlanId = item.source !== 'PLATFORM' ? item.id.replace('pi-', '') : null
            const linkedTasks = realPlanId ? (subtasksByPlanItem[realPlanId] ?? []) : []
            return (
              <div key={item.id} className={`py-3 ${i > 0 ? 'border-t border-gray-300' : ''}`}>
                {/* Row 1: Title + time + price */}
                <div className="flex items-baseline justify-between gap-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-extrabold tracking-tight">{item.title}</span>
                    <span className="text-[10px] font-bold text-gray-500 uppercase">{st.label}</span>
                    {item.role && <span className="text-[10px] text-gray-500">· {item.role}</span>}
                  </div>
                  <div className="flex items-baseline gap-3 flex-shrink-0 text-xs">
                    {item.start_time && (
                      <span className="font-bold">
                        {formatTime(item.start_time)}{item.end_time && ` – ${formatTime(item.end_time)}`}
                      </span>
                    )}
                    {item.price && item.currency && (
                      <span className="font-extrabold tracking-tight">{formatCurrency(item.price, item.currency)}</span>
                    )}
                  </div>
                </div>

                {/* Row 2: Contact + location details */}
                {(item.contact_name || item.contact_phone || item.contact_email || item.location) && (
                  <div className="flex gap-6 mt-1 text-[11px] text-gray-600">
                    {(item.contact_name || item.contact_phone || item.contact_email) && (
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-gray-800">Contact:</span>
                        {[item.contact_name, item.contact_phone, item.contact_email].filter(Boolean).join(' · ')}
                      </div>
                    )}
                    {item.location && (
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-gray-800">Location:</span> {item.location}
                      </div>
                    )}
                  </div>
                )}

                {/* Row 3: Notes */}
                {item.notes && (
                  <p className="mt-1 text-[11px] text-gray-500">
                    <span className="font-bold text-gray-700">Notes:</span> {item.notes}
                  </p>
                )}

                {/* Row 4: Sub-tasks */}
                {linkedTasks.length > 0 && (
                  <div className="mt-1.5 ml-3 border-l-2 border-gray-200 pl-3">
                    <p className="text-[10px] font-bold text-gray-500 uppercase mb-0.5">
                      Tasks ({linkedTasks.filter(t => t.status === 'FINALIZED').length}/{linkedTasks.length} done)
                    </p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[11px]">
                      {linkedTasks.map(task => (
                        <div key={task.id} className="flex items-center gap-1.5">
                          <span>{task.status === 'FINALIZED' ? '✓' : '☐'}</span>
                          <span className={task.status === 'FINALIZED' ? 'line-through text-gray-400' : 'text-gray-700'}>
                            {task.item_name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── To-Do List View ──────────────────────────────────────── */}
      {view === 'todo' && (
        <div className={printMode === 'todo' ? '' : 'print:hidden'}>
          {/* Top bar: group-by toggle + add task */}
          <div className="flex items-center justify-between mb-4 print:hidden">
            <div className="flex items-center gap-1 bg-cream rounded-xl p-1">
              <button onClick={() => setTodoGroupBy('category')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  todoGroupBy === 'category' ? 'bg-white text-text-1 shadow-sm' : 'text-text-3 hover:text-text-2'
                }`}>
                <LayoutList className="h-3.5 w-3.5" /> By Category
              </button>
              <button onClick={() => setTodoGroupBy('activity')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  todoGroupBy === 'activity' ? 'bg-white text-text-1 shadow-sm' : 'text-text-3 hover:text-text-2'
                }`}>
                <Network className="h-3.5 w-3.5" /> By Activity
              </button>
            </div>
            {!showTaskForm && (
              <button onClick={() => setShowTaskForm(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-extrabold tracking-tight transition-colors"
                style={{ boxShadow: '0 4px 16px rgba(232,85,16,0.28)' }}>
                <Plus className="h-4 w-4" /> Add Task
              </button>
            )}
          </div>

          {/* Inline add task form */}
          {showTaskForm && (
            <div className="print:hidden mb-4">
              <TaskForm
                planItems={planItems}
                onSave={handleAddTask}
                onCancel={() => setShowTaskForm(false)}
                saving={savingTask}
              />
            </div>
          )}

          {checklistItems.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-brand-border rounded-2xl">
              <Circle className="h-10 w-10 text-text-4 mx-auto mb-3" />
              <p className="text-base text-text-3 font-bold">No tasks yet</p>
              <p className="text-sm text-text-4 mt-1">
                Add pre-event tasks like booking vendors, ordering decorations, confirming menus.
              </p>
            </div>
          ) : todoGroupBy === 'category' ? (
            /* ── By Category (flat list grouped by category) ─── */
            <div className="space-y-6">
              {Object.entries(
                checklistItems.reduce<Record<string, ChecklistItem[]>>((acc, item) => {
                  const cat = item.category || 'Other'
                  if (!acc[cat]) acc[cat] = []
                  acc[cat].push(item)
                  return acc
                }, {})
              )
                .filter(([cat]) => printCategories.size === 0 || printCategories.has(cat))
                .map(([category, items]) => (
                <div key={category}>
                  <h3 className="text-sm font-extrabold tracking-tight text-text-2 mb-3 flex items-center gap-2">
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
                        <div key={item.id} className={`rounded-xl border-2 ${isDone ? 'border-green-200 bg-green-50/50' : 'border-brand-border bg-white dark:bg-cream-2'} p-3 flex items-start gap-3 transition-colors print:border print:rounded-none print:p-2`}>
                          <button onClick={() => toggleChecklistStatus(item)}
                            className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors print:hidden ${
                              isDone ? 'bg-green-500 border-green-500 text-white' : 'border-brand-border hover:border-brand/40'
                            }`}>
                            {isDone && <Check className="h-3 w-3" />}
                          </button>
                          <span className="hidden print:inline-block mt-0.5 w-4 h-4 text-center flex-shrink-0 text-xs">
                            {isDone ? '✓' : '☐'}
                          </span>
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
                          <div className="flex items-center gap-1.5 flex-shrink-0 print:hidden">
                            <select
                              value={item.linked_plan_item_id || ''}
                              onChange={e => updateChecklistLink(item.id, e.target.value || null)}
                              className="text-xs rounded-lg border border-brand-border px-2 py-1 bg-white dark:bg-cream-2 text-text-3 max-w-[120px] truncate"
                              title="Link to plan item"
                            >
                              <option value="">No link</option>
                              {planItems.map(pi => (
                                <option key={pi.id} value={pi.id}>{pi.title}</option>
                              ))}
                            </select>
                            <button
                              onClick={() => { if (confirm(`Delete "${item.item_name}"?`)) deleteChecklistItem(item.id) }}
                              className="p-1.5 rounded-lg text-text-4 hover:text-red-500 hover:bg-red-50 transition-colors"
                              title="Delete task">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* ── By Activity (hierarchical: activity → sub-tasks) ─── */
            <div className="space-y-4">
              {(() => {
                // Group: platform vendors + plan items as parent activities, with linked tasks underneath
                const activities: { id: string; title: string; role: string; source: string; vendor_type: string | null; tasks: ChecklistItem[] }[] = []

                // Platform vendors
                for (const pv of platformVendors) {
                  activities.push({
                    id: `pv-${pv.id}`,
                    title: pv.vendor.business_name,
                    role: pv.role || VENDOR_TYPE_LABELS[pv.vendor.vendor_type] || pv.vendor.vendor_type,
                    source: 'PLATFORM',
                    vendor_type: pv.vendor.vendor_type,
                    tasks: [], // platform vendors don't have linked_plan_item_id — tasks link via plan items
                  })
                }

                // Plan items (external + personal)
                for (const pi of planItems) {
                  const linked = checklistItems.filter(ci => ci.linked_plan_item_id === pi.id)
                  activities.push({
                    id: `pi-${pi.id}`,
                    title: pi.title,
                    role: pi.role || '',
                    source: pi.source,
                    vendor_type: null,
                    tasks: linked,
                  })
                }

                // Unlinked tasks (not connected to any plan item)
                const linkedIds = new Set(checklistItems.filter(ci => ci.linked_plan_item_id).map(ci => ci.id))
                const unlinked = checklistItems.filter(ci => !linkedIds.has(ci.id) || !ci.linked_plan_item_id)
                  .filter(ci => !ci.linked_plan_item_id)

                // Filter: only show activities that have tasks, or all if none have tasks
                const withTasks = activities.filter(a => a.tasks.length > 0)
                const withoutTasks = activities.filter(a => a.tasks.length === 0)

                return (
                  <>
                    {/* Activities with linked tasks */}
                    {withTasks.map(activity => {
                      const st = SOURCE_STYLES[activity.source as keyof typeof SOURCE_STYLES] || SOURCE_STYLES.EXTERNAL
                      const Icon = st.icon
                      const doneCount = activity.tasks.filter(t => t.status === 'FINALIZED').length
                      const allDone = doneCount === activity.tasks.length
                      return (
                        <div key={activity.id} className={`rounded-2xl border-2 ${allDone ? 'border-green-200 bg-green-50/30' : st.border + ' ' + st.bg} overflow-hidden`}>
                          {/* Activity header */}
                          <div className="flex items-center gap-3 px-4 py-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${st.badge}`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-extrabold tracking-tight text-text-1 text-sm">{activity.title}</h3>
                                {activity.role && <span className="text-xs text-text-3">{activity.role}</span>}
                              </div>
                            </div>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              allDone ? 'bg-green-100 text-green-700' : 'bg-white/60 text-text-3'
                            }`}>{doneCount}/{activity.tasks.length}</span>
                          </div>
                          {/* Linked tasks */}
                          <div className="border-t border-brand-border/30 bg-white/40 px-4 py-2.5 space-y-1.5">
                            {activity.tasks.map(task => {
                              const isDone = task.status === 'FINALIZED'
                              const ss = STATUS_STYLES[task.status] || STATUS_STYLES.PENDING
                              return (
                                <div key={task.id} className="group flex items-center gap-2.5">
                                  <button onClick={() => toggleChecklistStatus(task)}
                                    className={`w-4.5 h-4.5 rounded flex items-center justify-center flex-shrink-0 border-2 transition-colors print:hidden ${
                                      isDone ? 'bg-green-500 border-green-500 text-white' : 'border-brand-border hover:border-brand/40'
                                    }`}>
                                    {isDone && <Check className="h-2.5 w-2.5" />}
                                  </button>
                                  <span className="hidden print:inline-block w-4 text-center flex-shrink-0 text-xs">
                                    {isDone ? '✓' : '☐'}
                                  </span>
                                  <span className={`text-sm flex-1 ${isDone ? 'line-through text-text-4' : 'text-text-2'}`}>
                                    {task.item_name}
                                  </span>
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${ss.bg} ${ss.text} print:hidden`}>
                                    {ss.label}
                                  </span>
                                  {task.due_date && (
                                    <span className="text-[10px] text-text-4">
                                      {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </span>
                                  )}
                                  <button
                                    onClick={() => { if (confirm(`Delete "${task.item_name}"?`)) deleteChecklistItem(task.id) }}
                                    className="p-1 rounded text-text-4 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all print:hidden"
                                    title="Delete task">
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}

                    {/* Activities without tasks */}
                    {withoutTasks.length > 0 && (
                      <div>
                        <h3 className="text-xs font-extrabold tracking-tight text-text-4 uppercase mb-2 print:text-[10px]">No tasks linked yet</h3>
                        <div className="space-y-1.5">
                          {withoutTasks.map(activity => {
                            const st = SOURCE_STYLES[activity.source as keyof typeof SOURCE_STYLES] || SOURCE_STYLES.EXTERNAL
                            return (
                              <div key={activity.id} className="flex items-center gap-3 rounded-xl border border-dashed border-brand-border/60 px-4 py-2.5 bg-white/50">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.badge}`}>{st.label}</span>
                                <span className="text-sm text-text-3">{activity.title}</span>
                                {activity.role && <span className="text-xs text-text-4">· {activity.role}</span>}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Unlinked tasks */}
                    {unlinked.length > 0 && (
                      <div>
                        <h3 className="text-xs font-extrabold tracking-tight text-text-4 uppercase mb-2 print:text-[10px]">General Tasks</h3>
                        <div className="space-y-2">
                          {unlinked.map(task => {
                            const isDone = task.status === 'FINALIZED'
                            const ss = STATUS_STYLES[task.status] || STATUS_STYLES.PENDING
                            return (
                              <div key={task.id} className={`rounded-xl border-2 ${isDone ? 'border-green-200 bg-green-50/50' : 'border-brand-border bg-white'} p-3 flex items-start gap-3 print:border print:rounded-none print:p-2`}>
                                <button onClick={() => toggleChecklistStatus(task)}
                                  className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors print:hidden ${
                                    isDone ? 'bg-green-500 border-green-500 text-white' : 'border-brand-border hover:border-brand/40'
                                  }`}>
                                  {isDone && <Check className="h-3 w-3" />}
                                </button>
                                <span className="hidden print:inline-block mt-0.5 w-4 h-4 text-center flex-shrink-0 text-xs">
                                  {isDone ? '✓' : '☐'}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`font-bold text-sm ${isDone ? 'line-through text-text-4' : 'text-text-1'}`}>
                                      {task.item_name}
                                    </span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ss.bg} ${ss.text}`}>
                                      {ss.label}
                                    </span>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-text-4">
                                      {task.category}
                                    </span>
                                  </div>
                                  {(task.due_date || task.external_vendor_name || task.notes) && (
                                    <div className="flex items-center gap-3 mt-1 text-xs text-text-4 flex-wrap">
                                      {task.due_date && (
                                        <span className="flex items-center gap-1">
                                          <CalendarDays className="h-3 w-3" />
                                          {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </span>
                                      )}
                                      {task.external_vendor_name && (
                                        <span className="flex items-center gap-1">
                                          <User className="h-3 w-3" /> {task.external_vendor_name}
                                        </span>
                                      )}
                                      {task.notes && <span className="truncate max-w-[200px]">{task.notes}</span>}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 flex-shrink-0 print:hidden">
                                  <select
                                    value={task.linked_plan_item_id || ''}
                                    onChange={e => updateChecklistLink(task.id, e.target.value || null)}
                                    className="text-xs rounded-lg border border-brand-border px-2 py-1 bg-white text-text-3 max-w-[120px] truncate"
                                    title="Link to activity"
                                  >
                                    <option value="">No link</option>
                                    {planItems.map(pi => (
                                      <option key={pi.id} value={pi.id}>{pi.title}</option>
                                    ))}
                                  </select>
                                  <button
                                    onClick={() => { if (confirm(`Delete "${task.item_name}"?`)) deleteChecklistItem(task.id) }}
                                    className="p-1.5 rounded-lg text-text-4 hover:text-red-500 hover:bg-red-50 transition-colors"
                                    title="Delete task">
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )
              })()}
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
        <div className="space-y-3" data-print-hide={printMode ? 'true' : undefined}>
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
                  <span className="text-sm font-extrabold tracking-tight text-text-1">{totalReady}/{totalItems} items ready</span>
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
                      <h3 className="font-extrabold tracking-tight text-text-1 text-base">{item.title}</h3>
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

                  {/* Actions + Expand toggle */}
                  <div className="flex items-center gap-1.5 flex-shrink-0 print:hidden">
                    {item.source !== 'PLATFORM' && (
                      <>
                        <button onClick={(e) => {
                          e.stopPropagation()
                          const pi = planItems.find(p => `pi-${p.id}` === item.id)
                          if (pi) { setEditItem(pi); setShowForm(true) }
                        }}
                          className="p-1.5 rounded-lg text-text-4 hover:text-text-2 hover:bg-white/60 transition-colors"
                          title="Edit">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={(e) => {
                          e.stopPropagation()
                          if (!confirm(`Remove "${item.title}"? This cannot be undone.`)) return
                          const realId = item.id.replace('pi-', '')
                          handleDelete(realId)
                        }}
                          className="p-1.5 rounded-lg text-text-4 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Remove">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
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

                    {/* ── Inline Sub-Tasks (To-Do) ─────────────────── */}
                    {(() => {
                      const realPlanItemId = item.source !== 'PLATFORM' ? item.id.replace('pi-', '') : null
                      const linkedTasks = realPlanItemId ? (subtasksByPlanItem[realPlanItemId] ?? []) : []
                      const doneCount = linkedTasks.filter(t => t.status === 'FINALIZED').length
                      const category = item.role ?? item.vendor_type ?? 'Admin'
                      const vendorType = item.vendor_type

                      return (
                        <div className="mt-3 pt-3 border-t border-brand-border/30">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-bold uppercase text-text-4 flex items-center gap-1.5">
                              To-Do
                              {linkedTasks.length > 0 && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                                  doneCount === linkedTasks.length ? 'bg-green-100 text-green-700' : 'bg-brand-border/30 text-text-4'
                                }`}>{doneCount}/{linkedTasks.length}</span>
                              )}
                            </p>
                            <div className="flex items-center gap-1.5">
                              {vendorType && realPlanItemId && linkedTasks.length === 0 && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); addWorkflowTemplate(realPlanItemId, vendorType, category) }}
                                  className="text-[10px] font-bold text-brand hover:underline"
                                >
                                  + Add template steps
                                </button>
                              )}
                              {realPlanItemId && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); setAddingSubtask(addingSubtask === item.id ? null : item.id); setSubtaskName('') }}
                                  className="text-[10px] font-bold text-brand hover:underline"
                                >
                                  + Add task
                                </button>
                              )}
                            </div>
                          </div>

                          {linkedTasks.length > 0 && (
                            <div className="space-y-1.5">
                              {linkedTasks.map(task => {
                                const isDone = task.status === 'FINALIZED'
                                return (
                                  <div key={task.id} className="flex items-center gap-2.5 group">
                                    <button onClick={(e) => { e.stopPropagation(); toggleChecklistStatus(task) }}
                                      className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border-2 transition-colors ${
                                        isDone ? 'bg-green-500 border-green-500 text-white' : 'border-brand-border hover:border-brand/40'
                                      }`}>
                                      {isDone && <Check className="h-2.5 w-2.5" />}
                                    </button>
                                    <span className={`text-sm ${isDone ? 'line-through text-text-4' : 'text-text-2'}`}>
                                      {task.item_name}
                                    </span>
                                    {task.due_date && (
                                      <span className="text-[10px] text-text-4 ml-auto">
                                        {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                      </span>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          )}

                          {linkedTasks.length === 0 && !addingSubtask && (
                            <p className="text-xs text-text-4 italic">No tasks yet — add manually or use a template</p>
                          )}

                          {/* Inline add sub-task */}
                          {addingSubtask === item.id && realPlanItemId && (
                            <div className="flex items-center gap-2 mt-2" onClick={e => e.stopPropagation()}>
                              <input
                                autoFocus
                                value={subtaskName}
                                onChange={e => setSubtaskName(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') handleAddSubtask(realPlanItemId, category); if (e.key === 'Escape') { setAddingSubtask(null); setSubtaskName('') } }}
                                placeholder="Task name..."
                                className="flex-1 text-sm rounded-lg border border-brand-border px-2.5 py-1.5 focus:border-brand/40 focus:ring-1 focus:ring-brand/20 outline-none bg-white"
                              />
                              <button
                                onClick={() => handleAddSubtask(realPlanItemId, category)}
                                disabled={savingSubtask || !subtaskName.trim()}
                                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-brand text-white hover:bg-brand-hover disabled:opacity-50"
                              >
                                {savingSubtask ? '...' : 'Add'}
                              </button>
                              <button
                                onClick={() => { setAddingSubtask(null); setSubtaskName('') }}
                                className="text-xs text-text-4 hover:text-text-2"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })()}

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
                        <h3 className="font-extrabold tracking-tight text-text-1">{item.title}</h3>
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
              <p className="text-sm font-extrabold tracking-tight text-text-2 mb-3 -ml-8">Other Items (no time set)</p>
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
              <p className="text-lg font-extrabold tracking-tight text-text-1">{sorted.length}</p>
            </div>
            <div>
              <span className="text-text-4 font-medium">Platform vendors</span>
              <p className="text-lg font-extrabold tracking-tight text-blue-700">{platformVendors.length}</p>
            </div>
            <div>
              <span className="text-text-4 font-medium">External vendors</span>
              <p className="text-lg font-extrabold tracking-tight text-amber-700">{planItems.filter(p => p.source === 'EXTERNAL').length}</p>
            </div>
            <div>
              <span className="text-text-4 font-medium">Personal / helpers</span>
              <p className="text-lg font-extrabold tracking-tight text-purple-700">{planItems.filter(p => p.source === 'PERSONAL').length}</p>
            </div>
            {platformVendors.some(pv => pv.quote?.total_estimate) && (
              <div className="ml-auto">
                <span className="text-text-4 font-medium">Total booked</span>
                <p className="text-lg font-extrabold tracking-tight text-text-1">
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
          [data-print-hide="true"] { display: none !important; }
          body { font-size: 11px; }
          @page { margin: 1.5cm 1.5cm 2cm; }
        }
      `}</style>
    </div>
  )
}
