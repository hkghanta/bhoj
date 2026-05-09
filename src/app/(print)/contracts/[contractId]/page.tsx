import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PrintControls } from './PrintControls'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ contractId: string }>
}): Promise<Metadata> {
  const { contractId } = await params
  return { title: `Contract ${contractId}` }
}

export default async function ContractPrintPage({
  params,
}: {
  params: Promise<{ contractId: string }>
}) {
  const { contractId } = await params
  const session = await auth()
  if (!session) redirect('/login')

  const userId = session.user!.id as string
  const role = (session.user as any).role as string

  const contract = await prisma.contract.findFirst({
    where: {
      id: contractId,
      ...(role === 'vendor' ? { vendor_id: userId } : { customer_id: userId }),
    },
    include: {
      vendor: { select: { business_name: true, city: true, phone_business: true, email: true } },
      customer: { select: { name: true, email: true } },
      quote: { select: { total_estimate: true, price_per_head: true, currency: true, pricing_type: true } },
      event: { select: { event_name: true, event_date: true, city: true, guest_count: true } },
      signatures: {
        select: { signer_name: true, signer_role: true, signature_type: true, signed_at: true },
        orderBy: { signed_at: 'asc' },
      },
      amendments: {
        where: { status: 'ACCEPTED' },
        select: { description: true, new_total: true, created_at: true },
        orderBy: { created_at: 'asc' },
      },
    },
  })

  if (!contract) return notFound()

  const fmtDate = (d: Date | string) =>
    new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })

  const fmtCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: contract.quote?.currency ?? 'USD',
      maximumFractionDigits: 0,
    }).format(n)

  const statusLabel: Record<string, string> = {
    DRAFT: 'DRAFT',
    SENT: 'PENDING SIGNATURES',
    SIGNED: 'FULLY EXECUTED',
    CANCELLED: 'CANCELLED',
  }

  const statusColor: Record<string, string> = {
    DRAFT: '#6b7280',
    SENT: '#1e40af',
    SIGNED: '#166534',
    CANCELLED: '#991b1b',
  }

  const statusBg: Record<string, string> = {
    DRAFT: '#f3f4f6',
    SENT: '#dbeafe',
    SIGNED: '#dcfce7',
    CANCELLED: '#fee2e2',
  }

  // Parse content into sections
  const contentLines = contract.content.split('\n')
  const sections: { heading: string | null; lines: string[] }[] = []
  let current: { heading: string | null; lines: string[] } = { heading: null, lines: [] }

  for (const line of contentLines) {
    const trimmed = line.trim()
    if (trimmed.length >= 3 && trimmed === trimmed.toUpperCase() && /^[A-Z]/.test(trimmed) && !/^[-\d]/.test(trimmed)) {
      if (current.heading || current.lines.length > 0) sections.push(current)
      current = { heading: trimmed, lines: [] }
    } else {
      current.lines.push(line)
    }
  }
  if (current.heading || current.lines.length > 0) sections.push(current)

  // Parse T&C into sections
  const termsLines = (contract.terms_and_conditions ?? '').split('\n')
  const termsSections: { heading: string | null; lines: string[] }[] = []
  let curTerm: { heading: string | null; lines: string[] } = { heading: null, lines: [] }

  for (const line of termsLines) {
    const trimmed = line.trim()
    if (trimmed.match(/^\d+\.\s+/) && trimmed === trimmed.toUpperCase()) {
      if (curTerm.heading || curTerm.lines.length > 0) termsSections.push(curTerm)
      curTerm = { heading: trimmed, lines: [] }
    } else {
      curTerm.lines.push(line)
    }
  }
  if (curTerm.heading || curTerm.lines.length > 0) termsSections.push(curTerm)

  const vendorSig = contract.signatures.find(s => s.signer_role === 'VENDOR')
  const customerSig = contract.signatures.find(s => s.signer_role === 'CUSTOMER')

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800&display=swap');
      `}</style>

      <style>{`
        @media print {
          nav, aside, header, footer, .print-hide { display: none !important; }
          body { background: #fff !important; padding: 0 !important; margin: 0 !important; min-height: auto !important; }
          .contract-print-root { max-width: none !important; }
          @page { margin: 22mm 18mm; size: A4; }
          .contract-sigs { page-break-inside: avoid; }
          .contract-section-heading { page-break-after: avoid; }
        }
      `}</style>

      <div className="contract-print-root print-show" style={{
        maxWidth: 800,
        margin: '0 auto',
        padding: '40px 48px',
        fontFamily: "'Inter', -apple-system, system-ui, sans-serif",
        color: '#1a1a1a',
        fontSize: 13,
        lineHeight: 1.6,
        WebkitFontSmoothing: 'antialiased',
        background: '#fff',
        minHeight: '100vh',
      }}>

        {/* Print controls */}
        <div className="print-hide">
          <PrintControls />
        </div>

        {/* Confidential */}
        <div style={{
          textAlign: 'center',
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: '#ccc',
          marginBottom: 24,
        }}>
          Confidential
        </div>

        {/* ── Header ── */}
        <div style={{ borderBottom: '3px solid #1a1a1a', paddingBottom: 24, marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h1 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: '#111',
              margin: 0,
            }}>
              Service Agreement
            </h1>
            <span style={{
              display: 'inline-block',
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding: '3px 10px',
              borderRadius: 3,
              background: statusBg[contract.status] ?? '#f3f4f6',
              color: statusColor[contract.status] ?? '#666',
            }}>
              {statusLabel[contract.status] ?? contract.status}
            </span>
          </div>
          <div style={{ fontSize: 14, color: '#555', marginTop: 4 }}>
            {contract.vendor.business_name} &mdash; {contract.event?.event_name ?? 'Event'}
          </div>
          <div style={{
            fontSize: 11,
            color: '#999',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            marginTop: 8,
          }}>
            Contract No. {contract.contract_number} &nbsp;&middot;&nbsp; Issued {fmtDate(contract.created_at)}
            {contract.expires_at && (
              <> &nbsp;&middot;&nbsp; Expires {fmtDate(contract.expires_at)}</>
            )}
          </div>
        </div>

        {/* ── Parties ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 32,
          marginBottom: 32,
          padding: '20px 24px',
          background: '#fafafa',
          border: '1px solid #e5e5e5',
          borderRadius: 4,
        }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#999', marginBottom: 6 }}>
              Service Provider
            </div>
            <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 16, fontWeight: 600, color: '#111' }}>
              {contract.vendor.business_name}
            </div>
            {contract.vendor_address && (
              <div style={{ fontSize: 12, color: '#666', marginTop: 4, whiteSpace: 'pre-line', lineHeight: 1.5 }}>
                {contract.vendor_address}
              </div>
            )}
            {contract.vendor.email && <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>{contract.vendor.email}</div>}
            {contract.vendor.phone_business && <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>{contract.vendor.phone_business}</div>}
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#999', marginBottom: 6 }}>
              Client
            </div>
            <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 16, fontWeight: 600, color: '#111' }}>
              {contract.customer.name}
            </div>
            {contract.customer_address && (
              <div style={{ fontSize: 12, color: '#666', marginTop: 4, whiteSpace: 'pre-line', lineHeight: 1.5 }}>
                {contract.customer_address}
              </div>
            )}
            {contract.customer.email && <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>{contract.customer.email}</div>}
          </div>
        </div>

        {/* ── Event info ── */}
        {contract.event && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 16,
            marginBottom: 32,
            padding: '16px 24px',
            borderLeft: '3px solid #1a1a1a',
            background: '#fafafa',
          }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#999', marginBottom: 3 }}>Event</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>{contract.event.event_name}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#999', marginBottom: 3 }}>Date</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>{fmtDate(contract.event.event_date)}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#999', marginBottom: 3 }}>Location</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>{contract.event.city}</div>
            </div>
            {contract.quote && (
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#999', marginBottom: 3 }}>Contract Value</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>{fmtCurrency(Number(contract.quote.total_estimate))}</div>
              </div>
            )}
          </div>
        )}

        {/* ── Contract Content ── */}
        {sections.map((sec, i) => (
          <div key={i}>
            {sec.heading && (
              <h2 className="contract-section-heading" style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 15,
                fontWeight: 700,
                color: '#111',
                marginTop: 28,
                marginBottom: 10,
                paddingBottom: 6,
                borderBottom: '1px solid #e5e5e5',
                letterSpacing: '0.01em',
              }}>
                {sec.heading.charAt(0) + sec.heading.slice(1).toLowerCase()}
              </h2>
            )}
            <div style={{
              fontSize: 13,
              color: i === 0 && !sec.heading ? '#444' : '#333',
              lineHeight: 1.7,
              whiteSpace: 'pre-wrap',
              fontStyle: i === 0 && !sec.heading ? 'italic' : 'normal',
              marginBottom: i === 0 && !sec.heading ? 12 : 0,
            }}>
              {sec.lines.filter(l => l.trim()).join('\n')}
            </div>
          </div>
        ))}

        {/* ── Terms & Conditions ── */}
        {contract.terms_and_conditions && (
          <>
            <hr style={{ border: 'none', borderTop: '2px solid #1a1a1a', margin: '36px 0 28px' }} />
            <h2 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 18,
              fontWeight: 700,
              color: '#111',
              marginBottom: 20,
            }}>
              Terms &amp; Conditions
            </h2>
            {termsSections.map((sec, i) => (
              <div key={i}>
                {sec.heading && (
                  <h3 style={{
                    fontSize: 12,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: '#555',
                    marginTop: 20,
                    marginBottom: 6,
                  }}>
                    {sec.heading}
                  </h3>
                )}
                <div style={{ fontSize: 12, color: '#555', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                  {sec.lines.filter(l => l.trim()).join('\n')}
                </div>
              </div>
            ))}
          </>
        )}

        {/* ── Accepted Amendments ── */}
        {contract.amendments.length > 0 && (
          <div style={{ marginTop: 32, paddingTop: 20, borderTop: '1px solid #e5e5e5' }}>
            <h2 className="contract-section-heading" style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 15,
              fontWeight: 700,
              color: '#111',
              marginBottom: 12,
              paddingBottom: 6,
              borderBottom: '1px solid #e5e5e5',
            }}>
              Accepted Amendments
            </h2>
            {contract.amendments.map((a, i) => (
              <div key={i} style={{
                padding: '12px 16px',
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: 4,
                marginBottom: 8,
                fontSize: 12,
              }}>
                <div style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>
                  Amendment {i + 1} &middot; {fmtDate(a.created_at)}
                </div>
                <div>{a.description}</div>
                {a.new_total && (
                  <div style={{ fontWeight: 600, marginTop: 4 }}>
                    Revised total: {fmtCurrency(Number(a.new_total))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Signatures ── */}
        <div className="contract-sigs" style={{ marginTop: 40, paddingTop: 24, borderTop: '2px solid #1a1a1a' }}>
          <h2 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 18,
            fontWeight: 700,
            color: '#111',
            marginBottom: 24,
          }}>
            Signatures
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
            {/* Vendor signature */}
            <div>
              <div style={{
                borderBottom: '1px solid #999',
                height: 48,
                display: 'flex',
                alignItems: 'flex-end',
                paddingBottom: 4,
              }}>
                {vendorSig ? (
                  <span style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 20, fontStyle: 'italic', color: '#1a1a1a' }}>
                    {vendorSig.signer_name}
                  </span>
                ) : (
                  <span style={{ fontSize: 12, color: '#bbb', fontStyle: 'italic' }}>Awaiting signature</span>
                )}
              </div>
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#333' }}>{contract.vendor.business_name}</div>
                <div style={{ fontSize: 11, color: '#999', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Service Provider</div>
                {vendorSig && (
                  <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>Signed {fmtDate(vendorSig.signed_at)}</div>
                )}
              </div>
            </div>

            {/* Customer signature */}
            <div>
              <div style={{
                borderBottom: '1px solid #999',
                height: 48,
                display: 'flex',
                alignItems: 'flex-end',
                paddingBottom: 4,
              }}>
                {customerSig ? (
                  <span style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 20, fontStyle: 'italic', color: '#1a1a1a' }}>
                    {customerSig.signer_name}
                  </span>
                ) : (
                  <span style={{ fontSize: 12, color: '#bbb', fontStyle: 'italic' }}>Awaiting signature</span>
                )}
              </div>
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#333' }}>{contract.customer.name}</div>
                <div style={{ fontSize: 11, color: '#999', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Client</div>
                {customerSig && (
                  <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>Signed {fmtDate(customerSig.signed_at)}</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{
          marginTop: 48,
          paddingTop: 16,
          borderTop: '1px solid #e5e5e5',
          textAlign: 'center',
          fontSize: 10,
          color: '#bbb',
          letterSpacing: '0.02em',
        }}>
          Contract #{contract.contract_number} &nbsp;&middot;&nbsp; Generated via OneSeva &nbsp;&middot;&nbsp; {fmtDate(new Date())}
        </div>
      </div>
    </>
  )
}
