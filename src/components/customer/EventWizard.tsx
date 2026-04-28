'use client'
import { useState } from 'react'
import { Step1EventType } from './steps/Step1EventType'
import { Step2EventDetails } from './steps/Step2EventDetails'
import { Step3Confirm } from './steps/Step3Confirm'

type EventDetails = {
  event_name: string; event_date: string; city: string; venue: string;
  guest_count: number; total_budget: number; currency: string
}

export function EventWizard() {
  const [step, setStep] = useState(0)
  const [eventType, setEventType] = useState('')
  const [details, setDetails] = useState<EventDetails | null>(null)

  return (
    <div className="bg-white rounded-xl border p-8 max-w-2xl mx-auto">
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
        <Step3Confirm
          eventType={eventType}
          details={details}
          onBack={() => setStep(1)}
        />
      )}
    </div>
  )
}
