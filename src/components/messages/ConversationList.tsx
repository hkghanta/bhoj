'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

type Conversation = {
  id: string
  unread_count: number
  last_message_at: string | null
  messages: { body: string; sender_type: string }[]
  customer: { name: string; avatar_url: string | null }
  vendor: { business_name: string; profile_photo_url: string | null }
  match: {
    event_request: {
      vendor_type: string
      event: { event_name: string; event_date: string }
    }
  }
}

type Props = { role: 'customer' | 'vendor'; basePath: string }

export function ConversationList({ role, basePath }: Props) {
  const pathname = usePathname()
  const [conversations, setConversations] = useState<Conversation[]>([])

  useEffect(() => {
    fetch('/api/conversations')
      .then(r => r.json())
      .then(data => setConversations(Array.isArray(data) ? data : []))
  }, [])

  const getDisplayName = (c: Conversation) =>
    role === 'customer' ? c.vendor.business_name : c.customer.name

  const getAvatar = (c: Conversation) =>
    role === 'customer' ? c.vendor.profile_photo_url : c.customer.avatar_url

  return (
    <div className="border-r h-full w-72 overflow-y-auto bg-white flex-shrink-0">
      <div className="px-4 py-4 border-b">
        <h2 className="font-semibold text-gray-900">Messages</h2>
      </div>
      {conversations.length === 0 && (
        <div className="p-6 text-center text-gray-400 text-sm">No conversations yet.</div>
      )}
      {conversations.map(c => {
        const isActive = pathname.includes(c.id)
        const lastMsg = c.messages[0]
        const name = getDisplayName(c)
        const avatar = getAvatar(c)

        return (
          <Link key={c.id} href={`${basePath}/${c.id}`}>
            <div className={cn(
              'flex items-start gap-3 px-4 py-3 border-b hover:bg-gray-50 cursor-pointer',
              isActive && 'bg-orange-50 border-l-2 border-l-orange-500'
            )}>
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 text-orange-600 font-semibold text-sm overflow-hidden">
                {avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatar} className="w-10 h-10 rounded-full object-cover" alt={name} />
                ) : name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm text-gray-900 truncate">{name}</span>
                  {c.last_message_at && (
                    <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                      {formatDistanceToNow(new Date(c.last_message_at), { addSuffix: true })}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 truncate mt-0.5">
                  {c.match.event_request.event.event_name} · {c.match.event_request.vendor_type.replace(/_/g, ' ')}
                </p>
                {lastMsg && (
                  <p className="text-xs text-gray-500 truncate mt-0.5">{lastMsg.body}</p>
                )}
              </div>
              {c.unread_count > 0 && (
                <span className="bg-orange-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0">
                  {c.unread_count}
                </span>
              )}
            </div>
          </Link>
        )
      })}
    </div>
  )
}
