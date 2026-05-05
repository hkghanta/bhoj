import { CalendarSyncManager } from '@/components/vendor/CalendarSyncManager'

export default function CalendarSyncPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-text-1">Calendar Sync</h1>
        <p className="text-text-4 mt-1">
          Connect and manage your external calendar integrations.
        </p>
      </div>
      <CalendarSyncManager />
    </div>
  )
}
