import { Html, Head, Body, Container, Text, Button, Section, Preview } from '@react-email/components'

type Props = {
  vendorName: string
  reviewerName: string
  rating: number
  eventType: string
  reviewsUrl: string
}

export function ReviewPostedEmail({ vendorName, reviewerName, rating, eventType, reviewsUrl }: Props) {
  const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating)
  return (
    <Html>
      <Head />
      <Preview>{`${reviewerName} left you a ${rating}-star review`}</Preview>
      <Body style={{ backgroundColor: '#f9fafb', fontFamily: 'Arial, sans-serif' }}>
        <Container style={{ maxWidth: '560px', margin: '0 auto', padding: '40px 20px' }}>
          <Section style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '32px', border: '1px solid #e5e7eb' }}>
            <Text style={{ color: '#ea580c', fontSize: '20px', fontWeight: 'bold' }}>Bhoj</Text>
            <Text style={{ color: '#374151', fontSize: '15px' }}>
              Hi {vendorName}, <strong>{reviewerName}</strong> left you a review for a {eventType} event.
            </Text>
            <Text style={{ color: '#f59e0b', fontSize: '28px', margin: '8px 0' }}>{stars}</Text>
            <Text style={{ color: '#6b7280', fontSize: '13px' }}>{rating}/5 stars</Text>
            <Button
              href={reviewsUrl}
              style={{ backgroundColor: '#ea580c', color: 'white', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', textDecoration: 'none', marginTop: '16px' }}
            >
              View Review & Reply
            </Button>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
