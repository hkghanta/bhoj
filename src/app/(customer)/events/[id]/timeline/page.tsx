import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { EventTimeline } from '@/components/customer/EventTimeline'

export default async function TimelinePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) redirect('/login')

  const { id } = await params
  const customerId = session.user!.id as string

  const event = await prisma.event.findFirst({
    where: { id, customer_id: customerId },
  })

  if (!event) notFound()

  // Build date list: main event
  const eventDates = [
    { id: 'main', label: event.event_name, date: event.event_date.toISOString() },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-text-1">Event Timeline</h1>
        <p className="text-text-3 mt-1">
          Plan the full schedule across all your event days.
        </p>
      </div>
      <EventTimeline eventId={id} eventDates={eventDates} />
    </div>
  )
}
