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
    data: { eventType, ...Object.fromEntries(Object.entries(context).map(([k, v]) => [k, String(v)])) },
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
          if ((ticket as any).details?.error === 'DeviceNotRegistered') {
            console.warn('[push] Device not registered — token should be invalidated')
          }
        }
      }
    } catch (err: any) {
      console.error('[push] Failed to send push chunk:', err.message)
    }
  }
}
