'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, Save, Clock, Loader2, AlertTriangle, Shield } from 'lucide-react'

type Tier = {
  hours_before_event: number
  refund_percent: number
  description: string
}

type Preset = {
  id: string
  name: string
  description: string | null
  tiers: { hours_before: number; refund_percent: number }[]
}

export function CancellationPolicyEditor() {
  const [tiers, setTiers] = useState<Tier[]>([])
  const [presets, setPresets] = useState<Preset[]>([])
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null)
  const [mode, setMode] = useState<'preset' | 'custom'>('custom')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  function showAlert(type: 'success' | 'error', msg: string) {
    setAlert({ type, msg })
    setTimeout(() => setAlert(null), 3000)
  }

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/vendor/cancellation-policy')
        if (!res.ok) throw new Error('Failed to load')
        const data = await res.json()
        setPresets(data.presets ?? [])
        const customTiers = (data.tiers ?? []).map((t: any) => ({
          hours_before_event: t.hours_before_event,
          refund_percent: t.refund_percent,
          description: t.description ?? '',
        }))
        setTiers(customTiers)
        if (data.preset_id && customTiers.length === 0) {
          setSelectedPresetId(data.preset_id)
          setMode('preset')
        } else if (customTiers.length > 0) {
          setMode('custom')
        }
      } catch {
        showAlert('error', 'Failed to load cancellation policy')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  function addTier() {
    setTiers(prev => [
      ...prev,
      { hours_before_event: 0, refund_percent: 100, description: '' },
    ])
  }

  function removeTier(index: number) {
    setTiers(prev => prev.filter((_, i) => i !== index))
  }

  function updateTier(index: number, field: keyof Tier, value: string | number) {
    setTiers(prev =>
      prev.map((t, i) => (i === index ? { ...t, [field]: value } : t))
    )
  }

  function selectPreset(presetId: string) {
    setSelectedPresetId(presetId)
    setMode('preset')
  }

  function switchToCustom() {
    setMode('custom')
    setSelectedPresetId(null)
    if (tiers.length === 0) {
      // Pre-fill with a reasonable default
      setTiers([
        { hours_before_event: 72, refund_percent: 100, description: 'Full refund' },
        { hours_before_event: 24, refund_percent: 50, description: 'Partial refund' },
        { hours_before_event: 0, refund_percent: 0, description: 'No refund' },
      ])
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const payload = mode === 'preset'
        ? { preset_id: selectedPresetId }
        : {
            tiers: tiers.map(t => ({
              hours_before_event: Number(t.hours_before_event),
              refund_percent: Number(t.refund_percent),
              description: t.description || undefined,
            })),
          }
      const res = await fetch('/api/vendor/cancellation-policy', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Failed to save')
      }
      const data = await res.json()
      if (data.tiers) {
        setTiers(
          data.tiers.map((t: any) => ({
            hours_before_event: t.hours_before_event,
            refund_percent: t.refund_percent,
            description: t.description ?? '',
          }))
        )
      }
      showAlert('success', 'Cancellation policy saved')
    } catch (err: any) {
      showAlert('error', err.message ?? 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  // Sort tiers by hours descending for the timeline
  const sortedTiers = [...tiers].sort(
    (a, b) => Number(b.hours_before_event) - Number(a.hours_before_event)
  )

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

      {/* Preset selector */}
      {presets.length > 0 && (
        <div className="bg-white rounded-2xl border border-brand-border shadow-sm p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-4 w-4 text-brand" />
            <h3 className="text-sm font-medium text-text-2">Quick Presets</h3>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            {presets.map(preset => {
              const presetTiers = preset.tiers as { hours_before: number; refund_percent: number }[]
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => selectPreset(preset.id)}
                  className={`rounded-xl border p-3 text-left transition-colors ${
                    mode === 'preset' && selectedPresetId === preset.id
                      ? 'bg-cream border-brand-border ring-1 ring-brand'
                      : 'bg-cream border-brand-border hover:bg-cream'
                  }`}
                >
                  <div className="font-medium text-sm text-text-1">{preset.name}</div>
                  <div className="text-xs text-text-4 mt-1">{preset.description}</div>
                  <div className="mt-2 space-y-0.5">
                    {presetTiers.map((t, i) => (
                      <div key={i} className="text-xs text-text-4">
                        {t.hours_before}h+ → {t.refund_percent}% refund
                      </div>
                    ))}
                  </div>
                </button>
              )
            })}
          </div>
          <button
            type="button"
            onClick={switchToCustom}
            className={`text-sm ${
              mode === 'custom'
                ? 'text-brand font-medium'
                : 'text-text-4 hover:text-text-2'
            }`}
          >
            {mode === 'custom' ? '✓ Using custom tiers' : 'Or define custom tiers →'}
          </button>
        </div>
      )}

      {/* Visual timeline — only show for custom mode */}
      {mode === 'custom' && sortedTiers.length > 0 && (
        <div className="bg-white rounded-2xl border border-brand-border p-6 shadow-sm mb-6">
          <h3 className="text-sm font-medium text-text-2 mb-4">Refund Timeline</h3>
          <div className="relative">
            <div className="absolute top-4 left-0 right-0 h-1 bg-cream-2 rounded-full" />
            <div className="flex justify-between relative">
              {sortedTiers.map((tier, i) => {
                const refundPct = Number(tier.refund_percent)
                const color =
                  refundPct >= 75
                    ? 'bg-green-500'
                    : refundPct >= 50
                      ? 'bg-yellow-500'
                      : refundPct >= 25
                        ? 'bg-brand'
                        : 'bg-red-500'
                return (
                  <div key={i} className="flex flex-col items-center" style={{ flex: 1 }}>
                    <div className={`h-3 w-3 rounded-full ${color} relative z-10 ring-2 ring-white`} />
                    <span className="text-xs font-medium text-text-2 mt-2">
                      {tier.hours_before_event}h
                    </span>
                    <span className="text-xs text-text-4">{tier.refund_percent}% refund</span>
                  </div>
                )
              })}
              <div className="flex flex-col items-center" style={{ flex: 1 }}>
                <div className="h-3 w-3 rounded-full bg-cream-2 relative z-10 ring-2 ring-white" />
                <span className="text-xs font-medium text-text-2 mt-2">Event</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Editable table — only for custom mode */}
      {mode !== 'custom' ? null : <div className="bg-white rounded-2xl border border-brand-border shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-cream border-b">
              <th className="text-left text-sm font-medium text-text-4 px-4 py-3">
                Hours Before Event
              </th>
              <th className="text-left text-sm font-medium text-text-4 px-4 py-3">
                Refund %
              </th>
              <th className="text-left text-sm font-medium text-text-4 px-4 py-3">
                Description
              </th>
              <th className="w-12" />
            </tr>
          </thead>
          <tbody>
            {tiers.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-10 text-text-4">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-text-4" />
                  No tiers defined. Add one to set your cancellation policy.
                </td>
              </tr>
            ) : (
              tiers.map((tier, i) => (
                <tr key={i} className="border-b last:border-b-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-text-4" />
                      <input
                        type="number"
                        min="0"
                        className="w-20 rounded-xl border border-brand-border px-2 py-1.5 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                        value={tier.hours_before_event}
                        onChange={e =>
                          updateTier(i, 'hours_before_event', e.target.value)
                        }
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      className="w-20 rounded-xl border border-brand-border px-2 py-1.5 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                      value={tier.refund_percent}
                      onChange={e =>
                        updateTier(i, 'refund_percent', e.target.value)
                      }
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      className="w-full rounded-xl border border-brand-border px-2 py-1.5 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                      value={tier.description}
                      onChange={e =>
                        updateTier(i, 'description', e.target.value)
                      }
                      placeholder="e.g. Full refund"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Button variant="ghost" size="icon-xs" onClick={() => removeTier(i)}>
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>}

      <div className="flex justify-between mt-4">
        {mode === 'custom' && (
          <Button variant="outline" onClick={addTier}>
            <Plus className="h-4 w-4 mr-1" /> Add Tier
          </Button>
        )}
        <div className={mode !== 'custom' ? 'ml-auto' : ''}>
          <Button
            className="bg-brand hover:bg-brand-hover"
            onClick={handleSave}
            disabled={saving || (mode === 'preset' && !selectedPresetId)}
          >
            <Save className="h-4 w-4 mr-1" />
            {saving ? 'Saving...' : 'Save Policy'}
          </Button>
        </div>
      </div>
    </div>
  )
}
