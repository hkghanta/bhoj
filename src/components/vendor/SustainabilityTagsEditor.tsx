'use client'
import { useState, useEffect } from 'react'
import { Leaf, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

const SUSTAINABILITY_TAGS = [
  { value: 'compostable', label: 'Compostable packaging', icon: '♻️' },
  { value: 'locally_sourced', label: 'Locally sourced ingredients', icon: '📍' },
  { value: 'organic', label: 'Organic certified', icon: '🌿' },
  { value: 'zero_waste', label: 'Zero waste commitment', icon: '🗑️' },
  { value: 'farm_to_table', label: 'Farm to table', icon: '🌾' },
  { value: 'eco_packaging', label: 'Eco-friendly packaging', icon: '📦' },
  { value: 'energy_efficient', label: 'Energy efficient operations', icon: '⚡' },
  { value: 'carbon_neutral', label: 'Carbon neutral', icon: '🌍' },
]

export function SustainabilityTagsEditor() {
  const [tags, setTags] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/vendor/profile')
        if (!res.ok) throw new Error()
        const data = await res.json()
        setTags(data.sustainability_tags ?? [])
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  function toggle(tag: string) {
    setTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  async function save() {
    setSaving(true)
    try {
      const res = await fetch('/api/vendor/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sustainability_tags: tags }),
      })
      if (!res.ok) throw new Error()
      setAlert({ type: 'success', msg: 'Sustainability tags saved' })
      setTimeout(() => setAlert(null), 3000)
    } catch {
      setAlert({ type: 'error', msg: 'Failed to save' })
      setTimeout(() => setAlert(null), 3000)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-text-4" />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-brand-border shadow-sm p-6">
      <div className="flex items-center gap-2 mb-6">
        <Leaf className="h-5 w-5 text-green-600" />
        <h2 className="text-xl font-black text-text-1">Sustainability Practices</h2>
      </div>
      <p className="text-sm text-text-4 mb-6">
        Select the sustainability practices your business follows. These badges appear on your public profile.
      </p>

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

      <div className="grid grid-cols-2 gap-3 mb-6">
        {SUSTAINABILITY_TAGS.map(tag => (
          <button
            key={tag.value}
            type="button"
            onClick={() => toggle(tag.value)}
            className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm text-left transition-colors ${
              tags.includes(tag.value)
                ? 'bg-green-50 border-green-300 text-green-800'
                : 'bg-cream border-brand-border text-text-3 hover:bg-cream'
            }`}
          >
            <span>{tag.icon}</span>
            <span>{tag.label}</span>
          </button>
        ))}
      </div>

      <div className="flex justify-end">
        <Button
          onClick={save}
          disabled={saving}
          className="bg-green-600 hover:bg-green-700"
        >
          {saving ? 'Saving...' : 'Save Tags'}
        </Button>
      </div>
    </div>
  )
}
