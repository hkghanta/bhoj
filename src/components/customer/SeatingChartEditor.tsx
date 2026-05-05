'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { LayoutGrid, Circle, Square, Users, Plus, Trash2, Loader2, Rows3, UtensilsCrossed, CookingPot, Wine, Music, Footprints, DoorOpen, Printer, Shuffle, CheckSquare, X } from 'lucide-react'

type Guest = { id: string; name: string; household_name?: string }

type Table = {
  id: string
  name: string
  shape: 'round' | 'rectangle' | 'square'
  capacity: number
  x_position: number
  y_position: number
  assigned_guests: { id: string; guest_id: string; guest_name: string; seat_number: number }[]
}

type Row = {
  id: string
  name: string
  section: string | null
  capacity: number
  row_number: number
  seats: { id: string; household_id: string | null; attendee_id: string | null; seat_number: number }[]
}

type VenueElementType = 'buffet' | 'bar' | 'dj' | 'dance-floor' | 'entrance' | 'stage'

type VenueElement = {
  id: string
  type: VenueElementType
  label: string
  x: number
  y: number
  width: number
  height: number
}

type SeatingChart = {
  id: string
  layout_type: 'dining' | 'ceremony' | 'theater'
  tables: Table[]
  rows: Row[]
  layout?: { venueElements?: VenueElement[] } | null
}

const emptyTableForm = { name: '', shape: 'round' as const, capacity: '8' }
const emptyRowForm = { name: '', section: 'center', capacity: '10', row_number: '' }
const emptyElementForm = { type: 'buffet' as VenueElementType, label: '' }

const venueElementDefaults: Record<VenueElementType, { label: string; width: number; height: number }> = {
  buffet: { label: 'Buffet Station', width: 160, height: 60 },
  bar: { label: 'Bar / Drinks', width: 140, height: 50 },
  dj: { label: 'DJ Booth', width: 100, height: 60 },
  'dance-floor': { label: 'Dance Floor', width: 180, height: 180 },
  entrance: { label: 'Entrance', width: 80, height: 40 },
  stage: { label: 'Stage', width: 200, height: 80 },
}

const venueElementIcon = (type: VenueElementType) => {
  switch (type) {
    case 'buffet': return <CookingPot className="h-4 w-4" />
    case 'bar': return <Wine className="h-4 w-4" />
    case 'dj': return <Music className="h-4 w-4" />
    case 'dance-floor': return <Footprints className="h-4 w-4" />
    case 'entrance': return <DoorOpen className="h-4 w-4" />
    case 'stage': return <Music className="h-4 w-4" />
  }
}

export function SeatingChartEditor({ eventId }: { eventId: string }) {
  const [chart, setChart] = useState<SeatingChart | null>(null)
  const [guests, setGuests] = useState<Guest[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [showAddTable, setShowAddTable] = useState(false)
  const [showAddRow, setShowAddRow] = useState(false)
  const [tableForm, setTableForm] = useState(emptyTableForm)
  const [rowForm, setRowForm] = useState(emptyRowForm)
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [selectedRow, setSelectedRow] = useState<string | null>(null)
  const [assignGuestId, setAssignGuestId] = useState('')
  const [layoutChoice, setLayoutChoice] = useState<'dining' | 'ceremony'>('dining')
  const [showAddElement, setShowAddElement] = useState(false)
  const [elementForm, setElementForm] = useState(emptyElementForm)
  const [selectedElement, setSelectedElement] = useState<string | null>(null)
  const [selectedGuestIds, setSelectedGuestIds] = useState<Set<string>>(new Set())
  const [showPrintView, setShowPrintView] = useState(false)
  const dragRef = useRef<{ tableId: string; startX: number; startY: number; origX: number; origY: number } | null>(null)
  const elementDragRef = useRef<{ elementId: string; startX: number; startY: number; origX: number; origY: number } | null>(null)

  function showAlertMsg(type: 'success' | 'error', msg: string) {
    setAlert({ type, msg })
    setTimeout(() => setAlert(null), 3000)
  }

  async function fetchChart() {
    setLoading(true)
    try {
      const [chartRes, guestsRes] = await Promise.all([
        fetch(`/api/events/${eventId}/seating`),
        fetch(`/api/events/${eventId}/guests`),
      ])
      if (chartRes.status === 404) { setChart(null); return }
      if (!chartRes.ok) throw new Error('Failed to load')
      const data = await chartRes.json()
      const charts = data.charts ?? data
      const firstChart = Array.isArray(charts) ? charts[0] ?? null : charts
      if (firstChart) {
        if (!firstChart.tables) firstChart.tables = []
        if (!firstChart.rows) firstChart.rows = []
        if (!firstChart.layout_type) firstChart.layout_type = 'dining'
        for (const t of firstChart.tables) {
          if (!t.assigned_guests) t.assigned_guests = t.seats ?? []
        }
        for (const r of firstChart.rows) {
          if (!r.seats) r.seats = []
        }
      }
      setChart(firstChart)
      if (guestsRes.ok) {
        const guestData = await guestsRes.json()
        setGuests(Array.isArray(guestData) ? guestData : [])
      }
    } catch {
      showAlertMsg('error', 'Failed to load seating chart')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchChart() }, [eventId])

  async function createChart(type: 'dining' | 'ceremony') {
    setSaving(true)
    try {
      const res = await fetch(`/api/events/${eventId}/seating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ layout_type: type }),
      })
      if (!res.ok) throw new Error('Failed to create')
      showAlertMsg('success', 'Chart created')
      fetchChart()
    } catch (err: any) {
      showAlertMsg('error', err.message)
    } finally {
      setSaving(false)
    }
  }

  // ── Table operations (dining) ──

  async function addTable(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(`/api/events/${eventId}/seating/${chart!.id}/tables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: tableForm.name,
          shape: tableForm.shape,
          capacity: Number(tableForm.capacity),
          x_position: 50 + Math.random() * 400,
          y_position: 50 + Math.random() * 300,
        }),
      })
      if (!res.ok) throw new Error('Failed to add table')
      showAlertMsg('success', 'Table added')
      setShowAddTable(false)
      setTableForm(emptyTableForm)
      fetchChart()
    } catch (err: any) {
      showAlertMsg('error', err.message)
    } finally {
      setSaving(false)
    }
  }

  async function deleteTable(tableId: string) {
    if (!confirm('Remove this table?')) return
    try {
      const res = await fetch(`/api/events/${eventId}/seating/${chart!.id}/tables/${tableId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      showAlertMsg('success', 'Table removed')
      if (selectedTable === tableId) setSelectedTable(null)
      fetchChart()
    } catch {
      showAlertMsg('error', 'Failed to delete')
    }
  }

  async function assignGuestToTable(tableId: string) {
    if (!assignGuestId) return
    setSaving(true)
    try {
      const res = await fetch(`/api/events/${eventId}/seating/${chart!.id}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table_id: tableId, attendee_id: assignGuestId }),
      })
      if (!res.ok) throw new Error('Failed to assign')
      showAlertMsg('success', 'Guest assigned')
      setAssignGuestId('')
      fetchChart()
    } catch (err: any) {
      showAlertMsg('error', err.message)
    } finally {
      setSaving(false)
    }
  }

  async function bulkAssignGuestsToTable(tableId: string, guestIds: string[]) {
    if (guestIds.length === 0) return
    setSaving(true)
    try {
      for (const guestId of guestIds) {
        const res = await fetch(`/api/events/${eventId}/seating/${chart!.id}/assignments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ table_id: tableId, attendee_id: guestId }),
        })
        if (!res.ok) throw new Error('Failed to assign guest')
      }
      showAlertMsg('success', `${guestIds.length} guest${guestIds.length > 1 ? 's' : ''} assigned`)
      setSelectedGuestIds(new Set())
      fetchChart()
    } catch (err: any) {
      showAlertMsg('error', err.message)
    } finally {
      setSaving(false)
    }
  }

  async function autoAssignAll() {
    if (!chart) return
    const unassigned = guests.filter(g => !assignedGuestIds.has(g.id))
    if (unassigned.length === 0) { showAlertMsg('error', 'No unassigned guests'); return }

    const tablesWithSpace = tables
      .map(t => ({ ...t, available: t.capacity - (t.assigned_guests ?? []).length }))
      .filter(t => t.available > 0)
      .sort((a, b) => b.available - a.available)

    if (tablesWithSpace.length === 0) { showAlertMsg('error', 'No tables with available seats'); return }

    setSaving(true)
    try {
      let guestIdx = 0
      for (const table of tablesWithSpace) {
        let slotsLeft = table.available
        while (slotsLeft > 0 && guestIdx < unassigned.length) {
          const res = await fetch(`/api/events/${eventId}/seating/${chart!.id}/assignments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ table_id: table.id, attendee_id: unassigned[guestIdx].id }),
          })
          if (!res.ok) throw new Error('Failed to assign')
          guestIdx++
          slotsLeft--
        }
        if (guestIdx >= unassigned.length) break
      }
      const assigned = guestIdx
      const remaining = unassigned.length - assigned
      showAlertMsg('success', `${assigned} guests assigned${remaining > 0 ? `, ${remaining} remaining (no space)` : ''}`)
      setSelectedGuestIds(new Set())
      fetchChart()
    } catch (err: any) {
      showAlertMsg('error', err.message)
    } finally {
      setSaving(false)
    }
  }

  function toggleGuestSelection(guestId: string) {
    setSelectedGuestIds(prev => {
      const next = new Set(prev)
      if (next.has(guestId)) next.delete(guestId)
      else next.add(guestId)
      return next
    })
  }

  function selectHousehold(householdName: string) {
    const householdGuests = guests.filter(g => g.household_name === householdName && !assignedGuestIds.has(g.id))
    setSelectedGuestIds(prev => {
      const next = new Set(prev)
      const allSelected = householdGuests.every(g => next.has(g.id))
      householdGuests.forEach(g => allSelected ? next.delete(g.id) : next.add(g.id))
      return next
    })
  }

  async function updateTablePosition(tableId: string, x: number, y: number) {
    try {
      await fetch(`/api/events/${eventId}/seating/${chart!.id}/tables/${tableId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ x_position: x, y_position: y }),
      })
    } catch {
      showAlertMsg('error', 'Failed to move table')
    }
  }

  // ── Venue element operations (dining) ──

  const venueElements: VenueElement[] = (chart?.layout as any)?.venueElements ?? []

  async function saveVenueElements(elements: VenueElement[]) {
    const currentLayout = (chart?.layout as Record<string, unknown>) ?? {}
    const newLayout = { ...currentLayout, venueElements: elements }
    try {
      const res = await fetch(`/api/events/${eventId}/seating/${chart!.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ layout: newLayout }),
      })
      if (!res.ok) throw new Error('Failed to save')
      setChart(c => c ? { ...c, layout: newLayout } : c)
    } catch {
      showAlertMsg('error', 'Failed to save venue elements')
    }
  }

  async function addVenueElement(e: React.FormEvent) {
    e.preventDefault()
    const defaults = venueElementDefaults[elementForm.type]
    const newElement: VenueElement = {
      id: crypto.randomUUID(),
      type: elementForm.type,
      label: elementForm.label || defaults.label,
      x: 50 + Math.random() * 300,
      y: 50 + Math.random() * 200,
      width: defaults.width,
      height: defaults.height,
    }
    const updated = [...venueElements, newElement]
    await saveVenueElements(updated)
    setShowAddElement(false)
    setElementForm(emptyElementForm)
    showAlertMsg('success', 'Element added')
  }

  async function deleteVenueElement(elementId: string) {
    if (!confirm('Remove this element?')) return
    const updated = venueElements.filter(el => el.id !== elementId)
    await saveVenueElements(updated)
    if (selectedElement === elementId) setSelectedElement(null)
    showAlertMsg('success', 'Element removed')
  }

  // ── Row operations (ceremony/theater) ──

  async function addRow(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const existingRows = chart?.rows ?? []
      const autoRowNum = existingRows.length > 0 ? Math.max(...existingRows.map(r => r.row_number)) + 1 : 1
      const rowNumber = rowForm.row_number ? Number(rowForm.row_number) : autoRowNum
      const res = await fetch(`/api/events/${eventId}/seating/${chart!.id}/rows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: rowForm.name,
          section: rowForm.section,
          capacity: Number(rowForm.capacity),
          row_number: rowNumber,
        }),
      })
      if (!res.ok) throw new Error('Failed to add row')
      showAlertMsg('success', 'Row added')
      setShowAddRow(false)
      setRowForm(emptyRowForm)
      fetchChart()
    } catch (err: any) {
      showAlertMsg('error', err.message)
    } finally {
      setSaving(false)
    }
  }

  async function deleteRow(rowId: string) {
    if (!confirm('Remove this row?')) return
    try {
      const res = await fetch(`/api/events/${eventId}/seating/${chart!.id}/rows/${rowId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      showAlertMsg('success', 'Row removed')
      if (selectedRow === rowId) setSelectedRow(null)
      fetchChart()
    } catch {
      showAlertMsg('error', 'Failed to delete')
    }
  }

  async function assignGuestToRow(rowId: string) {
    if (!assignGuestId) return
    setSaving(true)
    try {
      const row = (chart?.rows ?? []).find(r => r.id === rowId)
      const nextSeat = (row?.seats.length ?? 0) + 1
      const res = await fetch(`/api/events/${eventId}/seating/${chart!.id}/rows/${rowId}/seats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendee_id: assignGuestId, seat_number: nextSeat }),
      })
      if (!res.ok) throw new Error('Failed to assign')
      showAlertMsg('success', 'Guest assigned')
      setAssignGuestId('')
      fetchChart()
    } catch (err: any) {
      showAlertMsg('error', err.message)
    } finally {
      setSaving(false)
    }
  }

  // ── Drag handlers (dining only) ──

  const handleMouseDown = useCallback((e: React.MouseEvent, tableId: string, origX: number, origY: number) => {
    dragRef.current = { tableId, startX: e.clientX, startY: e.clientY, origX, origY }
  }, [])

  const handleElementMouseDown = useCallback((e: React.MouseEvent, elementId: string, origX: number, origY: number) => {
    e.stopPropagation()
    elementDragRef.current = { elementId, startX: e.clientX, startY: e.clientY, origX, origY }
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const drag = dragRef.current
    const elDrag = elementDragRef.current
    if (drag && chart) {
      const dx = e.clientX - drag.startX
      const dy = e.clientY - drag.startY
      setChart(c => {
        if (!c) return c
        return {
          ...c,
          tables: c.tables.map(t =>
            t.id === drag.tableId
              ? { ...t, x_position: drag.origX + dx, y_position: drag.origY + dy }
              : t
          ),
        }
      })
    } else if (elDrag && chart) {
      const dx = e.clientX - elDrag.startX
      const dy = e.clientY - elDrag.startY
      setChart(c => {
        if (!c) return c
        const currentElements: VenueElement[] = (c.layout as any)?.venueElements ?? []
        return {
          ...c,
          layout: {
            ...((c.layout as Record<string, unknown>) ?? {}),
            venueElements: currentElements.map(el =>
              el.id === elDrag.elementId
                ? { ...el, x: elDrag.origX + dx, y: elDrag.origY + dy }
                : el
            ),
          },
        }
      })
    }
  }, [chart])

  const handleMouseUp = useCallback(() => {
    const drag = dragRef.current
    const elDrag = elementDragRef.current
    if (drag && chart) {
      const table = (chart.tables ?? []).find(t => t.id === drag.tableId)
      if (table) updateTablePosition(table.id, table.x_position, table.y_position)
      dragRef.current = null
    }
    if (elDrag && chart) {
      const elements: VenueElement[] = (chart.layout as any)?.venueElements ?? []
      const el = elements.find(e => e.id === elDrag.elementId)
      if (el) {
        const currentLayout = (chart.layout as Record<string, unknown>) ?? {}
        saveVenueElements(elements.map(e => e.id === elDrag.elementId ? el : e))
      }
      elementDragRef.current = null
    }
  }, [chart])

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-text-4" /></div>
  }

  const inputCls = 'w-full rounded-xl border border-brand-border px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none'

  // ── Create chart screen ──
  if (!chart) {
    return (
      <div className="border-2 border-dashed rounded-xl p-12 text-center">
        <LayoutGrid className="h-10 w-10 text-text-4 mx-auto mb-3" />
        <p className="text-base text-text-4 mb-6 font-medium">Choose a seating layout</p>
        <div className="flex justify-center gap-5 flex-wrap">
          <button
            onClick={() => setLayoutChoice('dining')}
            className={`rounded-xl border-2 p-6 w-48 text-center transition-all ${
              layoutChoice === 'dining' ? 'border-brand bg-cream' : 'border-brand-border hover:border-brand-border'
            }`}
          >
            <UtensilsCrossed className={`h-8 w-8 mx-auto mb-2 ${layoutChoice === 'dining' ? 'text-brand' : 'text-text-4'}`} />
            <div className="font-bold text-sm text-text-1">Dining Tables</div>
            <p className="text-xs text-text-4 mt-1">Round or rectangular tables for reception, dinner</p>
          </button>
          <button
            onClick={() => setLayoutChoice('ceremony')}
            className={`rounded-xl border-2 p-6 w-48 text-center transition-all ${
              layoutChoice === 'ceremony' ? 'border-brand bg-cream' : 'border-brand-border hover:border-brand-border'
            }`}
          >
            <Rows3 className={`h-8 w-8 mx-auto mb-2 ${layoutChoice === 'ceremony' ? 'text-brand' : 'text-text-4'}`} />
            <div className="font-bold text-sm text-text-1">Rows / Theater</div>
            <p className="text-xs text-text-4 mt-1">Rows of seats for ceremony, sangeet, performances</p>
          </button>
        </div>
        <Button onClick={() => createChart(layoutChoice)} disabled={saving} className="bg-brand hover:bg-brand-hover mt-6">
          {saving ? 'Creating...' : 'Create Seating Chart'}
        </Button>
      </div>
    )
  }

  const isDining = chart.layout_type === 'dining'

  async function switchLayoutType(type: 'dining' | 'ceremony') {
    try {
      const res = await fetch(`/api/events/${eventId}/seating/${chart!.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ layout_type: type }),
      })
      if (!res.ok) throw new Error('Failed to switch')
      setChart(c => c ? { ...c, layout_type: type } : c)
    } catch {
      showAlertMsg('error', 'Failed to switch layout')
    }
  }

  // ── Gather assigned guest IDs across both layouts ──
  const tables = chart.tables ?? []
  const rows = (chart.rows ?? []).sort((a, b) => a.row_number - b.row_number)
  const assignedGuestIds = new Set([
    ...tables.flatMap(t => (t.assigned_guests ?? []).map(g => g.guest_id)),
    ...rows.flatMap(r => (r.seats ?? []).map(s => s.attendee_id).filter(Boolean)),
  ])
  const selectedTableData = tables.find(t => t.id === selectedTable)
  const selectedRowData = rows.find(r => r.id === selectedRow)

  const shapeIcon = (shape: string) => {
    if (shape === 'round') return <Circle className="h-4 w-4" />
    return <Square className="h-4 w-4" />
  }

  const sectionLabel = (s: string | null) => {
    if (!s) return ''
    const map: Record<string, string> = {
      left: 'Left', right: 'Right', center: 'Center',
      bride: "Bride's Side", groom: "Groom's Side",
      'wall-left': 'Wall — Left', 'wall-right': 'Wall — Right', 'wall-back': 'Wall — Back',
      overflow: 'Overflow / Extra',
    }
    return map[s] ?? s
  }

  return (
    <div>
      {alert && (
        <div className={`mb-4 rounded-xl px-4 py-3 text-sm ${alert.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {alert.msg}
        </div>
      )}

      {/* Layout type switcher + Print */}
      <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-1 bg-cream rounded-xl p-1 w-fit">
        <button
          onClick={() => switchLayoutType('dining')}
          className={`flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-xl font-semibold transition-all ${
            isDining ? 'bg-white dark:bg-cream-2 text-text-1 shadow-sm' : 'text-text-4 hover:text-text-2'
          }`}
        >
          <UtensilsCrossed className="h-3.5 w-3.5" /> Dining Tables
        </button>
        <button
          onClick={() => switchLayoutType('ceremony')}
          className={`flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-xl font-semibold transition-all ${
            !isDining ? 'bg-white dark:bg-cream-2 text-text-1 shadow-sm' : 'text-text-4 hover:text-text-2'
          }`}
        >
          <Rows3 className="h-3.5 w-3.5" /> Rows / Ceremony
        </button>
      </div>
      <Button variant="outline" size="sm" onClick={() => setShowPrintView(true)}>
        <Printer className="h-3.5 w-3.5 mr-1" /> Print Directory
      </Button>
      </div>

      {/* Count + add button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          {isDining
            ? <><UtensilsCrossed className="h-4 w-4 text-brand" /><span className="text-sm text-text-4">{tables.length} table{tables.length !== 1 ? 's' : ''}</span></>
            : <><Rows3 className="h-4 w-4 text-brand" /><span className="text-sm text-text-4">{rows.length} row{rows.length !== 1 ? 's' : ''}</span></>
          }
        </div>
        {isDining ? (
          <div className="flex gap-2">
            <Button onClick={() => { setShowAddElement(!showAddElement); setShowAddTable(false) }} variant="outline">
              <Plus className="h-4 w-4 mr-1" /> Add Element
            </Button>
            <Button onClick={() => { setShowAddTable(!showAddTable); setShowAddElement(false) }} className="bg-brand hover:bg-brand-hover">
              <Plus className="h-4 w-4 mr-1" /> Add Table
            </Button>
          </div>
        ) : (
          <Button onClick={() => setShowAddRow(!showAddRow)} className="bg-brand hover:bg-brand-hover">
            <Plus className="h-4 w-4 mr-1" /> Add Row
          </Button>
        )}
      </div>

      {/* Add table form (dining) */}
      {isDining && showAddTable && (
        <div className="bg-white dark:bg-cream-2 rounded-2xl border border-brand-border p-6 shadow-sm mb-6">
          <form onSubmit={addTable} className="flex items-end gap-4 flex-wrap">
            <div>
              <label className="block text-sm font-medium text-text-2 mb-1">Name</label>
              <input required className={inputCls} value={tableForm.name} onChange={e => setTableForm(f => ({ ...f, name: e.target.value }))} placeholder="Table 1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-2 mb-1">Shape</label>
              <select className={inputCls} value={tableForm.shape} onChange={e => setTableForm(f => ({ ...f, shape: e.target.value as any }))}>
                <option value="round">Round</option>
                <option value="rectangle">Rectangle</option>
                <option value="square">Square</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-2 mb-1">Capacity</label>
              <input type="number" min="1" required className={inputCls} value={tableForm.capacity} onChange={e => setTableForm(f => ({ ...f, capacity: e.target.value }))} />
            </div>
            <Button type="submit" disabled={saving} className="bg-brand hover:bg-brand-hover">{saving ? 'Adding...' : 'Add'}</Button>
            <Button type="button" variant="outline" onClick={() => setShowAddTable(false)}>Cancel</Button>
          </form>
        </div>
      )}

      {/* Add venue element form (dining) */}
      {isDining && showAddElement && (
        <div className="bg-white dark:bg-cream-2 rounded-2xl border border-brand-border p-6 shadow-sm mb-6">
          <form onSubmit={addVenueElement} className="flex items-end gap-4 flex-wrap">
            <div>
              <label className="block text-sm font-medium text-text-2 mb-1">Element Type</label>
              <select className={inputCls} value={elementForm.type} onChange={e => setElementForm(f => ({ ...f, type: e.target.value as VenueElementType }))}>
                <option value="buffet">Buffet Station</option>
                <option value="bar">Bar / Drinks</option>
                <option value="dj">DJ Booth</option>
                <option value="dance-floor">Dance Floor</option>
                <option value="stage">Stage</option>
                <option value="entrance">Entrance / Exit</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-2 mb-1">Label</label>
              <input className={inputCls} value={elementForm.label} onChange={e => setElementForm(f => ({ ...f, label: e.target.value }))} placeholder={venueElementDefaults[elementForm.type].label} />
            </div>
            <Button type="submit" disabled={saving} className="bg-brand hover:bg-brand-hover">{saving ? 'Adding...' : 'Add'}</Button>
            <Button type="button" variant="outline" onClick={() => setShowAddElement(false)}>Cancel</Button>
          </form>
        </div>
      )}

      {/* Add row form (ceremony/theater) */}
      {!isDining && showAddRow && (
        <div className="bg-white dark:bg-cream-2 rounded-2xl border border-brand-border p-6 shadow-sm mb-6">
          <form onSubmit={addRow} className="flex items-end gap-4 flex-wrap">
            <div>
              <label className="block text-sm font-medium text-text-2 mb-1">Row Name</label>
              <input required className={inputCls} value={rowForm.name} onChange={e => setRowForm(f => ({ ...f, name: e.target.value }))} placeholder="Row A" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-2 mb-1">Section</label>
              <select className={inputCls} value={rowForm.section} onChange={e => setRowForm(f => ({ ...f, section: e.target.value }))}>
                <option value="center">Center</option>
                <option value="left">Left</option>
                <option value="right">Right</option>
                <option value="bride">Bride&apos;s Side</option>
                <option value="groom">Groom&apos;s Side</option>
                <option value="wall-left">Wall — Left Side</option>
                <option value="wall-right">Wall — Right Side</option>
                <option value="wall-back">Wall — Back</option>
                <option value="overflow">Overflow / Extra</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-2 mb-1">Row #</label>
              <input type="number" min="1" className={inputCls} value={rowForm.row_number ?? ''} onChange={e => setRowForm(f => ({ ...f, row_number: e.target.value }))} placeholder="Auto" title="Same number = same physical row (side by side)" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-2 mb-1">Seats</label>
              <input type="number" min="1" required className={inputCls} value={rowForm.capacity} onChange={e => setRowForm(f => ({ ...f, capacity: e.target.value }))} />
            </div>
            <Button type="submit" disabled={saving} className="bg-brand hover:bg-brand-hover">{saving ? 'Adding...' : 'Add'}</Button>
            <Button type="button" variant="outline" onClick={() => setShowAddRow(false)}>Cancel</Button>
          </form>
        </div>
      )}

      {/* ═══ DINING LAYOUT ═══ */}
      {isDining && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div
            className="lg:col-span-2 bg-cream rounded-xl border relative overflow-hidden"
            style={{ minHeight: 500 }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {tables.length === 0 && venueElements.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-text-4">Add tables or venue elements to get started</p>
              </div>
            )}
            {tables.map(table => {
              const filled = (table.assigned_guests ?? []).length
              const pct = filled / table.capacity
              const borderColor = selectedTable === table.id ? 'ring-2 ring-brand' : pct >= 1 ? 'border-green-400' : pct > 0.5 ? 'border-yellow-400' : 'border-brand-border'
              return (
              <div
                key={table.id}
                className={`absolute cursor-grab select-none ${borderColor} ${table.shape === 'round' ? 'rounded-full' : 'rounded-xl'} bg-white dark:bg-cream-2 border-2 shadow-sm flex flex-col items-center justify-center p-2`}
                style={{
                  left: table.x_position,
                  top: table.y_position,
                  width: table.shape === 'rectangle' ? 140 : 100,
                  height: 100,
                }}
                onMouseDown={e => handleMouseDown(e, table.id, table.x_position, table.y_position)}
                onClick={() => { setSelectedTable(table.id); setSelectedElement(null) }}
              >
                <span className="text-xs font-semibold text-text-1 truncate max-w-full">{table.name}</span>
                <span className="text-[10px] text-text-4">{(table.assigned_guests ?? []).length}/{table.capacity}</span>
                <div className="flex flex-wrap gap-0.5 mt-1 justify-center">
                  {(table.assigned_guests ?? []).slice(0, 4).map(g => (
                    <span key={g.id} className="w-4 h-4 rounded-full bg-cream text-brand text-[8px] flex items-center justify-center" title={g.guest_name}>
                      {g.guest_name.charAt(0)}
                    </span>
                  ))}
                  {(table.assigned_guests ?? []).length > 4 && (
                    <span className="text-[8px] text-text-4">+{table.assigned_guests.length - 4}</span>
                  )}
                </div>
              </div>
              )
            })}
            {/* Venue elements (non-seating) */}
            {venueElements.map(el => (
              <div
                key={el.id}
                className={`absolute cursor-grab select-none rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-2 ${
                  selectedElement === el.id
                    ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-400'
                    : 'border-purple-300 bg-purple-50/60 hover:border-purple-400'
                }`}
                style={{
                  left: el.x,
                  top: el.y,
                  width: el.width,
                  height: el.height,
                }}
                onMouseDown={e => handleElementMouseDown(e, el.id, el.x, el.y)}
                onClick={() => { setSelectedElement(el.id); setSelectedTable(null) }}
              >
                <span className="text-purple-600">{venueElementIcon(el.type)}</span>
                <span className="text-[10px] font-semibold text-purple-800 truncate max-w-full mt-0.5">{el.label}</span>
              </div>
            ))}
          </div>

          {/* Detail + Guests panel */}
          <div className="space-y-4">
            {/* Table / Element detail */}
            {selectedTableData ? (
              <div className="bg-white dark:bg-cream-2 rounded-2xl border border-brand-border p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-text-1 flex items-center gap-2">
                    {shapeIcon(selectedTableData.shape)} {selectedTableData.name}
                  </h3>
                  <Button variant="ghost" size="icon-xs" onClick={() => deleteTable(selectedTableData.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                  </Button>
                </div>
                <p className="text-sm text-text-4 mb-3">
                  {(selectedTableData.assigned_guests ?? []).length}/{selectedTableData.capacity} seats filled
                </p>

                {(selectedTableData.assigned_guests ?? []).length > 0 && (
                  <ul className="space-y-1 mb-3">
                    {selectedTableData.assigned_guests.map(g => (
                      <li key={g.id} className="flex items-center gap-2 text-sm text-text-2">
                        <Users className="h-3 w-3 text-text-4" />
                        <span>{g.guest_name}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Bulk assign selected guests */}
                {selectedGuestIds.size > 0 && (selectedTableData.assigned_guests ?? []).length < selectedTableData.capacity && (
                  <Button
                    size="sm"
                    className="w-full bg-brand hover:bg-brand-hover mb-2"
                    disabled={saving}
                    onClick={() => {
                      const available = selectedTableData.capacity - (selectedTableData.assigned_guests ?? []).length
                      const toAssign = Array.from(selectedGuestIds).slice(0, available)
                      bulkAssignGuestsToTable(selectedTableData.id, toAssign)
                    }}
                  >
                    <CheckSquare className="h-3.5 w-3.5 mr-1" />
                    Assign {Math.min(selectedGuestIds.size, selectedTableData.capacity - (selectedTableData.assigned_guests ?? []).length)} selected guest{selectedGuestIds.size > 1 ? 's' : ''}
                  </Button>
                )}

                {/* Single assign fallback */}
                {selectedGuestIds.size === 0 && (selectedTableData.assigned_guests ?? []).length < selectedTableData.capacity && (
                  <div className="flex gap-2">
                    <select className={inputCls} value={assignGuestId} onChange={e => setAssignGuestId(e.target.value)}>
                      <option value="">Select guest...</option>
                      {guests.filter(g => !assignedGuestIds.has(g.id)).map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                    <Button size="sm" onClick={() => assignGuestToTable(selectedTableData.id)} disabled={!assignGuestId || saving} className="bg-brand hover:bg-brand-hover">
                      Assign
                    </Button>
                  </div>
                )}
              </div>
            ) : selectedElement ? (
              (() => {
                const el = venueElements.find(e => e.id === selectedElement)
                if (!el) return null
                return (
                  <div className="bg-white dark:bg-cream-2 rounded-2xl border border-brand-border p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-purple-800 flex items-center gap-2">
                        {venueElementIcon(el.type)} {el.label}
                      </h3>
                      <Button variant="ghost" size="icon-xs" onClick={() => deleteVenueElement(el.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                      </Button>
                    </div>
                    <p className="text-xs text-text-4 mb-1">Type: {el.type.replace('-', ' ')}</p>
                    <p className="text-xs text-text-4">Drag to reposition on the floor plan</p>
                  </div>
                )
              })()
            ) : null}

            {/* Unassigned Guests panel */}
            {(() => {
              const unassigned = guests.filter(g => !assignedGuestIds.has(g.id))
              const households = new Map<string, Guest[]>()
              unassigned.forEach(g => {
                const hh = g.household_name || 'Individual Guests'
                if (!households.has(hh)) households.set(hh, [])
                households.get(hh)!.push(g)
              })
              return (
                <div className="bg-white dark:bg-cream-2 rounded-2xl border border-brand-border p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-text-1">
                      Unassigned ({unassigned.length})
                    </h3>
                    <div className="flex gap-1">
                      {selectedGuestIds.size > 0 && (
                        <Button size="sm" variant="ghost" onClick={() => setSelectedGuestIds(new Set())}>
                          <X className="h-3 w-3 mr-1" /> Clear
                        </Button>
                      )}
                      {unassigned.length > 0 && (
                        <Button size="sm" variant="outline" onClick={autoAssignAll} disabled={saving} title="Auto-assign all unassigned guests to tables with space">
                          <Shuffle className="h-3 w-3 mr-1" /> Auto
                        </Button>
                      )}
                    </div>
                  </div>

                  {unassigned.length === 0 ? (
                    <p className="text-xs text-text-4 text-center py-2">All guests are seated!</p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {Array.from(households.entries()).map(([hhName, hhGuests]) => (
                        <div key={hhName}>
                          <button
                            className="text-[10px] font-bold text-text-4 uppercase tracking-wider hover:text-brand mb-1"
                            onClick={() => selectHousehold(hhName)}
                            title={`Select/deselect all in ${hhName}`}
                          >
                            {hhName} ({hhGuests.length})
                          </button>
                          <div className="space-y-0.5">
                            {hhGuests.map(g => (
                              <label
                                key={g.id}
                                className={`flex items-center gap-2 px-2 py-1.5 rounded-xl cursor-pointer text-sm transition-colors ${
                                  selectedGuestIds.has(g.id) ? 'bg-cream text-brand' : 'hover:bg-cream text-text-2'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedGuestIds.has(g.id)}
                                  onChange={() => toggleGuestSelection(g.id)}
                                  className="rounded border-brand-border text-brand focus:ring-brand"
                                />
                                {g.name}
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {/* ═══ CEREMONY / THEATER LAYOUT ═══ */}
      {!isDining && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Row visualization */}
          <div className="lg:col-span-2 space-y-2">
            {/* Stage indicator */}
            <div className="bg-gradient-to-r from-cream via-cream/50 to-cream rounded-xl border border-brand-border py-3 text-center mb-4">
              <span className="text-xs font-bold text-brand uppercase tracking-wider">Stage / Mandap</span>
            </div>

            {rows.length === 0 && (
              <div className="border-2 border-dashed rounded-xl p-12 text-center">
                <p className="text-text-4">Add rows to get started</p>
              </div>
            )}

            {(() => {
              // Group rows by row_number so sections appear side by side
              const grouped = new Map<number, Row[]>()
              rows.forEach(row => {
                const num = row.row_number
                if (!grouped.has(num)) grouped.set(num, [])
                grouped.get(num)!.push(row)
              })
              return Array.from(grouped.entries())
                .sort(([a], [b]) => a - b)
                .map(([rowNum, sectionRows]) => (
                  <div key={rowNum} className="flex gap-3 items-stretch">
                    {sectionRows.map(row => {
                      const seats = row.seats ?? []
                      const filledCount = seats.length
                      return (
                        <button
                          key={row.id}
                          onClick={() => { setSelectedRow(row.id); setSelectedTable(null) }}
                          className={`flex-1 text-left rounded-xl border-2 p-5 transition-all ${
                            selectedRow === row.id ? 'border-brand bg-cream' : 'border-brand-border bg-white dark:bg-cream-2 hover:border-brand-border'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-text-1">{row.name}</span>
                              {row.section && (
                                <span className="text-[10px] bg-cream text-text-3 px-2 py-0.5 rounded-full font-medium">{sectionLabel(row.section)}</span>
                              )}
                            </div>
                            <span className="text-xs text-text-4">{filledCount}/{row.capacity} seated</span>
                          </div>
                          {/* Seat visualization */}
                          <div className="flex gap-1 flex-wrap">
                            {Array.from({ length: row.capacity }).map((_, i) => {
                              const hasSeat = i < filledCount
                              return (
                                <div
                                  key={i}
                                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[8px] font-bold ${
                                    hasSeat
                                      ? 'bg-cream border-brand-border text-brand'
                                      : 'bg-cream border-brand-border text-text-4'
                                  }`}
                                >
                                  {i + 1}
                                </div>
                              )
                            })}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                ))
            })()}
          </div>

          {/* Row detail panel */}
          <div className="space-y-4">
            {selectedRowData ? (
              <div className="bg-white dark:bg-cream-2 rounded-2xl border border-brand-border p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-text-1 flex items-center gap-2">
                    <Rows3 className="h-4 w-4" /> {selectedRowData.name}
                  </h3>
                  <Button variant="ghost" size="icon-xs" onClick={() => deleteRow(selectedRowData.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                  </Button>
                </div>
                {selectedRowData.section && (
                  <p className="text-xs text-text-4 mb-1">{sectionLabel(selectedRowData.section)}</p>
                )}
                <p className="text-sm text-text-4 mb-3">{selectedRowData.capacity} seats</p>

                <h4 className="text-sm font-medium text-text-2 mb-2">Assigned Guests</h4>
                {(selectedRowData.seats ?? []).length === 0 ? (
                  <p className="text-xs text-text-4 mb-3">No guests assigned yet</p>
                ) : (
                  <ul className="space-y-1 mb-3">
                    {selectedRowData.seats.map(s => (
                      <li key={s.id} className="flex items-center gap-2 text-sm text-text-2">
                        <Users className="h-3 w-3 text-text-4" />
                        <span>Seat {s.seat_number}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {(selectedRowData.seats ?? []).length < selectedRowData.capacity && (
                  <div className="flex gap-2">
                    <select className={inputCls} value={assignGuestId} onChange={e => setAssignGuestId(e.target.value)}>
                      <option value="">Select guest...</option>
                      {guests.filter(g => !assignedGuestIds.has(g.id)).map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                    <Button size="sm" onClick={() => assignGuestToRow(selectedRowData.id)} disabled={!assignGuestId || saving} className="bg-brand hover:bg-brand-hover">
                      Assign
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white dark:bg-cream-2 rounded-2xl border border-brand-border p-6 shadow-sm text-center">
                <Rows3 className="h-8 w-8 text-text-4 mx-auto mb-2" />
                <p className="text-base text-text-4">Select a row to view details</p>
              </div>
            )}
          </div>
        </div>
      )}
      {/* ═══ PRINT VIEW MODAL ═══ */}
      {showPrintView && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-auto p-4">
          <div className="bg-white dark:bg-cream-2 rounded-2xl shadow-xl max-w-2xl w-full my-8 print:shadow-none print:rounded-none print:my-0 print:max-w-none">
            <div className="flex items-center justify-between p-6 border-b print:hidden">
              <h2 className="text-xl font-black text-text-1">Guest Seating Directory</h2>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => window.print()} className="bg-brand hover:bg-brand-hover">
                  <Printer className="h-3.5 w-3.5 mr-1" /> Print
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowPrintView(false)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <div className="p-6 print:p-2">
              <h1 className="text-center text-xl font-black text-text-1 mb-1 hidden print:block">Guest Seating Directory</h1>
              <p className="text-center text-xs text-text-4 mb-6 print:mb-4">Find your name below for your table assignment</p>

              {(() => {
                // Build alphabetical guest → table mapping
                const directory: { name: string; table: string }[] = []
                for (const table of tables) {
                  for (const g of (table.assigned_guests ?? [])) {
                    directory.push({ name: g.guest_name, table: table.name })
                  }
                }
                directory.sort((a, b) => a.name.localeCompare(b.name))

                const unassigned = guests.filter(g => !assignedGuestIds.has(g.id))

                return (
                  <>
                    {directory.length === 0 ? (
                      <p className="text-base text-text-4 text-center py-16">No guests assigned to tables yet</p>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b-2 border-brand-border">
                            <th className="text-left py-2 px-3 font-semibold text-text-2">Guest Name</th>
                            <th className="text-right py-2 px-3 font-semibold text-text-2">Table</th>
                          </tr>
                        </thead>
                        <tbody>
                          {directory.map((entry, i) => (
                            <tr key={i} className={i % 2 === 0 ? 'bg-cream' : ''}>
                              <td className="py-1.5 px-3 text-text-1">{entry.name}</td>
                              <td className="py-1.5 px-3 text-right font-medium text-text-1">{entry.table}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                    {unassigned.length > 0 && (
                      <div className="mt-6 pt-4 border-t">
                        <p className="text-xs font-semibold text-text-4 uppercase mb-2">Not yet assigned ({unassigned.length})</p>
                        <div className="text-sm text-text-3 columns-2 gap-5">
                          {unassigned.sort((a, b) => a.name.localeCompare(b.name)).map(g => (
                            <p key={g.id} className="py-0.5">{g.name}</p>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-6 pt-4 border-t print:mt-4">
                      <p className="text-xs text-text-4 text-center">
                        Total: {directory.length} seated / {guests.length} guests
                      </p>
                    </div>
                  </>
                )
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
