import { EventManagerDashboard } from '@/components/vendor/EventManagerDashboard'

export default function EventManagerPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight tracking-tight text-text-1">Event Manager</h1>
        <p className="text-text-4 mt-1">
          View and manage events assigned to you.
        </p>
      </div>
      <EventManagerDashboard />
    </div>
  )
}
