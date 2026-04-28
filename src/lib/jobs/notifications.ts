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
