import {
  Html, Head, Body, Container, Heading, Text, Button,
  Section, Hr, Preview
} from '@react-email/components'

type Props = {
  vendorName: string
  eventName: string
  guestCount: number
  eventDate: string
  city: string
  matchScore: number
  leadsUrl: string
}

export function NewLeadEmail({ vendorName, eventName, guestCount, eventDate, city, matchScore, leadsUrl }: Props) {
  return (
    <Html>
      <Head />
      <Preview>{`New lead: ${eventName} in ${city} — ${guestCount} guests`}</Preview>
      <Body style={{ backgroundColor: '#f9fafb', fontFamily: 'Arial, sans-serif' }}>
        <Container style={{ maxWidth: '560px', margin: '0 auto', padding: '40px 20px' }}>
          <Section style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '32px', border: '1px solid #e5e7eb' }}>
            <Heading style={{ color: '#ea580c', fontSize: '24px', marginBottom: '8px' }}>
              Bhoj
            </Heading>
            <Text style={{ color: '#374151', fontSize: '16px', fontWeight: 'bold', marginBottom: '4px' }}>
              You have a new lead!
            </Text>
            <Text style={{ color: '#6b7280', fontSize: '14px', marginTop: 0 }}>
              Hi {vendorName}, a customer is looking for a vendor like you.
            </Text>

            <Section style={{ backgroundColor: '#fff7ed', borderRadius: '8px', padding: '20px', margin: '20px 0', border: '1px solid #fed7aa' }}>
              <Text style={{ margin: 0, fontWeight: 'bold', color: '#111827', fontSize: '16px' }}>{eventName}</Text>
              <Text style={{ margin: '8px 0 0', color: '#6b7280', fontSize: '14px' }}>
                📍 {city} &nbsp;·&nbsp; 👥 {guestCount} guests &nbsp;·&nbsp; 📅 {eventDate}
              </Text>
              <Text style={{ margin: '8px 0 0', color: '#ea580c', fontSize: '13px', fontWeight: 'bold' }}>
                Match score: {matchScore}/100
              </Text>
            </Section>

            <Text style={{ color: '#374151', fontSize: '14px' }}>
              Log in to view the full lead details and submit your quote. Leads expire in 48 hours.
            </Text>

            <Button
              href={leadsUrl}
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
              View Lead & Submit Quote
            </Button>
          </Section>

          <Hr style={{ borderColor: '#e5e7eb', margin: '24px 0' }} />
          <Text style={{ color: '#9ca3af', fontSize: '12px', textAlign: 'center' }}>
            Bhoj · Indian Event Services
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default NewLeadEmail
