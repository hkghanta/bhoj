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
