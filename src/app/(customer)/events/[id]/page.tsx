import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { BudgetBar } from '@/components/customer/BudgetBar'
import { EventChecklistTable } from '@/components/customer/EventChecklistTable'
import { AddChecklistItemDialog } from '@/components/customer/AddChecklistItemDialog'
import { CalendarDays, MapPin, Users } from 'lucide-react'
import Link from 'next/link'

export default async function EventDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) redirect('/login')

  const { id } = await params

  const event = await prisma.event.findFirst({
    where: { id, customer_id: (session.user!.id as string) },
    include: {
      checklist_items: { orderBy: [{ category: 'asc' }, { created_at: 'asc' }] },
    },
  })

  if (!event) notFound()

  const doneStatuses = ['FINALIZED', 'NOT_NEEDED']
  const doneCount = event.checklist_items.filter(i => doneStatuses.includes(i.status)).length
  const progressPct = event.checklist_items.length > 0
    ? Math.round((doneCount / event.checklist_items.length) * 100)
    : 0

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
            <Link href="/dashboard" className="hover:text-orange-600">My Events</Link>
            <span>/</span>
            <span>{event.event_name}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{event.event_name}</h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <CalendarDays className="h-4 w-4" />
              {format(event.event_date, 'EEEE, d MMMM yyyy')}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {event.city}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {event.guest_count} guests
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline">{event.status}</Badge>
          <Badge className="bg-orange-50 text-orange-700 border-orange-200">
            {progressPct}% complete
          </Badge>
        </div>
      </div>

      {/* Budget bar */}
      <div className="mb-6">
        <BudgetBar
          totalBudget={Number(event.total_budget)}
          totalSpent={Number(event.total_spent)}
          currency={event.currency}
        />
      </div>

      {/* Checklist */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Planning Checklist
            <span className="ml-2 text-sm font-normal text-gray-400">
              {doneCount} / {event.checklist_items.length} done
            </span>
          </h2>
          <AddChecklistItemDialog eventId={id} />
        </div>
        <EventChecklistTable
          eventId={id}
          items={event.checklist_items as any}
          currency={event.currency}
        />
      </div>
    </div>
  )
}
