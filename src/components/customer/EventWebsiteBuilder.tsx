'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Globe, Palette, Image, FileText, Eye, Plus, Trash2, Loader2 } from 'lucide-react'

type FAQ = { question: string; answer: string }

type WebsiteData = {
  id: string
  slug: string
  template: string
  hero_photo_url: string | null
  our_story: string | null
  travel_info: string | null
  accommodation: string | null
  faqs: FAQ[]
  colors: { primary: string; secondary: string; accent: string }
  is_published: boolean
}

const TEMPLATES = [
  { value: 'classic', label: 'Classic' },
  { value: 'modern', label: 'Modern' },
  { value: 'floral', label: 'Floral' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'royal', label: 'Royal' },
]

export function EventWebsiteBuilder({ eventId }: { eventId: string }) {
  const [website, setWebsite] = useState<WebsiteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [createSlug, setCreateSlug] = useState('')
  const [createTemplate, setCreateTemplate] = useState('classic')

  function showAlert(type: 'success' | 'error', msg: string) {
    setAlert({ type, msg })
    setTimeout(() => setAlert(null), 3000)
  }

  async function fetchWebsite() {
    setLoading(true)
    try {
      const res = await fetch(`/api/events/${eventId}/website`)
      if (res.status === 404) {
        setWebsite(null)
        return
      }
      if (!res.ok) throw new Error('Failed to load')
      setWebsite(await res.json())
    } catch {
      showAlert('error', 'Failed to load website data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchWebsite() }, [eventId])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(`/api/events/${eventId}/website`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: createSlug, template: createTemplate }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to create')
      showAlert('success', 'Website created')
      fetchWebsite()
    } catch (err: any) {
      showAlert('error', err.message ?? 'Failed to create')
    } finally {
      setSaving(false)
    }
  }

  async function handleSave() {
    if (!website) return
    setSaving(true)
    try {
      const res = await fetch(`/api/events/${eventId}/website`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: website.slug,
          template: website.template,
          hero_photo_url: website.hero_photo_url,
          our_story: website.our_story,
          travel_info: website.travel_info,
          accommodation: website.accommodation,
          faqs: website.faqs,
          colors: website.colors,
          is_published: website.is_published,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to save')
      showAlert('success', 'Website updated')
      setWebsite(await res.json())
    } catch (err: any) {
      showAlert('error', err.message ?? 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  function updateField(field: string, value: any) {
    setWebsite(w => w ? { ...w, [field]: value } : w)
  }

  function updateColor(key: string, value: string) {
    setWebsite(w => w ? { ...w, colors: { ...w.colors, [key]: value } } : w)
  }

  function addFAQ() {
    setWebsite(w => w ? { ...w, faqs: [...(w.faqs || []), { question: '', answer: '' }] } : w)
  }

  function updateFAQ(idx: number, field: 'question' | 'answer', value: string) {
    setWebsite(w => {
      if (!w) return w
      const faqs = [...w.faqs]
      faqs[idx] = { ...faqs[idx], [field]: value }
      return { ...w, faqs }
    })
  }

  function removeFAQ(idx: number) {
    setWebsite(w => w ? { ...w, faqs: w.faqs.filter((_, i) => i !== idx) } : w)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-text-4" />
      </div>
    )
  }

  const inputCls = 'w-full rounded-xl border border-brand-border px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none'

  return (
    <div>
      {alert && (
        <div className={`mb-4 rounded-xl px-4 py-3 text-sm ${alert.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {alert.msg}
        </div>
      )}

      {!website ? (
        <div className="border-2 border-dashed rounded-xl p-12 text-center">
          <Globe className="h-10 w-10 text-text-4 mx-auto mb-3" />
          <h2 className="text-xl font-black text-text-1 mb-6">Create Event Website</h2>
          <form onSubmit={handleCreate} className="max-w-sm mx-auto space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-2 mb-1">URL Slug</label>
              <input required className={inputCls} placeholder="our-wedding" value={createSlug} onChange={e => setCreateSlug(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-2 mb-1">Template</label>
              <select className={inputCls} value={createTemplate} onChange={e => setCreateTemplate(e.target.value)}>
                {TEMPLATES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <Button type="submit" disabled={saving} className="bg-brand hover:bg-brand-hover w-full">
              {saving ? 'Creating...' : 'Create Website'}
            </Button>
          </form>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <a href={`/w/${website.slug}`} target="_blank" className="inline-flex items-center gap-1 text-sm text-brand hover:underline">
              <Eye className="h-4 w-4" /> Preview: /w/{website.slug}
            </a>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-text-2">
                <input type="checkbox" checked={website.is_published} onChange={e => updateField('is_published', e.target.checked)} className="rounded border-brand-border" />
                Published
              </label>
              <Button onClick={handleSave} disabled={saving} className="bg-brand hover:bg-brand-hover">
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">

            <div className="bg-white dark:bg-cream-2 rounded-2xl border border-brand-border p-6 shadow-sm space-y-5">
              <h3 className="font-bold text-text-1 flex items-center gap-2"><Globe className="h-4 w-4 text-brand" /> General</h3>
              <div>
                <label className="block text-sm font-medium text-text-2 mb-1">Slug</label>
                <input className={inputCls} value={website.slug} onChange={e => updateField('slug', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-2 mb-1">Template</label>
                <select className={inputCls} value={website.template} onChange={e => updateField('template', e.target.value)}>
                  {TEMPLATES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-2 mb-1">Hero Photo URL</label>
                <input className={inputCls} value={website.hero_photo_url ?? ''} onChange={e => updateField('hero_photo_url', e.target.value || null)} placeholder="https://..." />
              </div>
            </div>

            <div className="bg-white dark:bg-cream-2 rounded-2xl border border-brand-border p-6 shadow-sm space-y-5">
              <h3 className="font-bold text-text-1 flex items-center gap-2"><Palette className="h-4 w-4 text-brand" /> Colors</h3>
              {(['primary', 'secondary', 'accent'] as const).map(key => (
                <div key={key} className="flex items-center gap-3">
                  <label className="text-sm font-medium text-text-2 capitalize w-24">{key}</label>
                  <input type="color" value={website.colors?.[key] ?? '#000000'} onChange={e => updateColor(key, e.target.value)} className="h-8 w-12 rounded border border-brand-border cursor-pointer" />
                  <input className={inputCls} value={website.colors?.[key] ?? ''} onChange={e => updateColor(key, e.target.value)} />
                </div>
              ))}
            </div>

            <div className="bg-white dark:bg-cream-2 rounded-2xl border border-brand-border p-6 shadow-sm space-y-5">
              <h3 className="font-bold text-text-1 flex items-center gap-2"><FileText className="h-4 w-4 text-brand" /> Content</h3>
              <div>
                <label className="block text-sm font-medium text-text-2 mb-1">Our Story</label>
                <textarea rows={4} className={inputCls} value={website.our_story ?? ''} onChange={e => updateField('our_story', e.target.value || null)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-2 mb-1">Travel Info</label>
                <textarea rows={3} className={inputCls} value={website.travel_info ?? ''} onChange={e => updateField('travel_info', e.target.value || null)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-2 mb-1">Accommodation</label>
                <textarea rows={3} className={inputCls} value={website.accommodation ?? ''} onChange={e => updateField('accommodation', e.target.value || null)} />
              </div>
            </div>

            <div className="bg-white dark:bg-cream-2 rounded-2xl border border-brand-border p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-text-1 flex items-center gap-2"><Image className="h-4 w-4 text-brand" /> FAQs</h3>
                <Button variant="outline" size="sm" onClick={addFAQ}><Plus className="h-3.5 w-3.5 mr-1" /> Add</Button>
              </div>
              {(!website.faqs || website.faqs.length === 0) && (
                <p className="text-sm text-text-4">No FAQs yet.</p>
              )}
              {website.faqs?.map((faq, idx) => (
                <div key={idx} className="border rounded-xl p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <input className={inputCls} placeholder="Question" value={faq.question} onChange={e => updateFAQ(idx, 'question', e.target.value)} />
                    <Button variant="ghost" size="icon-xs" onClick={() => removeFAQ(idx)}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button>
                  </div>
                  <textarea rows={2} className={inputCls} placeholder="Answer" value={faq.answer} onChange={e => updateFAQ(idx, 'answer', e.target.value)} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
