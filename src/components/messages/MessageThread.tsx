'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { Send } from 'lucide-react'

type Message = {
  id: string; body: string; sender_type: 'CUSTOMER' | 'VENDOR'
  sender_id: string; is_read: boolean; created_at: string
}

type Props = {
  conversationId: string
  currentUserRole: 'customer' | 'vendor'
  currentUserId: string
}

const POLL_INTERVAL = 5000

export function MessageThread({ conversationId, currentUserRole }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const lastMessageTimeRef = useRef<string | null>(null)

  useEffect(() => {
    fetch(`/api/conversations/${conversationId}/messages`)
      .then(r => r.json())
      .then((msgs: Message[]) => {
        setMessages(msgs)
        if (msgs.length > 0) {
          lastMessageTimeRef.current = msgs[msgs.length - 1].created_at
        }
      })
  }, [conversationId])

  const pollMessages = useCallback(async () => {
    if (!lastMessageTimeRef.current) return
    const since = lastMessageTimeRef.current
    const res = await fetch(`/api/conversations/${conversationId}/messages?since=${since}`)
    if (!res.ok) return
    const newMsgs: Message[] = await res.json()
    if (newMsgs.length > 0) {
      setMessages(prev => {
        const existingIds = new Set(prev.map(m => m.id))
        const fresh = newMsgs.filter(m => !existingIds.has(m.id))
        if (fresh.length === 0) return prev
        lastMessageTimeRef.current = fresh[fresh.length - 1].created_at
        return [...prev, ...fresh]
      })
    }
  }, [conversationId])

  useEffect(() => {
    const interval = setInterval(pollMessages, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [pollMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    if (!input.trim()) return
    setSending(true)
    const res = await fetch(`/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: input.trim() }),
    })
    if (res.ok) {
      const msg: Message = await res.json()
      setMessages(prev => [...prev, msg])
      lastMessageTimeRef.current = msg.created_at
      setInput('')
    }
    setSending(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const myType = currentUserRole === 'customer' ? 'CUSTOMER' : 'VENDOR'

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((msg, i) => {
          const isMine = msg.sender_type === myType
          const showDate =
            i === 0 ||
            new Date(msg.created_at).toDateString() !==
              new Date(messages[i - 1].created_at).toDateString()

          return (
            <div key={msg.id}>
              {showDate && (
                <div className="text-center text-xs text-gray-400 my-3">
                  {format(new Date(msg.created_at), 'EEEE, d MMMM yyyy')}
                </div>
              )}
              <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${
                  isMine
                    ? 'bg-orange-600 text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                }`}>
                  <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                  <p className={`text-xs mt-1 ${isMine ? 'text-orange-200' : 'text-gray-400'}`}>
                    {format(new Date(msg.created_at), 'HH:mm')}
                    {isMine && msg.is_read && <span className="ml-1">✓✓</span>}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <div className="border-t bg-white px-4 py-3 flex gap-3 items-end">
        <Textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
          rows={2}
          className="flex-1 resize-none"
        />
        <button
          onClick={sendMessage}
          disabled={sending || !input.trim()}
          className={cn(buttonVariants(), 'bg-orange-600 hover:bg-orange-700 flex-shrink-0 disabled:opacity-50')}
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
