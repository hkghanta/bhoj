'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Plus,
  Pencil,
  Trash2,
  FileText,
  Star,
  Loader2,
} from 'lucide-react'

type ContractTemplate = {
  id: string
  name: string
  content: string
  terms_and_conditions: string | null
  is_default: boolean
  created_at: string
}

const emptyForm = {
  name: '',
  content: '',
  terms_and_conditions: '',
  is_default: false,
}

export function ContractTemplatesManager() {
  const [templates, setTemplates] = useState<ContractTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  function showAlert(type: 'success' | 'error', msg: string) {
    setAlert({ type, msg })
    setTimeout(() => setAlert(null), 3000)
  }

  async function fetchTemplates() {
    setLoading(true)
    try {
      const res = await fetch('/api/vendor/contract-templates')
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json()
      setTemplates(data.templates ?? [])
    } catch {
      showAlert('error', 'Failed to load contract templates')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTemplates()
  }, [])

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  function openEdit(tmpl: ContractTemplate) {
    setEditingId(tmpl.id)
    setForm({
      name: tmpl.name,
      content: tmpl.content,
      terms_and_conditions: tmpl.terms_and_conditions ?? '',
      is_default: tmpl.is_default,
    })
    setDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const payload = {
      name: form.name,
      content: form.content,
      terms_and_conditions: form.terms_and_conditions || null,
      is_default: form.is_default,
    }

    try {
      const url = editingId
        ? `/api/vendor/contract-templates/${editingId}`
        : '/api/vendor/contract-templates'
      const method = editingId ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Failed to save')
      }
      showAlert('success', editingId ? 'Template updated' : 'Template created')
      setDialogOpen(false)
      fetchTemplates()
    } catch (err: any) {
      showAlert('error', err.message ?? 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this contract template?')) return
    try {
      const res = await fetch(`/api/vendor/contract-templates/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete')
      showAlert('success', 'Template deleted')
      setTemplates(t => t.filter(x => x.id !== id))
    } catch {
      showAlert('error', 'Failed to delete template')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-text-4" />
      </div>
    )
  }

  return (
    <div>
      {alert && (
        <div
          className={`mb-6 rounded-xl px-4 py-3 text-sm ${
            alert.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {alert.msg}
        </div>
      )}

      <div className="flex justify-end mb-6">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger
            render={
              <Button className="bg-brand hover:bg-brand-hover rounded-xl font-bold" onClick={openCreate}>
                <Plus className="h-4 w-4 mr-1" /> Add Template
              </Button>
            }
          />
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingId ? 'Edit Contract Template' : 'New Contract Template'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5 mt-2">
              <div>
                <label className="block text-sm font-medium text-text-2 mb-1">
                  Template Name
                </label>
                <input
                  required
                  className="w-full rounded-xl border border-brand-border px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Standard Catering Contract"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-2 mb-1">
                  Contract Content
                </label>
                <textarea
                  required
                  rows={8}
                  className="w-full rounded-xl border border-brand-border px-3 py-2 text-sm font-mono focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  placeholder="Enter your contract body text..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-2 mb-1">
                  Terms & Conditions (optional)
                </label>
                <textarea
                  rows={4}
                  className="w-full rounded-xl border border-brand-border px-3 py-2 text-sm font-mono focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  value={form.terms_and_conditions}
                  onChange={e =>
                    setForm(f => ({ ...f, terms_and_conditions: e.target.value }))
                  }
                  placeholder="Additional terms and conditions..."
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-text-2">
                <input
                  type="checkbox"
                  checked={form.is_default}
                  onChange={e =>
                    setForm(f => ({ ...f, is_default: e.target.checked }))
                  }
                  className="rounded border-brand-border"
                />
                Set as default template
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-brand hover:bg-brand-hover"
                >
                  {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-xl">
          <FileText className="h-10 w-10 text-text-4 mx-auto mb-3" />
          <p className="text-text-4">
            No contract templates yet. Create one to attach to your quotes.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {templates.map(tmpl => (
            <div
              key={tmpl.id}
              className="bg-white rounded-2xl border border-brand-border p-6 shadow-sm"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-text-4" />
                  <h3 className="font-bold text-text-1">{tmpl.name}</h3>
                  {tmpl.is_default && (
                    <span className="inline-flex items-center gap-1 bg-cream text-brand text-xs px-2 py-0.5 rounded-full border border-brand-border">
                      <Star className="h-3 w-3" /> Default
                    </span>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon-xs" onClick={() => openEdit(tmpl)}>
                    <Pencil className="h-3.5 w-3.5 text-text-4" />
                  </Button>
                  <Button variant="ghost" size="icon-xs" onClick={() => handleDelete(tmpl.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-text-4 line-clamp-2">
                {tmpl.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
