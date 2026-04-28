import { Queue } from 'bullmq'
import { redis } from '@/lib/redis'

export const matchQueue = new Queue('match', { connection: redis })
export const notificationQueue = new Queue('notifications', { connection: redis })
export const retuneQueue = new Queue('retune', { connection: redis })

export async function scheduleRetuneJob() {
  await retuneQueue.add(
    'weekly-retune',
    {},
    {
      repeat: { pattern: '0 3 * * 1' },
      jobId: 'weekly-retune-singleton',
    }
  )
}
