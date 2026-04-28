'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, X } from 'lucide-react'

const SUGGESTED_SERVICES = [
  'Full-service catering', 'Drop-off catering', 'Live cooking stations',
  'Breakfast/brunch catering', 'Corporate lunch boxes', 'Wedding catering',
  'Buffet setup', 'Plated service', 'Cocktail canapes',
]

type Props = { onNext: () => void; onBack: () => void }

export function Step2Services({ onNext, onBack }: Props) {
  const [services, setServices] = useState<string[]>([])
  const [custom, setCustom] = useState('')
  const [saving, setSaving] = useState(false)

  function toggleSuggested(name: string) {
    setServices(s => s.includes(name) ? s.filter(x => x !== name) : [...s, name])
  }

  function addCustom() {
    if (custom.trim() && !services.includes(custom.trim())) {
      setServices(s => [...s, custom.trim()])
      setCustom('')
    }
  }

  async function handleSave() {
    if (services.length === 0) { onNext(); return }
    setSaving(true)
    await fetch('/api/vendor/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ services: services.map(name => ({ name })) }),
    })
    setSaving(false)
    onNext()
  }

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold text-gray-900">What services do you offer?</h2>
      <p className="text-gray-500 text-sm">Select all that apply. You can edit these later.</p>

      <div className="flex flex-wrap gap-2">
        {SUGGESTED_SERVICES.map(s => (
          <button
            key={s}
            onClick={() => toggleSuggested(s)}
            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
              services.includes(s)
                ? 'bg-orange-600 text-white border-orange-600'
                : 'bg-white text-gray-700 border-gray-200 hover:border-orange-400'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          value={custom}
          onChange={e => setCustom(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addCustom()}
          placeholder="Add custom service…"
        />
        <Button variant="outline" onClick={addCustom}><Plus className="h-4 w-4" /></Button>
      </div>

      {services.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {services.map(s => (
            <Badge key={s} variant="secondary" className="flex items-center gap-1">
              {s}
              <button onClick={() => setServices(sv => sv.filter(x => x !== s))}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onBack}>← Back</Button>
        <Button onClick={handleSave} disabled={saving} className="flex-1 bg-orange-600 hover:bg-orange-700">
          {saving ? 'Saving…' : 'Save & Continue →'}
        </Button>
      </div>
    </div>
  )
}
