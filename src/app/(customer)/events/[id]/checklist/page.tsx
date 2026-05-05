import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { AddChecklistItemDialog } from '@/components/customer/AddChecklistItemDialog'
import { EventChecklistTable } from '@/components/customer/EventChecklistTable'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'

export default async function ChecklistPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) redirect('/login')

  const { id } = await params
  const customerId = session.user!.id as string

  const event = await prisma.event.findFirst({
    where: { id, customer_id: customerId },
    select: {
      id: true,
      event_name: true,
      currency: true,
      checklist_items: { orderBy: [{ category: 'asc' }, { created_at: 'asc' }] },
    },
  })

  if (!event) notFound()

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-text-4">
        <Link href="/dashboard" className="hover:text-brand transition-colors">My Events</Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        <Link href={`/events/${id}`} className="hover:text-brand transition-colors">{event.event_name}</Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="text-text-2 font-medium" aria-current="page">Checklist</span>
      </nav>

      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-black tracking-tight text-text-1">Planning Checklist</h1>
        <AddChecklistItemDialog eventId={id} />
      </div>

      <EventChecklistTable
        eventId={id}
        items={event.checklist_items as any}
        currency={event.currency}
      />
    </div>
  )
}
