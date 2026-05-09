'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Palette, Sparkles, Heart, DollarSign, Crown, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react'

const COLOR_SWATCHES = [
  '#FF6B6B', '#FF8E72', '#FFA94D', '#FFD43B', '#A9E34B', '#69DB7C',
  '#38D9A9', '#3BC9DB', '#4DABF7', '#748FFC', '#9775FA', '#DA77F2',
  '#F783AC', '#E8590C', '#D6336C', '#862E9C', '#364FC7', '#0B7285',
  '#2B8A3E', '#E67700', '#C2255C', '#5F3DC4', '#1864AB', '#087F5B',
  '#FFFFFF', '#F8F9FA', '#DEE2E6', '#ADB5BD', '#495057', '#212529',
]

const THEMES = ['Traditional', 'Modern', 'Rustic', 'Bohemian', 'Royal', 'Minimalist']
const VIBES = ['Intimate', 'Grand', 'Fun', 'Elegant', 'Cultural']
const FORMALITY = ['Casual', 'Semi-formal', 'Formal', 'Black-tie']

const STEPS = [
  { title: 'Color Preferences', icon: Palette },
  { title: 'Theme Preferences', icon: Sparkles },
  { title: 'Event Vibe', icon: Heart },
  { title: 'Budget Range', icon: DollarSign },
  { title: 'Formality', icon: Crown },
]

export default function StyleQuizPage() {
  const [step, setStep] = useState(0)
  const [colors, setColors] = useState<string[]>([])
  const [themes, setThemes] = useState<string[]>([])
  const [vibes, setVibes] = useState<string[]>([])
  const [budget, setBudget] = useState(50000)
  const [formality, setFormality] = useState('')
  const [saving, setSaving] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  function showAlertMsg(type: 'success' | 'error', msg: string) {
    setAlert({ type, msg })
    setTimeout(() => setAlert(null), 3000)
  }

  function toggleArrayItem<T>(arr: T[], item: T): T[] {
    return arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item]
  }

  async function handleSubmit() {
    setSaving(true)
    try {
      const res = await fetch('/api/customer/style-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ colors, themes, vibes, budget, formality }),
      })
      if (!res.ok) throw new Error('Failed to save')
      setCompleted(true)
    } catch (err: any) {
      showAlertMsg('error', err.message)
    } finally {
      setSaving(false)
    }
  }

  if (completed) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white dark:bg-cream-2 rounded-xl border p-8 shadow-sm text-center">
          <Sparkles className="h-12 w-12 text-brand mx-auto mb-4" />
          <h2 className="text-2xl font-extrabold tracking-tight text-text-1 mb-4">Your Style Profile</h2>
          <div className="text-left space-y-4">
            <div>
              <h4 className="text-sm font-medium text-text-2 mb-2">Colors</h4>
              <div className="flex flex-wrap gap-2">
                {colors.map(c => <div key={c} className="w-8 h-8 rounded-xl border" style={{ backgroundColor: c }} />)}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-text-2 mb-2">Themes</h4>
              <div className="flex flex-wrap gap-2">
                {themes.map(t => <span key={t} className="text-xs px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">{t}</span>)}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-text-2 mb-2">Vibes</h4>
              <div className="flex flex-wrap gap-2">
                {vibes.map(v => <span key={v} className="text-xs px-3 py-1 rounded-full bg-pink-50 text-pink-700 border border-pink-200">{v}</span>)}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-text-2 mb-1">Budget</h4>
              <p className="text-text-1 font-semibold">${budget.toLocaleString()}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-text-2 mb-1">Formality</h4>
              <p className="text-text-1 font-semibold">{formality}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const StepIcon = STEPS[step].icon

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-text-1">Style Quiz</h1>
        <p className="text-text-3 mt-1">Help us understand your event style preferences.</p>
      </div>

      {alert && (
        <div className={`mb-4 rounded-xl px-4 py-3 text-sm ${alert.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {alert.msg}
        </div>
      )}

      <div className="flex gap-2 mb-6">
        {STEPS.map((s, i) => (
          <div key={i} className={`flex-1 h-1.5 rounded-full ${i <= step ? 'bg-brand' : 'bg-cream-2'}`} />
        ))}
      </div>

      <div className="bg-white dark:bg-cream-2 rounded-xl border p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-text-1 flex items-center gap-2 mb-6">
          <StepIcon className="h-5 w-5 text-brand" /> {STEPS[step].title}
        </h2>

        {step === 0 && (
          <div className="grid grid-cols-6 gap-3">
            {COLOR_SWATCHES.map(color => (
              <button
                key={color}
                onClick={() => setColors(toggleArrayItem(colors, color))}
                className={`w-full aspect-square rounded-xl border-2 transition-all ${colors.includes(color) ? 'border-brand scale-110 shadow-md' : 'border-brand-border hover:border-brand-border'}`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        )}

        {step === 1 && (
          <div className="grid grid-cols-2 gap-3">
            {THEMES.map(theme => (
              <button
                key={theme}
                onClick={() => setThemes(toggleArrayItem(themes, theme))}
                className={`p-4 rounded-xl border-2 text-sm font-medium transition-all ${themes.includes(theme) ? 'border-brand bg-cream text-brand' : 'border-brand-border text-text-2 hover:border-brand-border'}`}
              >
                {theme}
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="grid grid-cols-2 gap-3">
            {VIBES.map(vibe => (
              <button
                key={vibe}
                onClick={() => setVibes(toggleArrayItem(vibes, vibe))}
                className={`p-4 rounded-xl border-2 text-sm font-medium transition-all ${vibes.includes(vibe) ? 'border-brand bg-cream text-brand' : 'border-brand-border text-text-2 hover:border-brand-border'}`}
              >
                {vibe}
              </button>
            ))}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-text-1">${budget.toLocaleString()}</p>
              <p className="text-sm text-text-3 mt-1">Estimated budget</p>
            </div>
            <input
              type="range"
              min="5000"
              max="500000"
              step="5000"
              value={budget}
              onChange={e => setBudget(Number(e.target.value))}
              className="w-full accent-brand"
            />
            <div className="flex justify-between text-xs text-text-4">
              <span>$5,000</span>
              <span>$500,000</span>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="grid grid-cols-2 gap-3">
            {FORMALITY.map(f => (
              <button
                key={f}
                onClick={() => setFormality(f)}
                className={`p-4 rounded-xl border-2 text-sm font-medium transition-all ${formality === f ? 'border-brand bg-cream text-brand' : 'border-brand-border text-text-2 hover:border-brand-border'}`}
              >
                {f}
              </button>
            ))}
          </div>
        )}

        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={() => setStep(s => s - 1)}
            disabled={step === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(s => s + 1)} className="bg-brand hover:bg-brand-hover">
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={saving || !formality} className="bg-brand hover:bg-brand-hover">
              {saving ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Saving...</> : 'Complete Quiz'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
