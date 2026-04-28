import { Html, Head, Body, Container, Heading, Text, Button, Section, Preview } from '@react-email/components'

type Props = {
  customerName: string
  vendorName: string
  eventName: string
  totalEstimate: string
  quotesUrl: string
}

export function QuoteReceivedEmail({ customerName, vendorName, eventName, totalEstimate, quotesUrl }: Props) {
  return (
    <Html>
      <Head />
      <Preview>Quote received from {vendorName} for {eventName}</Preview>
      <Body style={{ backgroundColor: '#f9fafb', fontFamily: 'Arial, sans-serif' }}>
        <Container style={{ maxWidth: '560px', margin: '0 auto', padding: '40px 20px' }}>
          <Section style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '32px', border: '1px solid #e5e7eb' }}>
            <Heading style={{ color: '#ea580c', fontSize: '24px', marginBottom: '8px' }}>Bhoj</Heading>
            <Text style={{ color: '#374151', fontSize: '16px', fontWeight: 'bold' }}>
              You received a quote!
            </Text>
            <Text style={{ color: '#6b7280', fontSize: '14px' }}>
              Hi {customerName}, <strong>{vendorName}</strong> has submitted a quote for your event <strong>{eventName}</strong>.
            </Text>

            <Section style={{ backgroundColor: '#fff7ed', borderRadius: '8px', padding: '16px', margin: '20px 0' }}>
              <Text style={{ margin: 0, color: '#ea580c', fontSize: '20px', fontWeight: 'bold' }}>
                {totalEstimate} total estimate
              </Text>
              <Text style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '13px' }}>
                Including menu proposal and pricing breakdown
              </Text>
            </Section>

            <Button
              href={quotesUrl}
              style={{
                backgroundColor: '#ea580c',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                fontWeight: 'bold',
                fontSize: '14px',
                display: 'block',
                textAlign: 'center',
                textDecoration: 'none',
              }}
            >
              View & Compare Quotes
            </Button>
          </Section>

          <Text style={{ color: '#9ca3af', fontSize: '12px', textAlign: 'center', marginTop: '24px' }}>
            Bhoj · Indian Event Services
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
