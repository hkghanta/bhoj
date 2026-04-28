import { startMatchWorker } from './lib/jobs/match'
import { startRetuneWorker } from './lib/jobs/retune'
import { scheduleRetuneJob } from './lib/jobs/queues'

async function main() {
  const matchWorker = startMatchWorker()
  const retuneWorker = startRetuneWorker()

  await scheduleRetuneJob()

  console.log('[worker] Match worker started')
  console.log('[worker] Retune worker started')
  console.log('[worker] Weekly re-tune scheduled (Mon 03:00 UTC)')

  process.on('SIGTERM', async () => {
    await matchWorker.close()
    await retuneWorker.close()
    process.exit(0)
  })
}

main().catch(console.error)
