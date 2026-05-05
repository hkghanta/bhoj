import * as React from 'react'

type SubEventInfo = { name: string; date: string; venue: string | null }

type Props = {
  householdLabel: string
  eventName: string
  inviteMessage: string | null
  inviteImageUrl: string | null
  subEvents: SubEventInfo[]
  rsvpUrl: string
}

export function InviteEmail({ householdLabel, eventName, inviteMessage, inviteImageUrl, subEvents, rsvpUrl }: Props) {
  return (
    <html>
      <body style={{ fontFamily: 'sans-serif', color: '#111', maxWidth: 600, margin: '0 auto', padding: '24px 16px' }}>
        {inviteImageUrl && (
          <img src={inviteImageUrl} alt="Invitation" style={{ width: '100%', borderRadius: 12, marginBottom: 24 }} />
        )}
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>You're invited!</h2>
        <p style={{ fontSize: 16, color: '#444', marginBottom: 8 }}>Hi {householdLabel},</p>
        {inviteMessage && (
          <p style={{ fontSize: 15, color: '#444', marginBottom: 16, fontStyle: 'italic' }}>"{inviteMessage}"</p>
        )}
        <p style={{ fontSize: 15, marginBottom: 8 }}>You're invited to <strong>{eventName}</strong>:</p>
        <ul style={{ paddingLeft: 20, marginBottom: 24 }}>
          {subEvents.map((se, i) => (
            <li key={i} style={{ fontSize: 14, color: '#555', marginBottom: 4 }}>
              <strong>{se.name}</strong> — {se.date}{se.venue ? ` · ${se.venue}` : ''}
            </li>
          ))}
        </ul>
        <a href={rsvpUrl}
          style={{ display: 'inline-block', background: '#ea580c', color: '#fff', padding: '12px 28px', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 15 }}>
          Open Invitation & RSVP →
        </a>
        <p style={{ fontSize: 12, color: '#999', marginTop: 32 }}>
          Powered by <a href="https://oneseva.com" style={{ color: '#ea580c' }}>OneSeva</a>
        </p>
      </body>
    </html>
  )
}
