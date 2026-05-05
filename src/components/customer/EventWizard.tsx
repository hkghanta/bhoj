'use client'
import { useState } from 'react'
import { Step1EventType } from './steps/Step1EventType'
import { Step2EventDetails } from './steps/Step2EventDetails'
import { Step5Confirm } from './steps/Step5Confirm'

type EventDetails = {
  event_name: string; event_date: string; city: string; state: string; venue: string;
  guest_count: number; total_budget: number; currency: string; country: string
}

export function EventWizard() {
  const [step, setStep] = useState(0)
  const [eventType, setEventType] = useState('')
  const [details, setDetails] = useState<EventDetails | null>(null)

  return (
    <div className="bg-white dark:bg-cream-2 rounded-xl border p-8 max-w-2xl mx-auto">
      {/* Progress bar — 3 segments */}
      {step > 0 && (
        <div className="flex items-center gap-1.5 mb-8">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full flex-1 transition-all ${
                i < step ? 'bg-brand' : i === step ? 'bg-brand/50' : 'bg-cream'
              }`}
            />
          ))}
        </div>
      )}

      {step === 0 && (
        <Step1EventType onNext={(type) => { setEventType(type); setStep(1) }} />
      )}

      {step === 1 && (
        <Step2EventDetails
          eventType={eventType}
          onNext={(d) => { setDetails(d); setStep(2) }}
          onBack={() => setStep(0)}
        />
      )}

      {step === 2 && details && (
        <Step5Confirm
          eventType={eventType}
          details={details}
          onBack={() => setStep(1)}
        />
      )}
    </div>
  )
}
