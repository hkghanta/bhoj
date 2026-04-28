# Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a multi-channel notification system — Resend email, Expo push (mobile), and optional WhatsApp via Twilio — all dispatched through a BullMQ queue, respecting per-user notification preferences before sending.

**Architecture:** All notifications flow through a single `notificationQueue` (BullMQ). When an event occurs (new lead, quote received, new message, review posted), the originating API route enqueues a `NotificationJob` payload with event type, recipient, and context. The notification worker looks up the recipient's `NotificationPref` rows, then dispatches to each enabled channel. Email uses Resend with React Email templates rendered server-side. Push uses the Expo Push API via `expo-server-sdk`. WhatsApp uses Twilio's API and is guarded by a `WHATSAPP_ENABLED` feature flag.

**Tech Stack:** BullMQ, Resend, expo-server-sdk, Twilio, Next.js 15

---

## File Structure

```
src/
├── lib/
│   ├── notifications/
│   │   ├── types.ts                    # NotificationJob type + event type constants
│   │   ├── dispatcher.ts               # Reads prefs, fans out to channels
│   │   ├── channels/
│   │   │   ├── email.ts                # Resend email sender
│   │   │   ├── push.ts                 # Expo push sender
│   │   │   └── whatsapp.ts             # Twilio WhatsApp sender (feature-flagged)
│   │   └── templates/
│   │       ├── new-lead.tsx            # Email template: new lead for vendor
│   │       ├── quote-received.tsx      # Email template: quote received for customer
│   │       ├── new-message.tsx         # Email template: new message
│   │       └── review-posted.tsx       # Email template: new review posted
│   └── jobs/
│       └── notifications.ts            # BullMQ worker for notification jobs
├── app/
│   └── api/
│       └── notifications/
│           └── preferences/route.ts    # GET/PUT notification preferences
└── components/
    └── notifications/
        └── NotificationPrefsForm.tsx
```

---

### Task 1: Notification types and queue

**Files:**
- Create: `src/lib/notifications/types.ts`

- [ ] **Step 1: Install dependencies**

```bash
cd /home/hareesh/projects/bhoj
pnpm add resend expo-server-sdk twilio
pnpm add -D @types/twilio
```

- [ ] **Step 2: Write notification types**

```typescript
// src/lib/notifications/types.ts

export const NOTIFICATION_EVENTS = {
  // Vendor events
  NEW_LEAD: 'new_lead',                      // Vendor receives a new matched lead
  QUOTE_VIEWED: 'quote_viewed',              // Vendor's quote was viewed by customer
  QUOTE_ACCEPTED: 'quote_accepted',          // Vendor's quote was accepted
  REVIEW_POSTED: 'review_posted',            // Vendor received a new review

  // Customer events
  QUOTE_RECEIVED: 'quote_received',          // Customer received a new quote
  MATCH_READY: 'match_ready',                // Matching completed for customer's request
  NEW_MESSAGE: 'new_message',                // New message in a conversation

  // Shared
  REVIEW_REPLIED: 'review_replied',          // Vendor replied to customer's review
} as const

export type NotificationEventType = typeof NOTIFICATION_EVENTS[keyof typeof NOTIFICATION_EVENTS]

export interface NotificationJob {
  eventType: NotificationEventType
  recipientId: string
  recipientType: 'customer' | 'vendor'
  context: Record<string, string | number | boolean>
  // context examples:
  //   new_lead: { vendorId, eventName, guestCount, eventDate, city, matchScore }
  //   quote_received: { customerId, vendorName, eventName, totalEstimate, currency, quoteId }
  //   new_message: { conversationId, senderName, bodyPreview, eventName }
  //   review_posted: { vendorId, reviewerName, rating, eventType }
}

export interface PushToken {
  token: string
  platform: 'ios' | 'android'
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/notifications/types.ts
git commit -m "feat: add notification event types and job interface"
git push
```

---

### Task 2: Email channel with Resend + React Email templates

**Files:**
- Create: `src/lib/notifications/channels/email.ts`, `src/lib/notifications/templates/new-lead.tsx`, `src/lib/notifications/templates/quote-received.tsx`, `src/lib/notifications/templates/new-message.tsx`, `src/lib/notifications/templates/review-posted.tsx`

- [ ] **Step 1: Install React Email**

```bash
cd /home/hareesh/projects/bhoj
pnpm add @react-email/components @react-email/render
```

- [ ] **Step 2: Write new-lead email template**

```typescript
// src/lib/notifications/templates/new-lead.tsx
import {
  Html, Head, Body, Container, Heading, Text, Button,
  Section, Hr, Preview
} from '@react-email/components'

type Props = {
  vendorName: string
  eventName: string
  guestCount: number
  eventDate: string
  city: string
  matchScore: number
  leadsUrl: string
}

export function NewLeadEmail({ vendorName, eventName, guestCount, eventDate, city, matchScore, leadsUrl }: Props) {
  return (
    <Html>
      <Head />
      <Preview>New lead: {eventName} in {city} — {guestCount} guests</Preview>
      <Body style={{ backgroundColor: '#f9fafb', fontFamily: 'Arial, sans-serif' }}>
        <Container style={{ maxWidth: '560px', margin: '0 auto', padding: '40px 20px' }}>
          <Section style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '32px', border: '1px solid #e5e7eb' }}>
            <Heading style={{ color: '#ea580c', fontSize: '24px', marginBottom: '8px' }}>
              Bhoj
            </Heading>
            <Text style={{ color: '#374151', fontSize: '16px', fontWeight: 'bold', marginBottom: '4px' }}>
              You have a new lead!
            </Text>
            <Text style={{ color: '#6b7280', fontSize: '14px', marginTop: 0 }}>
              Hi {vendorName}, a customer is looking for a vendor like you.
            </Text>

            <Section style={{ backgroundColor: '#fff7ed', borderRadius: '8px', padding: '20px', margin: '20px 0', border: '1px solid #fed7aa' }}>
              <Text style={{ margin: 0, fontWeight: 'bold', color: '#111827', fontSize: '16px' }}>{eventName}</Text>
              <Text style={{ margin: '8px 0 0', color: '#6b7280', fontSize: '14px' }}>
                📍 {city} &nbsp;·&nbsp; 👥 {guestCount} guests &nbsp;·&nbsp; 📅 {eventDate}
              </Text>
              <Text style={{ margin: '8px 0 0', color: '#ea580c', fontSize: '13px', fontWeight: 'bold' }}>
                Match score: {matchScore}/100
              </Text>
            </Section>

            <Text style={{ color: '#374151', fontSize: '14px' }}>
              Log in to view the full lead details and submit your quote. Leads expire in 48 hours.
            </Text>

            <Button
              href={leadsUrl}
              style={{
                backgroundColor: '#ea580c',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                fontWeight: 'bold',
                fontSize: '14px',
                display: 'block',
                textAlign: 'center',
                textDecoration: 'none',
              }}
            >
              View Lead & Submit Quote
            </Button>
          </Section>

          <Hr style={{ borderColor: '#e5e7eb', margin: '24px 0' }} />
          <Text style={{ color: '#9ca3af', fontSize: '12px', textAlign: 'center' }}>
            Bhoj · Indian Event Services · <a href="{unsubscribeUrl}" style={{ color: '#9ca3af' }}>Unsubscribe</a>
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default NewLeadEmail
```

- [ ] **Step 3: Write quote-received email template**

```typescript
// src/lib/notifications/templates/quote-received.tsx
import { Html, Head, Body, Container, Heading, Text, Button, Section, Preview } from '@react-email/components'

type Props = {
  customerName: string
  vendorName: string
  eventName: string
  totalEstimate: string
  quotesUrl: string
}

export function QuoteReceivedEmail({ customerName, vendorName, eventName, totalEstimate, quotesUrl }: Props) {
  return (
    <Html>
      <Head />
      <Preview>Quote received from {vendorName} for {eventName}</Preview>
      <Body style={{ backgroundColor: '#f9fafb', fontFamily: 'Arial, sans-serif' }}>
        <Container style={{ maxWidth: '560px', margin: '0 auto', padding: '40px 20px' }}>
          <Section style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '32px', border: '1px solid #e5e7eb' }}>
            <Heading style={{ color: '#ea580c', fontSize: '24px', marginBottom: '8px' }}>Bhoj</Heading>
            <Text style={{ color: '#374151', fontSize: '16px', fontWeight: 'bold' }}>
              You received a quote!
            </Text>
            <Text style={{ color: '#6b7280', fontSize: '14px' }}>
              Hi {customerName}, <strong>{vendorName}</strong> has submitted a quote for your event <strong>{eventName}</strong>.
            </Text>

            <Section style={{ backgroundColor: '#fff7ed', borderRadius: '8px', padding: '16px', margin: '20px 0' }}>
              <Text style={{ margin: 0, color: '#ea580c', fontSize: '20px', fontWeight: 'bold' }}>
                {totalEstimate} total estimate
              </Text>
              <Text style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '13px' }}>
                Including menu proposal and pricing breakdown
              </Text>
            </Section>

            <Button
              href={quotesUrl}
              style={{
                backgroundColor: '#ea580c',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                fontWeight: 'bold',
                fontSize: '14px',
                display: 'block',
                textAlign: 'center',
                textDecoration: 'none',
              }}
            >
              View & Compare Quotes
            </Button>
          </Section>

          <Text style={{ color: '#9ca3af', fontSize: '12px', textAlign: 'center', marginTop: '24px' }}>
            Bhoj · Indian Event Services
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
```

- [ ] **Step 4: Write new-message and review-posted templates**

```typescript
// src/lib/notifications/templates/new-message.tsx
import { Html, Head, Body, Container, Text, Button, Section, Preview } from '@react-email/components'

type Props = {
  recipientName: string
  senderName: string
  eventName: string
  bodyPreview: string
  conversationUrl: string
}

export function NewMessageEmail({ recipientName, senderName, eventName, bodyPreview, conversationUrl }: Props) {
  return (
    <Html>
      <Head />
      <Preview>New message from {senderName} about {eventName}</Preview>
      <Body style={{ backgroundColor: '#f9fafb', fontFamily: 'Arial, sans-serif' }}>
        <Container style={{ maxWidth: '560px', margin: '0 auto', padding: '40px 20px' }}>
          <Section style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '32px', border: '1px solid #e5e7eb' }}>
            <Text style={{ color: '#ea580c', fontSize: '20px', fontWeight: 'bold' }}>Bhoj</Text>
            <Text style={{ color: '#374151', fontSize: '15px' }}>
              Hi {recipientName}, you have a new message from <strong>{senderName}</strong> about <strong>{eventName}</strong>.
            </Text>
            <Section style={{ backgroundColor: '#f3f4f6', borderRadius: '8px', padding: '12px 16px', margin: '16px 0', borderLeft: '3px solid #ea580c' }}>
              <Text style={{ margin: 0, color: '#374151', fontSize: '14px', fontStyle: 'italic' }}>
                "{bodyPreview}"
              </Text>
            </Section>
            <Button href={conversationUrl} style={{ backgroundColor: '#ea580c', color: 'white', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', textDecoration: 'none' }}>
              Reply
            </Button>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
```

```typescript
// src/lib/notifications/templates/review-posted.tsx
import { Html, Head, Body, Container, Text, Button, Section, Preview } from '@react-email/components'

type Props = {
  vendorName: string
  reviewerName: string
  rating: number
  eventType: string
  reviewsUrl: string
}

export function ReviewPostedEmail({ vendorName, reviewerName, rating, eventType, reviewsUrl }: Props) {
  const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating)
  return (
    <Html>
      <Head />
      <Preview>{reviewerName} left you a {rating}-star review</Preview>
      <Body style={{ backgroundColor: '#f9fafb', fontFamily: 'Arial, sans-serif' }}>
        <Container style={{ maxWidth: '560px', margin: '0 auto', padding: '40px 20px' }}>
          <Section style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '32px', border: '1px solid #e5e7eb' }}>
            <Text style={{ color: '#ea580c', fontSize: '20px', fontWeight: 'bold' }}>Bhoj</Text>
            <Text style={{ color: '#374151', fontSize: '15px' }}>
              Hi {vendorName}, <strong>{reviewerName}</strong> left you a review for a {eventType} event.
            </Text>
            <Text style={{ color: '#f59e0b', fontSize: '28px', margin: '8px 0' }}>{stars}</Text>
            <Text style={{ color: '#6b7280', fontSize: '13px' }}>{rating}/5 stars</Text>
            <Button href={reviewsUrl} style={{ backgroundColor: '#ea580c', color: 'white', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', textDecoration: 'none', marginTop: '16px' }}>
              View Review & Reply
            </Button>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
```

- [ ] **Step 5: Write email channel**

```typescript
// src/lib/notifications/channels/email.ts
import { Resend } from 'resend'
import { render } from '@react-email/render'
import { NewLeadEmail } from '../templates/new-lead'
import { QuoteReceivedEmail } from '../templates/quote-received'
import { NewMessageEmail } from '../templates/new-message'
import { ReviewPostedEmail } from '../templates/review-posted'
import type { NotificationJob } from '../types'
import { NOTIFICATION_EVENTS } from '../types'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM_EMAIL ?? 'hello@bhoj.app'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://bhoj.app'

export async function sendEmail(job: NotificationJob, recipientEmail: string): Promise<void> {
  const { eventType, context } = job

  let html: string
  let subject: string

  switch (eventType) {
    case NOTIFICATION_EVENTS.NEW_LEAD: {
      subject = `New lead: ${context.eventName} in ${context.city}`
      html = await render(NewLeadEmail({
        vendorName: String(context.vendorName),
        eventName: String(context.eventName),
        guestCount: Number(context.guestCount),
        eventDate: String(context.eventDate),
        city: String(context.city),
        matchScore: Number(context.matchScore),
        leadsUrl: `${APP_URL}/vendor/leads`,
      }))
      break
    }

    case NOTIFICATION_EVENTS.QUOTE_RECEIVED: {
      subject = `Quote received from ${context.vendorName} for ${context.eventName}`
      html = await render(QuoteReceivedEmail({
        customerName: String(context.customerName),
        vendorName: String(context.vendorName),
        eventName: String(context.eventName),
        totalEstimate: `${context.currency} ${Number(context.totalEstimate).toLocaleString()}`,
        quotesUrl: `${APP_URL}/events/${context.eventId}/quotes`,
      }))
      break
    }

    case NOTIFICATION_EVENTS.NEW_MESSAGE: {
      subject = `New message from ${context.senderName}`
      html = await render(NewMessageEmail({
        recipientName: String(context.recipientName),
        senderName: String(context.senderName),
        eventName: String(context.eventName),
        bodyPreview: String(context.bodyPreview).slice(0, 100),
        conversationUrl: `${APP_URL}/${job.recipientType === 'vendor' ? 'vendor/' : ''}messages/${context.conversationId}`,
      }))
      break
    }

    case NOTIFICATION_EVENTS.REVIEW_POSTED: {
      subject = `${context.reviewerName} left you a ${context.rating}-star review`
      html = await render(ReviewPostedEmail({
        vendorName: String(context.vendorName),
        reviewerName: String(context.reviewerName),
        rating: Number(context.rating),
        eventType: String(context.eventType),
        reviewsUrl: `${APP_URL}/vendor/reviews`,
      }))
      break
    }

    default:
      console.warn(`[email] No template for event type: ${eventType}`)
      return
  }

  const { error } = await resend.emails.send({
    from: FROM,
    to: recipientEmail,
    subject,
    html,
  })

  if (error) {
    throw new Error(`Resend error: ${JSON.stringify(error)}`)
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/notifications/templates/ src/lib/notifications/channels/email.ts
git commit -m "feat: add Resend email channel with HTML templates for all notification events"
git push
```

---

### Task 3: Expo push channel

**Files:**
- Create: `src/lib/notifications/channels/push.ts`

- [ ] **Step 1: Write push notification sender**

```typescript
// src/lib/notifications/channels/push.ts
import Expo, { ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk'
import type { NotificationJob } from '../types'
import { NOTIFICATION_EVENTS } from '../types'

const expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN })

function buildPushMessage(job: NotificationJob, pushToken: string): ExpoPushMessage {
  const { eventType, context } = job

  const messages: Record<string, { title: string; body: string }> = {
    [NOTIFICATION_EVENTS.NEW_LEAD]: {
      title: 'New Lead!',
      body: `${context.eventName} in ${context.city} — ${context.guestCount} guests`,
    },
    [NOTIFICATION_EVENTS.QUOTE_RECEIVED]: {
      title: 'Quote received!',
      body: `${context.vendorName} sent a quote for ${context.eventName}`,
    },
    [NOTIFICATION_EVENTS.NEW_MESSAGE]: {
      title: `Message from ${context.senderName}`,
      body: String(context.bodyPreview).slice(0, 80),
    },
    [NOTIFICATION_EVENTS.REVIEW_POSTED]: {
      title: 'New review!',
      body: `${context.reviewerName} left a ${context.rating}-star review`,
    },
    [NOTIFICATION_EVENTS.QUOTE_ACCEPTED]: {
      title: 'Quote accepted!',
      body: `Your quote for ${context.eventName} was accepted`,
    },
    [NOTIFICATION_EVENTS.MATCH_READY]: {
      title: 'Your matches are ready!',
      body: `We found vendors for ${context.eventName}`,
    },
  }

  const msg = messages[eventType] ?? { title: 'Bhoj', body: 'You have a new notification' }

  return {
    to: pushToken,
    sound: 'default',
    title: msg.title,
    body: msg.body,
    data: { eventType, ...context },
    badge: 1,
  }
}

export async function sendPush(job: NotificationJob, pushTokens: string[]): Promise<void> {
  const validTokens = pushTokens.filter(token => Expo.isExpoPushToken(token))
  if (validTokens.length === 0) return

  const messages = validTokens.map(token => buildPushMessage(job, token))
  const chunks = expo.chunkPushNotifications(messages)

  for (const chunk of chunks) {
    try {
      const tickets: ExpoPushTicket[] = await expo.sendPushNotificationsAsync(chunk)
      for (const ticket of tickets) {
        if (ticket.status === 'error') {
          console.error('[push] Expo push error:', ticket.message)
          // If invalid token, should be removed from DB — log for now
          if (ticket.details?.error === 'DeviceNotRegistered') {
            console.warn('[push] Device not registered — token should be invalidated')
          }
        }
      }
    } catch (err: any) {
      console.error('[push] Failed to send push chunk:', err.message)
    }
  }
}
```

- [ ] **Step 2: Add Expo push token storage to notification prefs table**

The `VendorNotificationPref` and `CustomerNotificationPref` models store channel + event_type. For push, we need to store the token. For MVP, store it as a separate Redis key per user.

```typescript
// src/lib/notifications/channels/push-token-store.ts
import { redis } from '@/lib/redis'

export async function storePushToken(userId: string, userType: 'customer' | 'vendor', token: string): Promise<void> {
  const key = `push_tokens:${userType}:${userId}`
  // Store as a set, max 5 tokens per user (multiple devices)
  await redis.sadd(key, token)
  await redis.scard(key).then(async count => {
    if (count > 5) {
      // Trim to 5 most recent (sets are unordered — use sorted set for order if needed)
      const tokens = await redis.smembers(key)
      if (tokens.length > 5) {
        await redis.srem(key, tokens[0])
      }
    }
  })
  await redis.expire(key, 90 * 86400)  // 90 day TTL
}

export async function getPushTokens(userId: string, userType: 'customer' | 'vendor'): Promise<string[]> {
  const key = `push_tokens:${userType}:${userId}`
  return redis.smembers(key)
}

export async function removePushToken(userId: string, userType: 'customer' | 'vendor', token: string): Promise<void> {
  const key = `push_tokens:${userType}:${userId}`
  await redis.srem(key, token)
}
```

- [ ] **Step 3: Add push token registration endpoint**

```typescript
// src/app/api/notifications/push-token/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { storePushToken } from '@/lib/notifications/channels/push-token-store'
import { z } from 'zod'

const schema = z.object({
  token: z.string().min(10),
  platform: z.enum(['ios', 'android']),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (session.user as any).role
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  await storePushToken(session.user.id, role, parsed.data.token)
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/notifications/channels/push.ts src/lib/notifications/channels/push-token-store.ts src/app/api/notifications/push-token/
git commit -m "feat: add Expo push notification channel with token storage in Redis"
git push
```

---

### Task 4: WhatsApp channel (feature-flagged)

**Files:**
- Create: `src/lib/notifications/channels/whatsapp.ts`

- [ ] **Step 1: Write WhatsApp sender**

```typescript
// src/lib/notifications/channels/whatsapp.ts
import twilio from 'twilio'
import type { NotificationJob } from '../types'
import { NOTIFICATION_EVENTS } from '../types'

const WHATSAPP_ENABLED = process.env.WHATSAPP_ENABLED === 'true'

function getWhatsAppMessage(job: NotificationJob): string {
  const { eventType, context } = job

  switch (eventType) {
    case NOTIFICATION_EVENTS.NEW_LEAD:
      return `🎉 *New Lead on Bhoj!*\n\n` +
        `*Event:* ${context.eventName}\n` +
        `*Location:* ${context.city}\n` +
        `*Guests:* ${context.guestCount}\n` +
        `*Date:* ${context.eventDate}\n` +
        `*Match score:* ${context.matchScore}/100\n\n` +
        `Log in to view and submit your quote: ${process.env.NEXT_PUBLIC_APP_URL}/vendor/leads`

    case NOTIFICATION_EVENTS.QUOTE_RECEIVED:
      return `✅ *Quote Received on Bhoj!*\n\n` +
        `*From:* ${context.vendorName}\n` +
        `*Event:* ${context.eventName}\n` +
        `*Total estimate:* ${context.currency} ${Number(context.totalEstimate).toLocaleString()}\n\n` +
        `View your quotes: ${process.env.NEXT_PUBLIC_APP_URL}/events/${context.eventId}/quotes`

    case NOTIFICATION_EVENTS.NEW_MESSAGE:
      return `💬 *New message from ${context.senderName}*\n\n` +
        `"${String(context.bodyPreview).slice(0, 100)}"\n\n` +
        `Reply: ${process.env.NEXT_PUBLIC_APP_URL}/messages/${context.conversationId}`

    default:
      return `You have a new notification on Bhoj: ${process.env.NEXT_PUBLIC_APP_URL}`
  }
}

export async function sendWhatsApp(job: NotificationJob, phoneNumber: string): Promise<void> {
  if (!WHATSAPP_ENABLED) {
    console.log('[whatsapp] Feature flag disabled — skipping WhatsApp notification')
    return
  }

  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    console.warn('[whatsapp] Twilio credentials not configured')
    return
  }

  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  const body = getWhatsAppMessage(job)
  const from = process.env.TWILIO_WHATSAPP_FROM ?? 'whatsapp:+14155238886'

  // Ensure phone number has whatsapp: prefix
  const to = phoneNumber.startsWith('whatsapp:') ? phoneNumber : `whatsapp:${phoneNumber}`

  await client.messages.create({ from, to, body })
}
```

- [ ] **Step 2: Add WHATSAPP_ENABLED to .env.example**

```bash
cat >> /home/hareesh/projects/bhoj/.env.example << 'EOF'

# Feature Flags
WHATSAPP_ENABLED="false"

# Expo push notifications
EXPO_ACCESS_TOKEN=""
EOF
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/notifications/channels/whatsapp.ts .env.example
git commit -m "feat: add WhatsApp notification channel via Twilio, behind WHATSAPP_ENABLED flag"
git push
```

---

### Task 5: Dispatcher + BullMQ worker

**Files:**
- Create: `src/lib/notifications/dispatcher.ts`, `src/lib/jobs/notifications.ts`

- [ ] **Step 1: Write dispatcher**

```typescript
// src/lib/notifications/dispatcher.ts
import { prisma } from '@/lib/prisma'
import { sendEmail } from './channels/email'
import { sendPush } from './channels/push'
import { sendWhatsApp } from './channels/whatsapp'
import { getPushTokens } from './channels/push-token-store'
import type { NotificationJob } from './types'

/**
 * Dispatcher reads the recipient's notification preferences and
 * fans out to each enabled channel.
 */
export async function dispatch(job: NotificationJob): Promise<void> {
  const { recipientId, recipientType, eventType } = job

  // Load preferences
  const prefs = recipientType === 'customer'
    ? await prisma.customerNotificationPref.findMany({
        where: { customer_id: recipientId, event_type: eventType },
      })
    : await prisma.vendorNotificationPref.findMany({
        where: { vendor_id: recipientId, event_type: eventType },
      })

  // Build enabled channels set
  const enabledChannels = new Set<string>()

  if (prefs.length === 0) {
    // No explicit prefs = use defaults (email on, push on, whatsapp off)
    enabledChannels.add('EMAIL')
    enabledChannels.add('PUSH')
  } else {
    for (const pref of prefs) {
      if (pref.is_enabled) enabledChannels.add(pref.channel)
    }
  }

  // Load recipient contact info
  let email: string | null = null
  let phone: string | null = null

  if (recipientType === 'customer') {
    const customer = await prisma.customer.findUnique({
      where: { id: recipientId },
      select: { email: true, phone: true },
    })
    email = customer?.email ?? null
    phone = customer?.phone ?? null
  } else {
    const vendor = await prisma.vendor.findUnique({
      where: { id: recipientId },
      select: { email: true, phone_cell: true },
    })
    email = vendor?.email ?? null
    phone = vendor?.phone_cell ?? null
  }

  // Fan out to channels
  const tasks: Promise<void>[] = []

  if (enabledChannels.has('EMAIL') && email) {
    tasks.push(
      sendEmail(job, email).catch(err =>
        console.error(`[dispatch] Email failed for ${recipientId}:`, err.message)
      )
    )
  }

  if (enabledChannels.has('PUSH')) {
    const pushTokens = await getPushTokens(recipientId, recipientType)
    if (pushTokens.length > 0) {
      tasks.push(
        sendPush(job, pushTokens).catch(err =>
          console.error(`[dispatch] Push failed for ${recipientId}:`, err.message)
        )
      )
    }
  }

  if (enabledChannels.has('WHATSAPP') && phone) {
    tasks.push(
      sendWhatsApp(job, phone).catch(err =>
        console.error(`[dispatch] WhatsApp failed for ${recipientId}:`, err.message)
      )
    )
  }

  await Promise.all(tasks)
}
```

- [ ] **Step 2: Write BullMQ notifications worker**

```typescript
// src/lib/jobs/notifications.ts
import { Worker, Job } from 'bullmq'
import { redis } from '@/lib/redis'
import { dispatch } from '@/lib/notifications/dispatcher'
import type { NotificationJob } from '@/lib/notifications/types'

export function startNotificationWorker() {
  return new Worker<NotificationJob>(
    'notifications',
    async (job: Job<NotificationJob>) => {
      console.log(`[notify] Processing ${job.data.eventType} for ${job.data.recipientId}`)
      await dispatch(job.data)
    },
    {
      connection: redis,
      concurrency: 10,
    }
  )
}
```

- [ ] **Step 3: Add notification worker to worker startup**

```typescript
// Modify src/worker.ts — add notification worker:
import { startNotificationWorker } from '@/lib/jobs/notifications'

// In main():
const notifyWorker = startNotificationWorker()
console.log('[worker] Notification worker started')

// In SIGTERM handler:
await notifyWorker.close()
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/notifications/dispatcher.ts src/lib/jobs/notifications.ts src/worker.ts
git commit -m "feat: add notification dispatcher and BullMQ worker — fans out to email, push, WhatsApp"
git push
```

---

### Task 6: Enqueue notifications from API routes

Wire up notification enqueueing in the APIs that trigger events. We'll use a helper function to keep it clean.

**Files:**
- Create: `src/lib/notifications/enqueue.ts`

- [ ] **Step 1: Write enqueue helper**

```typescript
// src/lib/notifications/enqueue.ts
import { notificationQueue } from '@/lib/jobs/queues'
import type { NotificationJob, NotificationEventType } from './types'

export async function enqueueNotification(
  eventType: NotificationEventType,
  recipientId: string,
  recipientType: 'customer' | 'vendor',
  context: Record<string, string | number | boolean>
): Promise<void> {
  const job: NotificationJob = { eventType, recipientId, recipientType, context }
  await notificationQueue.add(eventType, job, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 10000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  })
}
```

- [ ] **Step 2: Enqueue NEW_LEAD from match job**

Modify `src/lib/jobs/match.ts` — after creating Match rows:

```typescript
// Add import at top of match.ts
import { enqueueNotification } from '@/lib/notifications/enqueue'
import { NOTIFICATION_EVENTS } from '@/lib/notifications/types'
import { format } from 'date-fns'

// After incrementLeadCount() calls, enqueue notifications:
await Promise.all(
  allowedMatches.map(s =>
    enqueueNotification(
      NOTIFICATION_EVENTS.NEW_LEAD,
      s.vendorId,
      'vendor',
      {
        vendorId: s.vendorId,
        eventName: request.event.event_name,
        guestCount: request.event.guest_count,
        eventDate: format(request.event.event_date, 'd MMM yyyy'),
        city: request.event.city,
        matchScore: s.score,
      }
    ).catch(err => console.error('[match] Failed to enqueue lead notification:', err.message))
  )
)
```

- [ ] **Step 3: Enqueue QUOTE_RECEIVED from quotes PUT route**

Modify `src/app/api/quotes/[id]/route.ts` — when status changes to SENT:

```typescript
// Add to top of PUT handler in quotes/[id]/route.ts:
import { enqueueNotification } from '@/lib/notifications/enqueue'
import { NOTIFICATION_EVENTS } from '@/lib/notifications/types'

// After quote update, when status becomes SENT:
if (parsed.data.status === 'SENT' && quote.status === 'DRAFT') {
  // Notify customer
  const fullQuote = await prisma.quote.findUnique({
    where: { id },
    include: {
      vendor: { select: { business_name: true } },
      match: {
        include: {
          event_request: {
            include: { event: { select: { event_name: true, customer_id: true } } },
          },
        },
      },
    },
  })

  if (fullQuote) {
    await enqueueNotification(
      NOTIFICATION_EVENTS.QUOTE_RECEIVED,
      fullQuote.match.event_request.event.customer_id,
      'customer',
      {
        vendorName: fullQuote.vendor.business_name,
        eventName: fullQuote.match.event_request.event.event_name,
        totalEstimate: Number(fullQuote.total_estimate),
        currency: fullQuote.currency,
        eventId: fullQuote.match.event_request.event_id,
      }
    ).catch(err => console.error('[quotes] Failed to enqueue quote notification:', err.message))
  }
}
```

- [ ] **Step 4: Enqueue NEW_MESSAGE from messages route**

Modify `src/app/api/conversations/[id]/messages/route.ts` — after message creation in POST:

```typescript
// Add to top:
import { enqueueNotification } from '@/lib/notifications/enqueue'
import { NOTIFICATION_EVENTS } from '@/lib/notifications/types'

// After message.create(), determine the other party and notify them:
const otherPartyId = role === 'customer' ? conversation.vendor_id : conversation.customer_id
const otherPartyType: 'customer' | 'vendor' = role === 'customer' ? 'vendor' : 'customer'
const senderName = session.user.name ?? (role === 'vendor' ? 'Vendor' : 'Customer')

// Load event name
const convoWithEvent = await prisma.conversation.findUnique({
  where: { id },
  include: { match: { include: { event_request: { include: { event: { select: { event_name: true } } } } } } },
})

await enqueueNotification(
  NOTIFICATION_EVENTS.NEW_MESSAGE,
  otherPartyId,
  otherPartyType,
  {
    conversationId: id,
    senderName,
    bodyPreview: message.body.slice(0, 100),
    eventName: convoWithEvent?.match.event_request.event.event_name ?? 'your event',
    recipientName: 'there',
  }
).catch(err => console.error('[messages] Failed to enqueue message notification:', err.message))
```

- [ ] **Step 5: Enqueue REVIEW_POSTED from reviews route**

Modify `src/app/api/reviews/route.ts` — after review.create():

```typescript
// Add to top:
import { enqueueNotification } from '@/lib/notifications/enqueue'
import { NOTIFICATION_EVENTS } from '@/lib/notifications/types'

// After review creation:
const customer = await prisma.customer.findUnique({ where: { id: session.user.id }, select: { name: true } })
await enqueueNotification(
  NOTIFICATION_EVENTS.REVIEW_POSTED,
  parsed.data.vendor_id,
  'vendor',
  {
    vendorId: parsed.data.vendor_id,
    reviewerName: customer?.name ?? 'A customer',
    rating: parsed.data.overall_rating,
    eventType: parsed.data.event_type ?? 'event',
  }
).catch(err => console.error('[reviews] Failed to enqueue review notification:', err.message))
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/notifications/enqueue.ts src/lib/jobs/match.ts src/app/api/quotes/\[id\]/route.ts src/app/api/conversations/ src/app/api/reviews/route.ts
git commit -m "feat: wire up notification enqueueing on new lead, quote sent, new message, and review posted"
git push
```

---

### Task 7: Notification preferences API + UI

**Files:**
- Create: `src/app/api/notifications/preferences/route.ts`, `src/components/notifications/NotificationPrefsForm.tsx`

- [ ] **Step 1: Write preferences API**

```typescript
// src/app/api/notifications/preferences/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { NotificationChannel } from '@prisma/client'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (session.user as any).role

  const prefs = role === 'customer'
    ? await prisma.customerNotificationPref.findMany({ where: { customer_id: session.user.id } })
    : await prisma.vendorNotificationPref.findMany({ where: { vendor_id: session.user.id } })

  return NextResponse.json(prefs)
}

const updateSchema = z.object({
  channel: z.nativeEnum(NotificationChannel),
  event_type: z.string(),
  is_enabled: z.boolean(),
})

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (session.user as any).role
  const body = await req.json()

  // Support single or batch update
  const items = Array.isArray(body) ? body : [body]

  for (const item of items) {
    const parsed = updateSchema.safeParse(item)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

    if (role === 'customer') {
      await prisma.customerNotificationPref.upsert({
        where: {
          customer_id_channel_event_type: {
            customer_id: session.user.id,
            channel: parsed.data.channel,
            event_type: parsed.data.event_type,
          },
        },
        update: { is_enabled: parsed.data.is_enabled },
        create: {
          customer_id: session.user.id,
          channel: parsed.data.channel,
          event_type: parsed.data.event_type,
          is_enabled: parsed.data.is_enabled,
        },
      })
    } else {
      await prisma.vendorNotificationPref.upsert({
        where: {
          vendor_id_channel_event_type: {
            vendor_id: session.user.id,
            channel: parsed.data.channel,
            event_type: parsed.data.event_type,
          },
        },
        update: { is_enabled: parsed.data.is_enabled },
        create: {
          vendor_id: session.user.id,
          channel: parsed.data.channel,
          event_type: parsed.data.event_type,
          is_enabled: parsed.data.is_enabled,
        },
      })
    }
  }

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Write NotificationPrefsForm component**

```typescript
// src/components/notifications/NotificationPrefsForm.tsx
'use client'
import { useState, useEffect } from 'react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

type Pref = {
  channel: 'EMAIL' | 'PUSH' | 'WHATSAPP'
  event_type: string
  is_enabled: boolean
}

const VENDOR_EVENTS = [
  { key: 'new_lead', label: 'New lead received' },
  { key: 'quote_viewed', label: 'Quote viewed by customer' },
  { key: 'quote_accepted', label: 'Quote accepted' },
  { key: 'review_posted', label: 'New review posted' },
  { key: 'new_message', label: 'New message' },
]

const CUSTOMER_EVENTS = [
  { key: 'quote_received', label: 'Quote received' },
  { key: 'match_ready', label: 'Matches ready' },
  { key: 'new_message', label: 'New message' },
  { key: 'review_replied', label: 'Vendor replied to your review' },
]

const CHANNELS = ['EMAIL', 'PUSH'] as const  // WHATSAPP shown only if enabled

type Props = { role: 'customer' | 'vendor' }

export function NotificationPrefsForm({ role }: Props) {
  const [prefs, setPrefs] = useState<Record<string, Record<string, boolean>>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const events = role === 'vendor' ? VENDOR_EVENTS : CUSTOMER_EVENTS

  useEffect(() => {
    fetch('/api/notifications/preferences')
      .then(r => r.json())
      .then((data: Pref[]) => {
        const map: Record<string, Record<string, boolean>> = {}
        data.forEach(p => {
          if (!map[p.event_type]) map[p.event_type] = {}
          map[p.event_type][p.channel] = p.is_enabled
        })
        setPrefs(map)
      })
  }, [])

  function getPref(event_type: string, channel: string): boolean {
    return prefs[event_type]?.[channel] ?? true  // Default: enabled
  }

  function togglePref(event_type: string, channel: string) {
    setPrefs(p => ({
      ...p,
      [event_type]: { ...p[event_type], [channel]: !getPref(event_type, channel) },
    }))
  }

  async function handleSave() {
    setSaving(true)
    const updates: Pref[] = []
    for (const event of events) {
      for (const channel of CHANNELS) {
        updates.push({ channel, event_type: event.key, is_enabled: getPref(event.key, channel) })
      }
    }
    await fetch('/api/notifications/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="bg-white rounded-xl border p-6">
      <h3 className="font-semibold text-gray-900 mb-5">Notification Preferences</h3>

      <div className="space-y-1 mb-4">
        <div className="grid grid-cols-[1fr_100px_100px] gap-4 text-xs font-medium text-gray-400 uppercase tracking-wide px-1">
          <span>Event</span>
          {CHANNELS.map(c => <span key={c} className="text-center">{c}</span>)}
        </div>
      </div>

      <div className="space-y-3">
        {events.map(event => (
          <div
            key={event.key}
            className="grid grid-cols-[1fr_100px_100px] gap-4 items-center px-1 py-2 rounded-lg hover:bg-gray-50"
          >
            <Label className="text-sm text-gray-700 font-normal">{event.label}</Label>
            {CHANNELS.map(channel => (
              <div key={channel} className="flex justify-center">
                <Switch
                  checked={getPref(event.key, channel)}
                  onCheckedChange={() => togglePref(event.key, channel)}
                />
              </div>
            ))}
          </div>
        ))}
      </div>

      <Button
        onClick={handleSave}
        disabled={saving}
        className="mt-5 bg-orange-600 hover:bg-orange-700"
      >
        {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Preferences'}
      </Button>
    </div>
  )
}
```

- [ ] **Step 3: Add preferences to vendor settings page**

```typescript
// src/app/(vendor)/vendor/settings/page.tsx
import { NotificationPrefsForm } from '@/components/notifications/NotificationPrefsForm'

export default function VendorSettingsPage() {
  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      <NotificationPrefsForm role="vendor" />
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/notifications/ src/components/notifications/ src/app/\(vendor\)/vendor/settings/
git commit -m "feat: add notification preferences API and settings UI with per-channel toggles"
git push
```

---
