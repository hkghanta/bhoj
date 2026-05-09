import { VendorStationsManager } from '@/components/vendor/VendorStationsManager'

export default function StationsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-text-1">Live Stations</h1>
        <p className="text-text-4 mt-1">
          Manage the live cooking stations you offer for events.
        </p>
      </div>
      <VendorStationsManager />
    </div>
  )
}
