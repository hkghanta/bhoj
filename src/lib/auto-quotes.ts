import { prisma } from '@/lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'

/**
 * Process auto-quote rules for a given event request.
 * Called after an EventRequest is created (for CATERER vendor_type).
 * Finds matching AutoQuoteRules and creates Quotes automatically.
 */
export async function processAutoQuotes(eventRequestId: string): Promise<{
  created: number
  errors: string[]
}> {
  const errors: string[] = []
  let created = 0

  // Fetch the event request with event details and menu preferences
  const eventRequest = await prisma.eventRequest.findUnique({
    where: { id: eventRequestId },
    include: {
      event: true,
      menu_preference: true,
    },
  })

  if (!eventRequest) {
    return { created: 0, errors: ['Event request not found'] }
  }

  // Only process caterer requests
  if (eventRequest.vendor_type !== 'CATERER') {
    return { created: 0, errors: [] }
  }

  const { event } = eventRequest
  const guestCount = event.guest_count
  const eventType = event.event_type.toUpperCase()

  // Cuisine preferences from the event request (if any)
  const cuisinePrefs = eventRequest.menu_preference?.cuisine_preferences ?? []

  // Find all active auto-quote rules that match this event
  const activeRules = await prisma.autoQuoteRule.findMany({
    where: {
      is_active: true,
      menu_package_id: { not: null }, // must have a package to generate a quote
    },
    include: {
      menu_package: {
        include: {
          items: {
            include: { menu_item: true },
            orderBy: { sort_order: 'asc' },
          },
        },
      },
    },
  })

  for (const rule of activeRules) {
    try {
      // --- Event type matching ---
      const ruleEventTypes = rule.event_types.map((t) => t.toUpperCase())
      if (ruleEventTypes.length > 0 && !ruleEventTypes.includes(eventType)) {
        continue
      }

      // --- Guest count range matching ---
      if (rule.guest_count_min != null && guestCount < rule.guest_count_min) {
        continue
      }
      if (rule.guest_count_max != null && guestCount > rule.guest_count_max) {
        continue
      }

      // --- Cuisine matching (overlap check) ---
      if (rule.cuisine_match.length > 0 && cuisinePrefs.length > 0) {
        const ruleCuisines = rule.cuisine_match.map((c) => c.toUpperCase())
        const eventCuisines = cuisinePrefs.map((c) => c.toUpperCase())
        const hasOverlap = ruleCuisines.some((c) => eventCuisines.includes(c))
        if (!hasOverlap) {
          continue
        }
      }

      const vendorId = rule.vendor_id
      const menuPackage = rule.menu_package!

      // Check if vendor already has a quote for this event request
      const existingQuote = await prisma.quote.findFirst({
        where: {
          vendor_id: vendorId,
          match: { event_request_id: eventRequestId },
        },
      })
      if (existingQuote) {
        continue
      }

      // Find or create a Match between vendor and event request
      let match = await prisma.match.findFirst({
        where: {
          event_request_id: eventRequestId,
          vendor_id: vendorId,
        },
      })

      if (!match) {
        match = await prisma.match.create({
          data: {
            event_request_id: eventRequestId,
            vendor_id: vendorId,
            vendor_type: 'CATERER',
            score: 50,
            rank: 99,
            status: 'PENDING',
          },
        })
      }

      // Calculate pricing
      const markupMultiplier = new Decimal(1).plus(
        new Decimal(rule.markup_percent.toString()).dividedBy(100),
      )
      const pricePerHead = new Decimal(menuPackage.price_per_head.toString()).times(
        markupMultiplier,
      )
      const totalEstimate = pricePerHead.times(guestCount)

      // Create the quote with menu items in a transaction
      await prisma.$transaction(async (tx) => {
        const quote = await tx.quote.create({
          data: {
            match_id: match!.id,
            vendor_id: vendorId,
            pricing_type: 'PER_HEAD',
            price_per_head: pricePerHead,
            total_estimate: totalEstimate,
            currency: menuPackage.currency,
            notes: rule.auto_message ?? null,
            is_auto_generated: true,
            status: 'SENT',
          },
        })

        // Copy menu items from the package
        if (menuPackage.items.length > 0) {
          await tx.quoteMenuItem.createMany({
            data: menuPackage.items.map((pkgItem) => ({
              quote_id: quote.id,
              menu_item_id: pkgItem.menu_item_id,
              item_name: pkgItem.menu_item.name,
              category: pkgItem.menu_item.category,
              is_vegetarian: pkgItem.menu_item.is_vegetarian,
              is_jain: pkgItem.menu_item.is_jain,
              is_halal: pkgItem.menu_item.is_halal,
              contains_nuts: pkgItem.menu_item.contains_nuts,
              contains_gluten: pkgItem.menu_item.contains_gluten,
              contains_dairy: pkgItem.menu_item.contains_dairy,
              is_optional: pkgItem.is_optional,
              description: pkgItem.menu_item.description ?? null,
              sort_order: pkgItem.sort_order,
            })),
          })
        }

        // Update match status to QUOTED
        await tx.match.update({
          where: { id: match!.id },
          data: { status: 'QUOTED' },
        })
      })

      created++
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      errors.push(`Rule ${rule.id} (${rule.name}): ${message}`)
    }
  }

  return { created, errors }
}
