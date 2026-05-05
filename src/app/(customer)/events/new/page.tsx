import { EventWizard } from '@/components/customer/EventWizard'

export default function NewEventPage() {
  return (
    <div className="px-6 py-8 max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-black text-text-1">Plan your event</h1>
        <p className="text-text-3 mt-2">Takes 2 minutes. We'll set up your planning dashboard automatically.</p>
      </div>
      <EventWizard />
    </div>
  )
}
