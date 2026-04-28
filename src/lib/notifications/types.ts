export const NOTIFICATION_EVENTS = {
  // Vendor events
  NEW_LEAD: 'new_lead',
  QUOTE_VIEWED: 'quote_viewed',
  QUOTE_ACCEPTED: 'quote_accepted',
  REVIEW_POSTED: 'review_posted',

  // Customer events
  QUOTE_RECEIVED: 'quote_received',
  MATCH_READY: 'match_ready',
  NEW_MESSAGE: 'new_message',

  // Shared
  REVIEW_REPLIED: 'review_replied',
} as const

export type NotificationEventType = typeof NOTIFICATION_EVENTS[keyof typeof NOTIFICATION_EVENTS]

export interface NotificationJob {
  eventType: NotificationEventType
  recipientId: string
  recipientType: 'customer' | 'vendor'
  context: Record<string, string | number | boolean>
}
