import { startMatchWorker } from './lib/jobs/match'
import { startRetuneWorker } from './lib/jobs/retune'
import { startNotificationWorker } from './lib/jobs/notifications'
import { scheduleRetuneJob, scheduleMonthlyReset } from './lib/jobs/queues'

async function main() {
  const matchWorker = startMatchWorker()
  const retuneWorker = startRetuneWorker()
  const notifyWorker = startNotificationWorker()

  await scheduleRetuneJob()
  await scheduleMonthlyReset()

  console.log('[worker] Match worker started')
  console.log('[worker] Retune worker started')
  console.log('[worker] Notification worker started')
  console.log('[worker] Weekly re-tune scheduled (Mon 03:00 UTC)')
  console.log('[worker] Monthly lead reset scheduled (1st of each month 00:00 UTC)')

  process.on('SIGTERM', async () => {
    await matchWorker.close()
    await retuneWorker.close()
    await notifyWorker.close()
    process.exit(0)
  })
}

main().catch(console.error)
