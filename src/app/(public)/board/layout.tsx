import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Open Requests — Vendors Needed for Indian Events | OneSeva',
  description:
    'Browse open event requests from hosts looking for Indian caterers, photographers, decorators, DJs, and more. Respond free — no commission, no middlemen.',
  openGraph: {
    title: 'Open Requests — Vendors Needed for Indian Events',
    description:
      'Event hosts are looking for vendors right now. Browse open requests, submit your pitch, and win new business — all free on OneSeva.',
    siteName: 'OneSeva',
  },
}

export default function BoardLayout({ children }: { children: ReactNode }) {
  return children
}
