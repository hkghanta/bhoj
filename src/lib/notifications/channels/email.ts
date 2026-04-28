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
        vendorName: String(context.vendorName ?? ''),
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
        customerName: String(context.customerName ?? ''),
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
        recipientName: String(context.recipientName ?? 'there'),
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
        vendorName: String(context.vendorName ?? ''),
        reviewerName: String(context.reviewerName),
        rating: Number(context.rating),
        eventType: String(context.eventType ?? 'event'),
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
