'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { MessageSquare, FileText, Tag, Copy, Plus, Pencil, Trash2, Loader2 } from 'lucide-react'

type Template = {
  id: string
  name: string
  subject: string | null
  body: string
  category: string
}

const CATEGORIES = [
  { value: 'greeting', label: 'Greeting' },
  { value: 'follow_up', label: 'Follow Up' },
  { value: 'post_event', label: 'Post Event' },
  { value: 'booking', label: 'Booking' },
]

const CATEGORY_COLORS: Record<string, string> = {
  greeting: 'bg-blue-50 text-blue-700 border-blue-200',
  follow_up: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  post_event: 'bg-green-50 text-green-700 border-green-200',
  booking: 'bg-purple-50 text-purple-700 border-purple-200',
}

const emptyForm = { name: '', subject: '', body: '', category: 'greeting' }

export function MessageTemplateManager() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)

  function showAlertMsg(type: 'success' | 'error', msg: string) {
    setAlert({ type, msg })
    setTimeout(() => setAlert(null), 3000)
  }

  async function fetchTemplates() {
    setLoading(true)
    try {
      const res = await fetch('/api/vendor/message-templates')
      if (!res.ok) throw new Error('Failed to load')
      setTemplates(await res.json())
    } catch {
      showAlertMsg('error', 'Failed to load templates')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTemplates() }, [])

  function openAdd() {
    setEditingId(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  function openEdit(t: Template) {
    setEditingId(t.id)
    setForm({ name: t.name, subject: t.subject ?? '', body: t.body, category: t.category })
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const payload = {
      name: form.name,
      subject: form.subject || null,
      body: form.body,
      category: form.category,
    }
    try {
      const url = editingId ? `/api/vendor/message-templates/${editingId}` : '/api/vendor/message-templates'
      const res = await fetch(url, {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Failed to save')
      showAlertMsg('success', editingId ? 'Template updated' : 'Template created')
      setShowForm(false)
      fetchTemplates()
    } catch (err: any) {
      showAlertMsg('error', err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this template?')) return
    try {
      const res = await fetch(`/api/vendor/message-templates/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      showAlertMsg('success', 'Template deleted')
      setTemplates(t => t.filter(x => x.id !== id))
    } catch {
      showAlertMsg('error', 'Failed to delete')
    }
  }

  function copyBody(body: string) {
    navigator.clipboard.writeText(body)
    showAlertMsg('success', 'Copied to clipboard')
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
          <Plus className="h-4 w-4 mr-1" /> Create Template
        </Button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-brand-border p-6 shadow-sm mb-6">
          <h3 className="font-bold text-text-1 mb-6">{editingId ? 'Edit Template' : 'Create Template'}</h3>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-text-2 mb-1">Name</label>
                <input required className={inputCls} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-2 mb-1">Category</label>
                <select className={inputCls} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-2 mb-1">Subject</label>
              <input className={inputCls} value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-2 mb-1">Body</label>
              <textarea rows={6} required className={inputCls} value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" disabled={saving} className="bg-brand hover:bg-brand-hover">{saving ? 'Saving...' : editingId ? 'Update' : 'Create'}</Button>
            </div>
          </form>
        </div>
      )}

      {templates.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-xl">
          <MessageSquare className="h-10 w-10 text-text-4 mx-auto mb-3" />
          <p className="text-text-4">No message templates yet.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map(t => (
            <div key={t.id} className="bg-white rounded-2xl border border-brand-border p-6 shadow-sm flex flex-col">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold text-text-1">{t.name}</h3>
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border mt-1 ${CATEGORY_COLORS[t.category] ?? 'bg-cream text-text-2 border-brand-border'}`}>
                    <Tag className="h-3 w-3" /> {CATEGORIES.find(c => c.value === t.category)?.label ?? t.category}
                  </span>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon-xs" onClick={() => copyBody(t.body)} title="Copy body"><Copy className="h-3.5 w-3.5 text-text-4" /></Button>
                  <Button variant="ghost" size="icon-xs" onClick={() => openEdit(t)}><Pencil className="h-3.5 w-3.5 text-text-4" /></Button>
                  <Button variant="ghost" size="icon-xs" onClick={() => handleDelete(t.id)}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button>
                </div>
              </div>
              {t.subject && <p className="text-sm text-text-2 mb-1"><FileText className="h-3 w-3 inline mr-1" />{t.subject}</p>}
              <p className="text-sm text-text-4 line-clamp-3 mt-auto">{t.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
