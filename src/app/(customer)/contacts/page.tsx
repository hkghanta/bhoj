'use client'

import { useState, useEffect } from 'react'
import {
  Plus, Trash2, Pencil, X, Search, Upload, Download,
  Users, Tag, Loader2, Check,
} from 'lucide-react'

type Contact = {
  id: string
  label: string
  email: string | null
  phone: string | null
  tags: string[]
  notes: string | null
}

const SUGGESTED_TAGS = ['Family', 'Friends', 'Colleagues', 'Neighbours', 'VIP']

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editContact, setEditContact] = useState<Contact | null>(null)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [filterTag, setFilterTag] = useState<string | null>(null)
  const [showImportCSV, setShowImportCSV] = useState(false)
  const [csvText, setCsvText] = useState('')
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ created: number; skipped: number } | null>(null)

  // Form state
  const [label, setLabel] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [notes, setNotes] = useState('')

  async function fetchContacts() {
    setLoading(true)
    const res = await fetch('/api/contacts')
    if (res.ok) setContacts(await res.json())
    setLoading(false)
  }

  useEffect(() => { fetchContacts() }, [])

  function openForm(contact?: Contact) {
    if (contact) {
      setEditContact(contact)
      setLabel(contact.label)
      setEmail(contact.email ?? '')
      setPhone(contact.phone ?? '')
      setTags(contact.tags)
      setNotes(contact.notes ?? '')
    } else {
      setEditContact(null)
      setLabel('')
      setEmail('')
      setPhone('')
      setTags([])
      setNotes('')
    }
    setShowForm(true)
  }

  async function handleSave() {
    if (!label.trim()) return
    setSaving(true)
    const data = {
      label: label.trim(),
      email: email || undefined,
      phone: phone || undefined,
      tags,
      notes: notes || undefined,
    }
    const url = editContact ? `/api/contacts/${editContact.id}` : '/api/contacts'
    const res = await fetch(url, {
      method: editContact ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      setShowForm(false)
      setEditContact(null)
      fetchContacts()
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this contact from your guest book?')) return
    await fetch(`/api/contacts/${id}`, { method: 'DELETE' })
    fetchContacts()
  }

  function toggleTag(tag: string) {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  async function handleCSVImport() {
    if (!csvText.trim()) return
    setImporting(true)
    setImportResult(null)

    const lines = csvText.trim().split('\n').filter(l => l.trim())
    const contacts = lines.map(line => {
      const parts = line.split(',').map(p => p.trim())
      return {
        label: parts[0] || '',
        email: parts[1] || undefined,
        phone: parts[2] || undefined,
        tags: parts[3] ? parts[3].split(';').map(t => t.trim()) : [],
      }
    }).filter(c => c.label)

    const res = await fetch('/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contacts }),
    })
    if (res.ok) {
      const result = await res.json()
      setImportResult(result)
      fetchContacts()
      setCsvText('')
    }
    setImporting(false)
  }

  function exportCSV() {
    const header = 'Name,Email,Phone,Tags'
    const rows = contacts.map(c =>
      `"${c.label}","${c.email ?? ''}","${c.phone ?? ''}","${c.tags.join(';')}"`
    )
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'guest-book.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  // All unique tags from contacts
  const allTags = [...new Set(contacts.flatMap(c => c.tags))].sort()

  // Filtered contacts
  const filtered = contacts.filter(c => {
    if (search && !c.label.toLowerCase().includes(search.toLowerCase()) &&
        !(c.email ?? '').toLowerCase().includes(search.toLowerCase())) return false
    if (filterTag && !c.tags.includes(filterTag)) return false
    return true
  })

  const inputCls = 'w-full rounded-xl border-2 border-brand-border px-3.5 py-2.5 text-sm focus:border-brand/40 focus:ring-2 focus:ring-brand/20 outline-none bg-white dark:bg-cream-2 text-text-1 placeholder:text-text-4'

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Users className="h-5 w-5 text-brand" />
            <h1 className="text-2xl sm:text-3xl font-black text-text-1">My Guest Book</h1>
          </div>
          <p className="text-sm text-text-3">
            Your master contact list. Import guests into any event from here.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} disabled={contacts.length === 0}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 border-brand-border text-sm font-bold text-text-2 hover:bg-cream transition-colors disabled:opacity-40">
            <Download className="h-4 w-4" /> Export
          </button>
          <button onClick={() => setShowImportCSV(s => !s)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 border-brand-border text-sm font-bold text-text-2 hover:bg-cream transition-colors">
            <Upload className="h-4 w-4" /> Import CSV
          </button>
          <button onClick={() => openForm()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-black transition-colors"
            style={{ boxShadow: '0 4px 16px rgba(232,85,16,0.28)' }}>
            <Plus className="h-4 w-4" /> Add Contact
          </button>
        </div>
      </div>

      {/* CSV Import */}
      {showImportCSV && (
        <div className="mb-6 bg-white dark:bg-cream-2 rounded-2xl border-2 border-brand-border p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-black text-text-1">Import from CSV</h3>
            <button onClick={() => { setShowImportCSV(false); setImportResult(null) }} className="p-1 text-text-4 hover:text-text-3">
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs text-text-4 mb-3">
            Paste CSV data: <code className="bg-cream px-1.5 py-0.5 rounded">Name, Email, Phone, Tags (semicolon-separated)</code>
          </p>
          <textarea className={inputCls} rows={4} value={csvText} onChange={e => setCsvText(e.target.value)}
            placeholder={'The Sharma Family, sharma@email.com, +1 555-0101, Family\nJohn & Lisa, john@email.com, , Friends;Colleagues'} />
          <div className="flex items-center gap-3 mt-3">
            <button onClick={handleCSVImport} disabled={importing || !csvText.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-bold disabled:opacity-50">
              {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Import
            </button>
            {importResult && (
              <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                <Check className="h-4 w-4" />
                {importResult.created} imported{importResult.skipped > 0 && `, ${importResult.skipped} skipped (duplicates)`}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="mb-6 bg-white dark:bg-cream-2 rounded-2xl border-2 border-brand-border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-black text-text-1">{editContact ? 'Edit Contact' : 'Add Contact'}</h3>
            <button onClick={() => { setShowForm(false); setEditContact(null) }} className="p-1.5 rounded-lg hover:bg-cream">
              <X className="h-4 w-4 text-text-4" />
            </button>
          </div>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-bold text-text-2 mb-1.5">Name / Household *</label>
                <input className={inputCls} value={label} onChange={e => setLabel(e.target.value)}
                  placeholder="e.g. The Sharma Family" />
              </div>
              <div>
                <label className="block text-sm font-bold text-text-2 mb-1.5">Email</label>
                <input className={inputCls} value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="sharma@email.com" />
              </div>
              <div>
                <label className="block text-sm font-bold text-text-2 mb-1.5">Phone</label>
                <input className={inputCls} value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="+1 555-0101" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-text-2 mb-1.5">Tags</label>
              <div className="flex gap-2 flex-wrap">
                {SUGGESTED_TAGS.map(tag => (
                  <button key={tag} type="button" onClick={() => toggleTag(tag)}
                    className={`text-xs px-3 py-1.5 rounded-full border-2 font-bold transition-colors ${
                      tags.includes(tag) ? 'border-brand bg-cream text-brand' : 'border-brand-border text-text-3 hover:border-brand/40'
                    }`}>
                    {tag}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-text-2 mb-1.5">Notes</label>
              <input className={inputCls} value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Any notes about this contact" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => { setShowForm(false); setEditContact(null) }}
                className="px-4 py-2.5 rounded-xl border-2 border-brand-border text-sm font-bold text-text-3 hover:bg-cream transition-colors">
                Cancel
              </button>
              <button type="button" disabled={saving || !label.trim()} onClick={handleSave}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-black transition-colors disabled:opacity-60"
                style={{ boxShadow: '0 4px 16px rgba(232,85,16,0.28)' }}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {editContact ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search & filter */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-4" />
          <input className="w-full pl-9 pr-4 py-2.5 rounded-xl border-2 border-brand-border text-sm bg-white dark:bg-cream-2 focus:border-brand/40 focus:ring-2 focus:ring-brand/20 outline-none"
            value={search} onChange={e => setSearch(e.target.value)} placeholder="Search contacts..." />
        </div>
        {allTags.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            <button onClick={() => setFilterTag(null)}
              className={`text-xs px-3 py-1.5 rounded-full border font-bold transition-colors ${
                !filterTag ? 'border-brand bg-cream text-brand' : 'border-brand-border text-text-3'
              }`}>All</button>
            {allTags.map(tag => (
              <button key={tag} onClick={() => setFilterTag(filterTag === tag ? null : tag)}
                className={`text-xs px-3 py-1.5 rounded-full border font-bold transition-colors flex items-center gap-1 ${
                  filterTag === tag ? 'border-brand bg-cream text-brand' : 'border-brand-border text-text-3'
                }`}>
                <Tag className="h-3 w-3" /> {tag}
              </button>
            ))}
          </div>
        )}
        <span className="text-xs text-text-4 font-medium">{filtered.length} contact{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Contacts list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-text-4" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-brand-border rounded-2xl">
          <Users className="h-10 w-10 text-text-4 mx-auto mb-3" />
          <p className="text-base text-text-3 font-bold">
            {contacts.length === 0 ? 'Your guest book is empty' : 'No contacts match your search'}
          </p>
          <p className="text-sm text-text-4 mt-1">
            {contacts.length === 0 ? 'Add contacts here and import them into any event.' : 'Try a different search or filter.'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-cream-2 rounded-2xl border-2 border-brand-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-brand-border/60 text-left">
                <th className="py-3 px-4 font-bold text-text-2">Name</th>
                <th className="py-3 px-4 font-bold text-text-2 hidden sm:table-cell">Email</th>
                <th className="py-3 px-4 font-bold text-text-2 hidden md:table-cell">Phone</th>
                <th className="py-3 px-4 font-bold text-text-2 hidden lg:table-cell">Tags</th>
                <th className="py-3 px-4 w-24"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(contact => (
                <tr key={contact.id} className="border-b border-brand-border/30 hover:bg-cream/50 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-semibold text-text-1">{contact.label}</span>
                    {contact.notes && <p className="text-xs text-text-4 mt-0.5">{contact.notes}</p>}
                  </td>
                  <td className="py-3 px-4 text-text-3 hidden sm:table-cell">{contact.email ?? '—'}</td>
                  <td className="py-3 px-4 text-text-3 hidden md:table-cell">{contact.phone ?? '—'}</td>
                  <td className="py-3 px-4 hidden lg:table-cell">
                    <div className="flex gap-1 flex-wrap">
                      {contact.tags.map(tag => (
                        <span key={tag} className="text-xs font-bold px-2 py-0.5 rounded-full bg-cream text-brand border border-brand-border">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => openForm(contact)}
                        className="p-1.5 rounded-lg hover:bg-cream text-text-4 hover:text-text-2">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDelete(contact.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-text-4 hover:text-red-500">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
