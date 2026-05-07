import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { PublicEventWebsite } from '@/components/public/PublicEventWebsite'

type Params = Promise<{ slug: string }>
type SearchParams = Promise<{ token?: string }>

async function getWebsite(slug: string) {
  const website = await prisma.eventWebsite.findUnique({
    where: { slug },
    include: {
      event: {
        select: {
          id: true,
          event_name: true,
          event_date: true,
          city: true,
          venue: true,
        },
      },
    },
  })

  if (!website || !website.is_published) return null
  return website
}

async function getHouseholdByToken(token: string, eventId: string) {
  const household = await prisma.guestHousehold.findFirst({
    where: { token, event_id: eventId },
    select: {
      id: true,
      label: true,
      token: true,
      declined: true,
    },
  })
  return household
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const website = await getWebsite(slug)
  if (!website) return { title: 'Event Not Found' }
  return {
    title: `${website.event.event_name} — OneSeva`,
    description: website.our_story?.slice(0, 160) ?? `You're invited to ${website.event.event_name}`,
    openGraph: {
      title: website.event.event_name,
      description: website.our_story?.slice(0, 160) ?? `You're invited to ${website.event.event_name}`,
      images: website.hero_photo ? [website.hero_photo] : [],
    },
  }
}

export default async function EventWebsitePage({
  params,
  searchParams,
}: {
  params: Params
  searchParams: SearchParams
}) {
  const { slug } = await params
  const { token } = await searchParams
  const website = await getWebsite(slug)
  if (!website) notFound()

  const colors = (website.colors as { primary?: string; secondary?: string; accent?: string }) ?? {}
  const faq = (website.faq as { question: string; answer: string }[]) ?? []

  // If token provided, fetch guest household for personalized RSVP
  const household = token ? await getHouseholdByToken(token, website.event.id) : null

  return (
    <PublicEventWebsite
      eventName={website.event.event_name}
      eventDate={website.event.event_date.toISOString()}
      city={website.event.city ?? ''}
      venue={website.event.venue ?? ''}
      heroPhoto={website.hero_photo}
      ourStory={website.our_story}
      travelInfo={website.travel_info}
      accommodation={website.accommodation}
      faq={faq}
      colors={colors}
      template={website.template}
      subEvents={[]}
      rsvp={household ? {
        householdLabel: household.label,
        token: household.token,
        declined: household.declined,
        invites: [],
      } : undefined}
    />
  )
}
