import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ChevronLeft, ChefHat } from 'lucide-react'
import StationBrowser from '@/components/customer/StationBrowser'

export default async function StationsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) redirect('/login')

  const { id } = await params
  const customerId = session.user!.id as string

  const event = await prisma.event.findFirst({
    where: { id, customer_id: customerId },
    select: { id: true, event_name: true, city: true },
  })

  if (!event) notFound()

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/events/${id}`} className="text-text-4 hover:text-text-3">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-2">
          <ChefHat className="h-5 w-5 text-brand" />
          <h1 className="text-2xl font-black text-text-1">Live Stations</h1>
        </div>
        <span className="text-sm text-text-3">{event.event_name}</span>
      </div>

      <StationBrowser eventId={id} city={event.city} />
    </div>
  )
}
