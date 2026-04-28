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
  const to = phoneNumber.startsWith('whatsapp:') ? phoneNumber : `whatsapp:${phoneNumber}`

  await client.messages.create({ from, to, body })
}
