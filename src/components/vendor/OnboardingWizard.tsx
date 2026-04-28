'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Step1BusinessInfo } from './steps/Step1BusinessInfo'
import { Step2Services } from './steps/Step2Services'
import { Step3ComplianceDocs } from './steps/Step3ComplianceDocs'

const STEPS = [
  { label: 'Business Info' },
  { label: 'Services' },
  { label: 'Compliance' },
  { label: 'Dish Library' },
  { label: 'Menu Packages' },
  { label: 'Availability' },
  { label: 'Photos' },
]

export function OnboardingWizard() {
  const [step, setStep] = useState(0)
  const router = useRouter()

  function next() {
    if (step < STEPS.length - 1) setStep(s => s + 1)
    else router.push('/vendor/dashboard')
  }

  function back() {
    if (step > 0) setStep(s => s - 1)
  }

  const pct = Math.round(((step + 1) / STEPS.length) * 100)

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500">Step {step + 1} of {STEPS.length}</span>
          <span className="text-sm font-medium text-orange-600">{STEPS[step].label}</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full">
          <div
            className="h-2 bg-orange-500 rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between mt-2">
          {STEPS.map((s, i) => (
            <span
              key={i}
              className={`text-xs ${i === step ? 'text-orange-600 font-medium' : i < step ? 'text-green-600' : 'text-gray-300'}`}
            >
              {s.label}
            </span>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="bg-white rounded-xl border p-8">
        {step === 0 && <Step1BusinessInfo onNext={next} />}
        {step === 1 && <Step2Services onNext={next} onBack={back} />}
        {step === 2 && <Step3ComplianceDocs onNext={next} onBack={back} />}
        {step >= 3 && (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">
              Continue to <strong>{STEPS[step].label}</strong> from your dashboard.
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={back} className="text-sm text-gray-500 hover:text-gray-700">← Back</button>
              <button
                onClick={next}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700"
              >
                {step === STEPS.length - 1 ? 'Go to Dashboard' : 'Continue →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
