import { Html, Head, Body, Container, Text, Button, Section, Preview } from '@react-email/components'

type Props = {
  recipientName: string
  senderName: string
  eventName: string
  bodyPreview: string
  conversationUrl: string
}

export function NewMessageEmail({ recipientName, senderName, eventName, bodyPreview, conversationUrl }: Props) {
  return (
    <Html>
      <Head />
      <Preview>New message from {senderName} about {eventName}</Preview>
      <Body style={{ backgroundColor: '#f9fafb', fontFamily: 'Arial, sans-serif' }}>
        <Container style={{ maxWidth: '560px', margin: '0 auto', padding: '40px 20px' }}>
          <Section style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '32px', border: '1px solid #e5e7eb' }}>
            <Text style={{ color: '#ea580c', fontSize: '20px', fontWeight: 'bold' }}>Bhoj</Text>
            <Text style={{ color: '#374151', fontSize: '15px' }}>
              Hi {recipientName}, you have a new message from <strong>{senderName}</strong> about <strong>{eventName}</strong>.
            </Text>
            <Section style={{ backgroundColor: '#f3f4f6', borderRadius: '8px', padding: '12px 16px', margin: '16px 0', borderLeft: '3px solid #ea580c' }}>
              <Text style={{ margin: 0, color: '#374151', fontSize: '14px', fontStyle: 'italic' }}>
                &ldquo;{bodyPreview}&rdquo;
              </Text>
            </Section>
            <Button
              href={conversationUrl}
              style={{ backgroundColor: '#ea580c', color: 'white', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', textDecoration: 'none' }}
            >
              Reply
            </Button>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
