import { AvailabilityCalendar } from '@/components/vendor/AvailabilityCalendar'

export default function AvailabilityPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-text-1">Availability Calendar</h1>
        <p className="text-text-4 mt-1">
          Click any future date to toggle availability. Green = available, Red = blocked.
          Changes are saved in batches when you click Save.
        </p>
      </div>
      <AvailabilityCalendar />
    </div>
  )
}
