import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PlanningBoard } from './PlanningBoard'

export default async function PlanningPage({ params }: { params: Promise<{ id: string }> }) {
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
      guest_count: true,
      currency: true,
    },
  })

  if (!event) notFound()

  return (
    <PlanningBoard
      eventId={id}
      eventName={event.event_name}
      eventDate={event.event_date.toISOString()}
      city={event.city}
      venueName={event.venue}
      guestCount={event.guest_count}
      currency={event.currency}
    />
  )
}
