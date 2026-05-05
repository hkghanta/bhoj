import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PrintControls } from './PrintControls'

const CATEGORY_LABELS: Record<string, string> = {
  SOUP_SALAD: 'Soups & Salads', APPETIZER: 'Appetizers', MAIN_COURSE: 'Mains',
  BREAD: 'Breads', RICE_BIRYANI: 'Rice & Biryani', DAL: 'Dal',
  DESSERT: 'Desserts', BEVERAGE: 'Beverages', LIVE_COUNTER: 'Live Counters',
}

export default async function PrintMenuPage({
  params,
}: {
  params: Promise<{ id: string; quoteId: string }>
}) {
  const { id: eventId, quoteId } = await params
  const session = await auth()
  if (!session) redirect(`/login?next=/events/${eventId}/menu-print/${quoteId}`)
  if ((session.user as any).role !== 'customer') return notFound()

  const quote = await prisma.quote.findFirst({
    where: {
      id: quoteId,
      match: { event_request: { event: { id: eventId, customer_id: session.user!.id as string } } },
    },
    include: {
      vendor: { select: { business_name: true, city: true, phone_business: true } },
      menu_items: {
        where: { is_removed_by_customer: false },
        orderBy: [{ category: 'asc' }, { sort_order: 'asc' }],
      },
      match: {
        include: {
          event_request: {
            include: { event: { select: { event_name: true, event_date: true, guest_count: true } } },
          },
        },
      },
    },
  })

  if (!quote) return notFound()

  const event = quote.match.event_request.event
  const categories = [...new Set(quote.menu_items.map(i => i.category))]
  const fmtCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: quote.currency, maximumFractionDigits: 0 }).format(n)
  const fmtDate = (d: Date) =>
    new Date(d).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Menu — {event.event_name} × {quote.vendor.business_name}</title>
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: Georgia, 'Times New Roman', serif; color: #1a1a1a; background: #fff; padding: 40px; max-width: 800px; margin: 0 auto; line-height: 1.5; }
          h1 { font-size: 26px; font-weight: 700; margin-bottom: 4px; }
          .subtitle { font-size: 13px; color: #666; margin-bottom: 20px; }
          hr { border: none; border-top: 1px solid #ddd; margin: 18px 0; }
          .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 24px; margin-bottom: 20px; font-size: 13px; }
          .meta-label { color: #888; font-style: italic; margin-bottom: 2px; font-family: sans-serif; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
          .meta-value { font-weight: 600; }
          .section-title { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #888; font-family: sans-serif; margin-bottom: 8px; margin-top: 18px; }
          .item { padding: 6px 0; border-bottom: 1px dotted #eee; font-size: 14px; display: flex; align-items: flex-start; gap: 8px; }
          .item:last-child { border-bottom: none; }
          .item-bullet { color: #c2410c; flex-shrink: 0; font-size: 12px; margin-top: 3px; }
          .item-body { flex: 1; }
          .item-name { font-weight: 600; }
          .item-added { font-size: 11px; color: #c2410c; font-style: italic; margin-left: 6px; font-weight: normal; }
          .item-desc { font-size: 12px; color: #666; margin-top: 3px; line-height: 1.4; font-style: italic; }
          .item-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; }
          .tag { font-size: 10px; padding: 1px 6px; border-radius: 9999px; border: 1px solid; font-family: sans-serif; }
          .tag-veg { background: #f0fdf4; color: #15803d; border-color: #bbf7d0; }
          .tag-halal { background: #eff6ff; color: #1d4ed8; border-color: #bfdbfe; }
          .tag-jain { background: #fefce8; color: #a16207; border-color: #fde68a; }
          .tag-allergen { background: #fffbeb; color: #b45309; border-color: #fde68a; }
          .notes-box { background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 12px 16px; font-size: 13px; color: #92400e; margin-top: 20px; }
          .vendor-notes { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px 16px; font-size: 13px; color: #374151; margin-top: 12px; }
          .notes-label { font-weight: 600; margin-bottom: 4px; font-family: sans-serif; font-size: 12px; }
          .footer { margin-top: 36px; font-size: 11px; color: #aaa; text-align: center; font-family: sans-serif; }
          .print-controls { margin-bottom: 24px; display: flex; gap: 8px; font-family: sans-serif; }
          .btn-print { padding: 8px 18px; background: #c2410c; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500; }
          .btn-close { padding: 8px 16px; background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; border-radius: 6px; cursor: pointer; font-size: 13px; }
          @media print {
            .print-controls { display: none; }
            body { padding: 0; }
            @page { margin: 20mm; }
          }
        `}</style>
      </head>
      <body>
        <PrintControls />

        <h1>{event.event_name}</h1>
        <p className="subtitle">
          Menu proposal from {quote.vendor.business_name} · {fmtDate(event.event_date)}
        </p>

        <hr />

        <div className="meta-grid">
          <div>
            <div className="meta-label">Caterer</div>
            <div className="meta-value">{quote.vendor.business_name}</div>
            {quote.vendor.city && <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>{quote.vendor.city}</div>}
          </div>
          <div>
            <div className="meta-label">Guest count</div>
            <div className="meta-value">{event.guest_count} guests</div>
          </div>
          {quote.price_per_head && (
            <div>
              <div className="meta-label">Price per head</div>
              <div className="meta-value">{fmtCurrency(Number(quote.price_per_head))}</div>
            </div>
          )}
          <div>
            <div className="meta-label">Total estimate</div>
            <div className="meta-value">{fmtCurrency(Number(quote.total_estimate))}</div>
          </div>
        </div>

        <hr />

        {categories.map(cat => {
          const items = quote.menu_items.filter(i => i.category === cat)
          return (
            <div key={cat}>
              <p className="section-title">{CATEGORY_LABELS[cat] ?? cat}</p>
              {items.map(item => {
                const allergens = [item.contains_nuts && 'nuts', item.contains_gluten && 'gluten', item.contains_dairy && 'dairy'].filter(Boolean)
                return (
                  <div key={item.id} className="item">
                    <span className="item-bullet">▸</span>
                    <div className="item-body">
                      <div className="item-name">
                        {item.item_name}
                        {item.added_by_customer && <span className="item-added">(your request)</span>}
                      </div>
                      {item.description && <div className="item-desc">{item.description}</div>}
                      <div className="item-tags">
                        {item.is_vegetarian && <span className="tag tag-veg">Vegetarian</span>}
                        {item.is_jain && <span className="tag tag-jain">Jain</span>}
                        {item.is_halal && <span className="tag tag-halal">Halal</span>}
                        {allergens.length > 0 && <span className="tag tag-allergen">Contains: {allergens.join(', ')}</span>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}

        {quote.customer_menu_notes && (
          <div className="notes-box">
            <div className="notes-label">Special requests / notes</div>
            <div>{quote.customer_menu_notes}</div>
          </div>
        )}

        {quote.notes && (
          <div className="vendor-notes">
            <div className="notes-label">Caterer notes</div>
            <div>{quote.notes}</div>
          </div>
        )}

        <div className="footer">
          Finalized menu · {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })} · OneSeva
        </div>
      </body>
    </html>
  )
}
