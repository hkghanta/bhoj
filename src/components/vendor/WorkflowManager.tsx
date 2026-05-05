'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Workflow, Zap, Clock, Mail, MessageSquare, Plus, Pencil, Trash2, Loader2 } from 'lucide-react'

type WorkflowAction = {
  id: string
  action_type: string
  delay_hours: number
  config: string
  sort_order: number
}

type WorkflowItem = {
  id: string
  name: string
  trigger: string
  conditions: string
  is_active: boolean
  actions: WorkflowAction[]
}

const TRIGGERS = [
  { value: 'new_inquiry', label: 'New Inquiry' },
  { value: 'quote_sent', label: 'Quote Sent' },
  { value: 'booking_confirmed', label: 'Booking Confirmed' },
  { value: 'event_completed', label: 'Event Completed' },
  { value: 'payment_received', label: 'Payment Received' },
]

const ACTION_TYPES = [
  { value: 'send_email', label: 'Send Email' },
  { value: 'send_sms', label: 'Send SMS' },
  { value: 'create_task', label: 'Create Task' },
  { value: 'update_stage', label: 'Update Pipeline Stage' },
  { value: 'send_notification', label: 'Send Notification' },
]

const emptyForm = {
  name: '',
  trigger: 'new_inquiry',
  conditions: '{}',
  is_active: true,
}

const emptyAction = { action_type: 'send_email', delay_hours: '0', config: '{}' }

export function WorkflowManager() {
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [actions, setActions] = useState<typeof emptyAction[]>([])

  function showAlertMsg(type: 'success' | 'error', msg: string) {
    setAlert({ type, msg })
    setTimeout(() => setAlert(null), 3000)
  }

  async function fetchWorkflows() {
    setLoading(true)
    try {
      const res = await fetch('/api/vendor/workflows')
      if (!res.ok) throw new Error('Failed to load')
      setWorkflows(await res.json())
    } catch {
      showAlertMsg('error', 'Failed to load workflows')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchWorkflows() }, [])

  function openAdd() {
    setEditingId(null)
    setForm(emptyForm)
    setActions([])
    setShowForm(true)
  }

  function openEdit(wf: WorkflowItem) {
    setEditingId(wf.id)
    setForm({
      name: wf.name,
      trigger: wf.trigger,
      conditions: wf.conditions,
      is_active: wf.is_active,
    })
    setActions(wf.actions.map(a => ({
      action_type: a.action_type,
      delay_hours: a.delay_hours.toString(),
      config: a.config,
    })))
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const payload = {
      name: form.name,
      trigger: form.trigger,
      conditions: form.conditions,
      is_active: form.is_active,
      actions: actions.map((a, i) => ({
        action_type: a.action_type,
        delay_hours: Number(a.delay_hours),
        config: a.config,
        sort_order: i,
      })),
    }
    try {
      const url = editingId ? `/api/vendor/workflows/${editingId}` : '/api/vendor/workflows'
      const res = await fetch(url, {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Failed to save')
      showAlertMsg('success', editingId ? 'Workflow updated' : 'Workflow created')
      setShowForm(false)
      fetchWorkflows()
    } catch (err: any) {
      showAlertMsg('error', err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this workflow?')) return
    try {
      const res = await fetch(`/api/vendor/workflows/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      showAlertMsg('success', 'Workflow deleted')
      setWorkflows(w => w.filter(x => x.id !== id))
    } catch {
      showAlertMsg('error', 'Failed to delete')
    }
  }

  async function toggleActive(wf: WorkflowItem) {
    try {
      const res = await fetch(`/api/vendor/workflows/${wf.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !wf.is_active }),
      })
      if (!res.ok) throw new Error('Failed to update')
      setWorkflows(prev => prev.map(w => w.id === wf.id ? { ...w, is_active: !w.is_active } : w))
    } catch {
      showAlertMsg('error', 'Failed to toggle')
    }
  }

  function addAction() {
    setActions(a => [...a, { ...emptyAction }])
  }

  function removeAction(idx: number) {
    setActions(a => a.filter((_, i) => i !== idx))
  }

  function updateAction(idx: number, field: string, value: string) {
    setActions(a => a.map((act, i) => i === idx ? { ...act, [field]: value } : act))
  }

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-text-4" /></div>
  }

  const inputCls = 'w-full rounded-xl border border-brand-border px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none'

  return (
    <div>
      {alert && (
        <div className={`mb-6 rounded-xl px-4 py-3 text-sm ${alert.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {alert.msg}
        </div>
      )}

      <div className="flex justify-end mb-6">
        <Button onClick={openAdd} className="bg-brand hover:bg-brand-hover rounded-xl font-bold">
          <Plus className="h-4 w-4 mr-1" /> Create Workflow
        </Button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-brand-border p-6 shadow-sm mb-6">
          <h3 className="font-bold text-text-1 mb-6">{editingId ? 'Edit Workflow' : 'Create Workflow'}</h3>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-text-2 mb-1">Name</label>
                <input required className={inputCls} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-2 mb-1">Trigger</label>
                <select className={inputCls} value={form.trigger} onChange={e => setForm(f => ({ ...f, trigger: e.target.value }))}>
                  {TRIGGERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-2 mb-1">Conditions (JSON)</label>
              <textarea rows={2} className={inputCls + ' font-mono text-xs'} value={form.conditions} onChange={e => setForm(f => ({ ...f, conditions: e.target.value }))} />
            </div>
            <label className="flex items-center gap-2 text-sm text-text-2">
              <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="rounded border-brand-border" />
              Active
            </label>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-text-2">Actions</h4>
                <Button type="button" variant="outline" size="sm" onClick={addAction}><Plus className="h-3.5 w-3.5 mr-1" /> Add Action</Button>
              </div>
              {actions.length === 0 && <p className="text-xs text-text-4">No actions yet.</p>}
              {actions.map((action, idx) => (
                <div key={idx} className="border border-brand-border rounded-xl p-3 mb-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <select className={inputCls} value={action.action_type} onChange={e => updateAction(idx, 'action_type', e.target.value)}>
                      {ACTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                    <div className="w-32">
                      <input type="number" min="0" className={inputCls} placeholder="Delay (hrs)" value={action.delay_hours} onChange={e => updateAction(idx, 'delay_hours', e.target.value)} />
                    </div>
                    <Button type="button" variant="ghost" size="icon-xs" onClick={() => removeAction(idx)}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button>
                  </div>
                  <textarea rows={2} className={inputCls + ' font-mono text-xs'} placeholder="Config (JSON)" value={action.config} onChange={e => updateAction(idx, 'config', e.target.value)} />
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" disabled={saving} className="bg-brand hover:bg-brand-hover">{saving ? 'Saving...' : editingId ? 'Update' : 'Create'}</Button>
            </div>
          </form>
        </div>
      )}

      {workflows.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-xl">
          <Workflow className="h-10 w-10 text-text-4 mx-auto mb-3" />
          <p className="text-text-4">No workflows yet. Create your first automation.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {workflows.map(wf => (
            <div key={wf.id} className="bg-white rounded-2xl border border-brand-border p-6 shadow-sm flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-text-1">{wf.name}</h3>
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 mt-1">
                    <Zap className="h-3 w-3" /> {TRIGGERS.find(t => t.value === wf.trigger)?.label ?? wf.trigger}
                  </span>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon-xs" onClick={() => openEdit(wf)}><Pencil className="h-3.5 w-3.5 text-text-4" /></Button>
                  <Button variant="ghost" size="icon-xs" onClick={() => handleDelete(wf.id)}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm text-text-3 mb-3">
                <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {wf.actions.length} action{wf.actions.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="mt-auto pt-2">
                <button
                  onClick={() => toggleActive(wf)}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors ${wf.is_active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-cream text-text-4 border-brand-border'}`}
                >
                  {wf.is_active ? 'Active' : 'Inactive'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
