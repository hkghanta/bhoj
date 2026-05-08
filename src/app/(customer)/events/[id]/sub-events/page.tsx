import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { SubEventsManager } from './SubEventsManager'

export default async function SubEventsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) redirect('/login')

  const { id } = await params
  const customerId = session.user!.id as string

  const event = await prisma.event.findFirst({
    where: { id, customer_id: customerId },
    select: {
      id: true,
      event_name: true,
      event_date: true,
      city: true,
      venue: true,
      sub_events: {
        orderBy: [{ sort_order: 'asc' }, { event_date: 'asc' }],
      },
    },
  })

  if (!event) notFound()

  return (
    <SubEventsManager
      eventId={id}
      eventName={event.event_name}
      eventCity={event.city}
      eventVenue={event.venue}
      initialSubEvents={event.sub_events.map(se => ({
        ...se,
        event_date: se.event_date?.toISOString() ?? null,
        created_at: se.created_at.toISOString(),
        updated_at: se.updated_at.toISOString(),
      }))}
    />
  )
}
