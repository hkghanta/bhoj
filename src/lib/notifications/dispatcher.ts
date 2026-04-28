import { prisma } from '@/lib/prisma'
import { sendEmail } from './channels/email'
import { sendPush } from './channels/push'
import { sendWhatsApp } from './channels/whatsapp'
import { getPushTokens } from './channels/push-token-store'
import type { NotificationJob } from './types'

export async function dispatch(job: NotificationJob): Promise<void> {
  const { recipientId, recipientType, eventType } = job

  const prefs = recipientType === 'customer'
    ? await prisma.customerNotificationPref.findMany({
        where: { customer_id: recipientId, event_type: eventType },
      })
    : await prisma.vendorNotificationPref.findMany({
        where: { vendor_id: recipientId, event_type: eventType },
      })

  const enabledChannels = new Set<string>()

  if (prefs.length === 0) {
    // Default: email and push enabled
    enabledChannels.add('EMAIL')
    enabledChannels.add('PUSH')
  } else {
    for (const pref of prefs) {
      if (pref.is_enabled) enabledChannels.add(pref.channel)
    }
  }

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
