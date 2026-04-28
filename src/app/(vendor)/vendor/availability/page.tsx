import { AvailabilityCalendar } from '@/components/vendor/AvailabilityCalendar'

export default function AvailabilityPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Availability Calendar</h1>
        <p className="text-gray-500 mt-1">
          Click any future date to toggle availability. Green = available, Red = blocked.
          Changes are saved in batches when you click Save.
        </p>
      </div>
      <AvailabilityCalendar />
    </div>
  )
}
