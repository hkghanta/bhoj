# Messaging & Reviews Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build in-platform messaging with polling-based real-time updates, a message notification badge, a gated public review system with vendor reply, and a hidden feedback form shown after the event.

**Architecture:** Conversations are tied to a Match (one conversation per match). Messages are fetched with `GET /api/conversations/[id]/messages` and the client polls every 5 seconds using `setInterval`. Unread count is cached in a server component at the layout level. Reviews are gated: the API checks that the event_date is in the past before accepting a submission. Hidden feedback is a separate form shown only after event completion, written to the HiddenFeedback table (never shown publicly). Vendor reply is a PUT on the review record.

**Tech Stack:** Next.js 15 App Router, TypeScript, Prisma 5, shadcn/ui

---

## File Structure

```
src/
├── app/
│   ├── (customer)/
│   │   ├── messages/page.tsx               # Customer conversation list
│   │   └── messages/[conversationId]/
│   │       └── page.tsx                    # Customer message thread
│   ├── (vendor)/
│   │   └── vendor/
│   │       ├── messages/page.tsx           # Vendor conversation list
│   │       └── messages/[conversationId]/
│   │           └── page.tsx                # Vendor message thread
│   └── api/
│       ├── conversations/
│       │   ├── route.ts                    # GET conversations list
│       │   └── [id]/
│       │       └── messages/route.ts       # GET/POST messages in conversation
│       ├── conversations/unread/route.ts   # GET unread count
│       ├── reviews/
│       │   ├── route.ts                    # POST public review
│       │   └── [id]/reply/route.ts         # PUT vendor reply
│       └── feedback/
│           └── hidden/route.ts             # POST hidden feedback
└── components/
    ├── messages/
    │   ├── ConversationList.tsx
    │   ├── MessageThread.tsx
    │   └── UnreadBadge.tsx
    └── reviews/
        ├── ReviewForm.tsx
        ├── ReviewCard.tsx
        └── HiddenFeedbackForm.tsx
```

---

### Task 1: Messaging APIs

**Files:**
- Create: `src/app/api/conversations/route.ts`, `src/app/api/conversations/[id]/messages/route.ts`, `src/app/api/conversations/unread/route.ts`

- [ ] **Step 1: Write conversations list route**

```typescript
// src/app/api/conversations/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (session.user as any).role
  const userId = session.user.id

  const conversations = await prisma.conversation.findMany({
    where: {
      is_archived: false,
      ...(role === 'customer' ? { customer_id: userId } : { vendor_id: userId }),
    },
    include: {
      messages: {
        orderBy: { created_at: 'desc' },
        take: 1,
      },
      customer: { select: { id: true, name: true, avatar_url: true } },
      vendor: { select: { id: true, business_name: true, profile_photo_url: true } },
      match: {
        include: {
          event_request: {
            include: {
              event: { select: { event_name: true, event_date: true } },
            },
          },
        },
      },
    },
    orderBy: { last_message_at: 'desc' },
  })

  // Count unread per conversation for this user
  const unreadCounts = await prisma.message.groupBy({
    by: ['conversation_id'],
    where: {
      conversation_id: { in: conversations.map(c => c.id) },
      is_read: false,
      sender_type: role === 'customer' ? 'VENDOR' : 'CUSTOMER',
    },
    _count: { id: true },
  })

  const unreadMap = Object.fromEntries(unreadCounts.map(u => [u.conversation_id, u._count.id]))

  return NextResponse.json(
    conversations.map(c => ({
      ...c,
      unread_count: unreadMap[c.id] ?? 0,
    }))
  )
}
```

- [ ] **Step 2: Write messages route (GET + POST)**

```typescript
// src/app/api/conversations/[id]/messages/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { SenderType } from '@prisma/client'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const role = (session.user as any).role

  // Verify user is a participant
  const conversation = await prisma.conversation.findFirst({
    where: {
      id,
      ...(role === 'customer'
        ? { customer_id: session.user.id }
        : { vendor_id: session.user.id }),
    },
  })
  if (!conversation) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Mark incoming messages as read
  await prisma.message.updateMany({
    where: {
      conversation_id: id,
      is_read: false,
      sender_type: role === 'customer' ? 'VENDOR' : ('CUSTOMER' as SenderType),
    },
    data: { is_read: true },
  })

  const { searchParams } = new URL(req.url)
  const since = searchParams.get('since')  // ISO string — for polling

  const messages = await prisma.message.findMany({
    where: {
      conversation_id: id,
      ...(since ? { created_at: { gt: new Date(since) } } : {}),
    },
    orderBy: { created_at: 'asc' },
    take: 100,
  })

  return NextResponse.json(messages)
}

const sendSchema = z.object({
  body: z.string().min(1).max(2000),
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const role = (session.user as any).role

  const conversation = await prisma.conversation.findFirst({
    where: {
      id,
      ...(role === 'customer'
        ? { customer_id: session.user.id }
        : { vendor_id: session.user.id }),
    },
  })
  if (!conversation) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const parsed = sendSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const message = await prisma.message.create({
    data: {
      conversation_id: id,
      sender_id: session.user.id,
      sender_type: role === 'customer' ? 'CUSTOMER' : 'VENDOR',
      body: parsed.data.body,
    },
  })

  // Update conversation's last_message_at
  await prisma.conversation.update({
    where: { id },
    data: { last_message_at: message.created_at },
  })

  return NextResponse.json(message, { status: 201 })
}
```

- [ ] **Step 3: Write unread count route**

```typescript
// src/app/api/conversations/unread/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (session.user as any).role

  // Get all conversations for this user
  const conversations = await prisma.conversation.findMany({
    where: {
      ...(role === 'customer'
        ? { customer_id: session.user.id }
        : { vendor_id: session.user.id }),
    },
    select: { id: true },
  })

  const count = await prisma.message.count({
    where: {
      conversation_id: { in: conversations.map(c => c.id) },
      is_read: false,
      // Messages from the OTHER party are "incoming"
      sender_type: role === 'customer' ? 'VENDOR' : 'CUSTOMER',
    },
  })

  return NextResponse.json({ count })
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/conversations/
git commit -m "feat: add conversations and messages API with read tracking"
git push
```

---

### Task 2: Messaging UI components

**Files:**
- Create: `src/components/messages/ConversationList.tsx`, `src/components/messages/MessageThread.tsx`, `src/components/messages/UnreadBadge.tsx`

- [ ] **Step 1: Write UnreadBadge**

```typescript
// src/components/messages/UnreadBadge.tsx
'use client'
import { useEffect, useState } from 'react'

export function UnreadBadge() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    function fetchCount() {
      fetch('/api/conversations/unread')
        .then(r => r.json())
        .then(data => setCount(data.count ?? 0))
    }
    fetchCount()
    const interval = setInterval(fetchCount, 15000)  // Poll every 15s
    return () => clearInterval(interval)
  }, [])

  if (count === 0) return null

  return (
    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold">
      {count > 9 ? '9+' : count}
    </span>
  )
}
```

- [ ] **Step 2: Write ConversationList**

```typescript
// src/components/messages/ConversationList.tsx
'use client'
import { useEffect, useState } from 'react'
import Link from 'link'
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
      .then(setConversations)
  }, [])

  const getDisplayName = (c: Conversation) =>
    role === 'customer' ? c.vendor.business_name : c.customer.name

  const getAvatar = (c: Conversation) =>
    role === 'customer' ? c.vendor.profile_photo_url : c.customer.avatar_url

  return (
    <div className="border-r h-full w-72 overflow-y-auto bg-white">
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
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 text-orange-600 font-semibold text-sm">
                {avatar ? (
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
```

- [ ] **Step 3: Write MessageThread with polling**

```typescript
// src/components/messages/MessageThread.tsx
'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
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

const POLL_INTERVAL = 5000  // 5 seconds

export function MessageThread({ conversationId, currentUserRole, currentUserId }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const lastMessageTimeRef = useRef<string | null>(null)

  // Initial load
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

  // Polling for new messages
  const pollMessages = useCallback(async () => {
    if (!lastMessageTimeRef.current) return
    const since = lastMessageTimeRef.current
    const res = await fetch(`/api/conversations/${conversationId}/messages?since=${since}`)
    if (!res.ok) return
    const newMsgs: Message[] = await res.json()
    if (newMsgs.length > 0) {
      setMessages(prev => {
        // Merge, avoiding duplicates by id
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

  // Scroll to bottom when new messages arrive
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
      {/* Messages area */}
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

      {/* Input area */}
      <div className="border-t bg-white px-4 py-3 flex gap-3 items-end">
        <Textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
          rows={2}
          className="flex-1 resize-none"
        />
        <Button
          onClick={sendMessage}
          disabled={sending || !input.trim()}
          className="bg-orange-600 hover:bg-orange-700 flex-shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Write message pages**

```typescript
// src/app/(customer)/messages/page.tsx
import { ConversationList } from '@/components/messages/ConversationList'

export default function CustomerMessagesPage() {
  return (
    <div className="flex h-[calc(100vh-4rem)] -mx-8 -my-6">
      <ConversationList role="customer" basePath="/messages" />
      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
        Select a conversation to start messaging
      </div>
    </div>
  )
}
```

```typescript
// src/app/(customer)/messages/[conversationId]/page.tsx
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ConversationList } from '@/components/messages/ConversationList'
import { MessageThread } from '@/components/messages/MessageThread'

export default async function CustomerConversationPage({ params }: { params: Promise<{ conversationId: string }> }) {
  const session = await auth()
  if (!session) redirect('/login')

  const { conversationId } = await params

  return (
    <div className="flex h-[calc(100vh-4rem)] -mx-8 -my-6">
      <ConversationList role="customer" basePath="/messages" />
      <div className="flex-1">
        <MessageThread
          conversationId={conversationId}
          currentUserRole="customer"
          currentUserId={session.user.id}
        />
      </div>
    </div>
  )
}
```

```typescript
// src/app/(vendor)/vendor/messages/page.tsx
import { ConversationList } from '@/components/messages/ConversationList'

export default function VendorMessagesPage() {
  return (
    <div className="flex h-[calc(100vh-4rem)] -mx-8 -my-6">
      <ConversationList role="vendor" basePath="/vendor/messages" />
      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
        Select a conversation
      </div>
    </div>
  )
}
```

```typescript
// src/app/(vendor)/vendor/messages/[conversationId]/page.tsx
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ConversationList } from '@/components/messages/ConversationList'
import { MessageThread } from '@/components/messages/MessageThread'

export default async function VendorConversationPage({ params }: { params: Promise<{ conversationId: string }> }) {
  const session = await auth()
  if (!session) redirect('/login')

  const { conversationId } = await params

  return (
    <div className="flex h-[calc(100vh-4rem)] -mx-8 -my-6">
      <ConversationList role="vendor" basePath="/vendor/messages" />
      <div className="flex-1">
        <MessageThread
          conversationId={conversationId}
          currentUserRole="vendor"
          currentUserId={session.user.id}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/messages/ src/app/\(customer\)/messages/ src/app/\(vendor\)/vendor/messages/
git commit -m "feat: add in-platform messaging with 5s polling, unread badge, and conversation UI"
git push
```

---

### Task 3: Conversation creation utility

The Match page should auto-create a Conversation when a quote is accepted or when the customer first messages. Add a helper and the POST conversations route.

**Files:**
- Create: `src/lib/conversations.ts`, `src/app/api/conversations/route.ts` (add POST)

- [ ] **Step 1: Add POST to conversations route**

Add to `src/app/api/conversations/route.ts`:

```typescript
// Append to src/app/api/conversations/route.ts
import { NextRequest } from 'next/server'
import { z } from 'zod'

const createSchema = z.object({
  match_id: z.string(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const match = await prisma.match.findFirst({
    where: {
      id: parsed.data.match_id,
      event_request: { event: { customer_id: session.user.id } },
    },
  })
  if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 })

  // Upsert: one conversation per match
  const conversation = await prisma.conversation.upsert({
    where: { match_id: match.id },
    update: {},
    create: {
      match_id: match.id,
      customer_id: session.user.id,
      vendor_id: match.vendor_id,
    },
  })

  return NextResponse.json(conversation, { status: 201 })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/conversations/route.ts
git commit -m "feat: add POST /api/conversations to create conversation from a match"
git push
```

---

### Task 4: Reviews API

**Files:**
- Create: `src/app/api/reviews/route.ts`, `src/app/api/reviews/[id]/reply/route.ts`

- [ ] **Step 1: Write reviews POST route**

```typescript
// src/app/api/reviews/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createSchema = z.object({
  vendor_id: z.string(),
  event_id: z.string(),
  overall_rating: z.number().int().min(1).max(5),
  food_quality_rating: z.number().int().min(1).max(5).optional(),
  service_rating: z.number().int().min(1).max(5).optional(),
  value_rating: z.number().int().min(1).max(5).optional(),
  title: z.string().max(120).optional(),
  body: z.string().max(2000).optional(),
  event_type: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.flatten() }, { status: 400 })
  }

  // Gate: event must be in the past
  const event = await prisma.event.findFirst({
    where: { id: parsed.data.event_id, customer_id: session.user.id },
  })
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  if (event.event_date > new Date()) {
    return NextResponse.json({ error: 'Reviews can only be submitted after the event date' }, { status: 422 })
  }

  // Prevent duplicate reviews for the same event+vendor
  const existing = await prisma.review.findFirst({
    where: { vendor_id: parsed.data.vendor_id, customer_id: session.user.id, event_id: parsed.data.event_id },
  })
  if (existing) {
    return NextResponse.json({ error: 'You have already reviewed this vendor for this event' }, { status: 409 })
  }

  const review = await prisma.review.create({
    data: {
      ...parsed.data,
      customer_id: session.user.id,
      event_date: event.event_date,
      is_verified: true,  // Verified because we confirmed event ownership
    },
  })

  return NextResponse.json(review, { status: 201 })
}
```

- [ ] **Step 2: Write vendor reply route**

```typescript
// src/app/api/reviews/[id]/reply/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const replySchema = z.object({
  vendor_reply: z.string().min(1).max(1000),
})

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'vendor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const review = await prisma.review.findFirst({
    where: { id, vendor_id: session.user.id },
  })
  if (!review) return NextResponse.json({ error: 'Review not found' }, { status: 404 })

  if (review.vendor_reply) {
    return NextResponse.json({ error: 'A reply has already been submitted' }, { status: 409 })
  }

  const body = await req.json()
  const parsed = replySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const updated = await prisma.review.update({
    where: { id },
    data: { vendor_reply: parsed.data.vendor_reply },
  })

  return NextResponse.json(updated)
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/reviews/
git commit -m "feat: add reviews API — gated by event date, vendor reply endpoint"
git push
```

---

### Task 5: Hidden feedback API + form

**Files:**
- Create: `src/app/api/feedback/hidden/route.ts`, `src/components/reviews/HiddenFeedbackForm.tsx`

- [ ] **Step 1: Write hidden feedback POST route**

```typescript
// src/app/api/feedback/hidden/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  vendor_id: z.string(),
  event_request_id: z.string(),
  match_id: z.string(),
  would_recommend: z.boolean(),
  communication_score: z.number().int().min(1).max(5),
  professionalism_score: z.number().int().min(1).max(5),
  quote_accuracy: z.number().int().min(1).max(5),
  overall_experience: z.number().int().min(1).max(5),
  notes: z.string().max(1000).optional(),
  booked_offline: z.boolean().default(false),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.flatten() }, { status: 400 })
  }

  // Gate: event must be past
  const eventRequest = await prisma.eventRequest.findFirst({
    where: { id: parsed.data.event_request_id, event: { customer_id: session.user.id } },
    include: { event: { select: { event_date: true } } },
  })
  if (!eventRequest) return NextResponse.json({ error: 'Event request not found' }, { status: 404 })
  if (eventRequest.event.event_date > new Date()) {
    return NextResponse.json({ error: 'Feedback can only be submitted after the event' }, { status: 422 })
  }

  // Prevent duplicates
  const existing = await prisma.hiddenFeedback.findFirst({
    where: {
      vendor_id: parsed.data.vendor_id,
      customer_id: session.user.id,
      event_request_id: parsed.data.event_request_id,
    },
  })
  if (existing) return NextResponse.json({ error: 'Feedback already submitted' }, { status: 409 })

  const feedback = await prisma.hiddenFeedback.create({
    data: { ...parsed.data, customer_id: session.user.id },
  })

  return NextResponse.json(feedback, { status: 201 })
}
```

- [ ] **Step 2: Write HiddenFeedbackForm component**

```typescript
// src/components/reviews/HiddenFeedbackForm.tsx
'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

type Props = {
  vendorId: string
  vendorName: string
  eventRequestId: string
  matchId: string
  onSubmitted: () => void
}

function StarRating({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <Label className="w-48 text-sm text-gray-600">{label}</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`text-xl transition-colors ${n <= value ? 'text-yellow-400' : 'text-gray-200 hover:text-yellow-300'}`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  )
}

export function HiddenFeedbackForm({ vendorId, vendorName, eventRequestId, matchId, onSubmitted }: Props) {
  const [form, setForm] = useState({
    communication_score: 0,
    professionalism_score: 0,
    quote_accuracy: 0,
    overall_experience: 0,
    would_recommend: true,
    booked_offline: false,
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.communication_score === 0 || form.overall_experience === 0) {
      setError('Please fill in all ratings.')
      return
    }
    setSubmitting(true)
    setError('')
    const res = await fetch('/api/feedback/hidden', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vendor_id: vendorId, event_request_id: eventRequestId, match_id: matchId, ...form }),
    })
    setSubmitting(false)
    if (res.ok) onSubmitted()
    else {
      const data = await res.json()
      setError(data.error ?? 'Failed to submit feedback.')
    }
  }

  return (
    <div className="bg-white rounded-xl border p-6 max-w-lg">
      <div className="mb-4">
        <h3 className="font-semibold text-gray-900">Private Feedback</h3>
        <p className="text-sm text-gray-500 mt-1">
          This feedback about <strong>{vendorName}</strong> is completely private — only used to improve our matching.
          It will never be shown publicly.
        </p>
      </div>

      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <StarRating label="Communication" value={form.communication_score} onChange={v => setForm(f => ({ ...f, communication_score: v }))} />
        <StarRating label="Professionalism" value={form.professionalism_score} onChange={v => setForm(f => ({ ...f, professionalism_score: v }))} />
        <StarRating label="Quote accuracy" value={form.quote_accuracy} onChange={v => setForm(f => ({ ...f, quote_accuracy: v }))} />
        <StarRating label="Overall experience" value={form.overall_experience} onChange={v => setForm(f => ({ ...f, overall_experience: v }))} />

        <div className="flex items-center justify-between py-2">
          <Label className="text-sm text-gray-600">Would you recommend this vendor?</Label>
          <Switch checked={form.would_recommend} onCheckedChange={v => setForm(f => ({ ...f, would_recommend: v }))} />
        </div>

        <div className="flex items-center justify-between py-2">
          <div>
            <Label className="text-sm text-gray-600">Did you book them outside Bhoj?</Label>
            <p className="text-xs text-gray-400">Helps us improve the matching</p>
          </div>
          <Switch checked={form.booked_offline} onCheckedChange={v => setForm(f => ({ ...f, booked_offline: v }))} />
        </div>

        <div className="space-y-1">
          <Label className="text-sm text-gray-600">Any other notes? <span className="text-gray-400">(optional)</span></Label>
          <Textarea
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Anything else we should know…"
            rows={3}
          />
        </div>

        <Button type="submit" disabled={submitting} className="w-full bg-orange-600 hover:bg-orange-700">
          {submitting ? 'Submitting…' : 'Submit Private Feedback'}
        </Button>
      </form>
    </div>
  )
}
```

- [ ] **Step 3: Write ReviewForm component**

```typescript
// src/components/reviews/ReviewForm.tsx
'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

type Props = {
  vendorId: string
  vendorName: string
  eventId: string
  eventType: string
  onSubmitted: () => void
}

function StarPicker({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <Label className="w-36 text-sm text-gray-600">{label}</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`text-2xl ${n <= value ? 'text-yellow-400' : 'text-gray-200 hover:text-yellow-300'}`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  )
}

export function ReviewForm({ vendorId, vendorName, eventId, eventType, onSubmitted }: Props) {
  const [form, setForm] = useState({
    overall_rating: 0,
    food_quality_rating: 0,
    service_rating: 0,
    value_rating: 0,
    title: '',
    body: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.overall_rating === 0) { setError('Overall rating is required.'); return }
    setSubmitting(true)
    setError('')
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vendor_id: vendorId,
        event_id: eventId,
        event_type: eventType,
        ...form,
      }),
    })
    setSubmitting(false)
    if (res.ok) onSubmitted()
    else {
      const data = await res.json()
      setError(data.error ?? 'Failed to submit review.')
    }
  }

  return (
    <div className="bg-white rounded-xl border p-6 max-w-lg">
      <h3 className="font-semibold text-gray-900 mb-4">Review {vendorName}</h3>
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <StarPicker label="Overall *" value={form.overall_rating} onChange={v => setForm(f => ({ ...f, overall_rating: v }))} />
        <StarPicker label="Food quality" value={form.food_quality_rating} onChange={v => setForm(f => ({ ...f, food_quality_rating: v }))} />
        <StarPicker label="Service" value={form.service_rating} onChange={v => setForm(f => ({ ...f, service_rating: v }))} />
        <StarPicker label="Value" value={form.value_rating} onChange={v => setForm(f => ({ ...f, value_rating: v }))} />
        <div className="space-y-1">
          <Label>Title</Label>
          <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Brief summary" />
        </div>
        <div className="space-y-1">
          <Label>Your review</Label>
          <Textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} rows={4} placeholder="Share your experience…" />
        </div>
        <Button type="submit" disabled={submitting} className="w-full bg-orange-600 hover:bg-orange-700">
          {submitting ? 'Submitting…' : 'Submit Review'}
        </Button>
      </form>
    </div>
  )
}
```

- [ ] **Step 4: Write vendor reviews page**

```typescript
// src/app/(vendor)/vendor/reviews/page.tsx
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { ReviewCard } from '@/components/reviews/ReviewCard'

export default async function VendorReviewsPage() {
  const session = await auth()
  if (!session || (session.user as any).role !== 'vendor') redirect('/login')

  const reviews = await prisma.review.findMany({
    where: { vendor_id: session.user.id, is_published: true },
    include: { customer: { select: { name: true } } },
    orderBy: { created_at: 'desc' },
  })

  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.overall_rating, 0) / reviews.length
    : null

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
          {avgRating && (
            <p className="text-gray-500 mt-1">
              Average: <strong className="text-orange-600">{avgRating.toFixed(1)}</strong> / 5 ({reviews.length} reviews)
            </p>
          )}
        </div>
      </div>
      <div className="space-y-4">
        {reviews.map(review => (
          <ReviewCard key={review.id} review={review as any} isVendorView={true} />
        ))}
        {reviews.length === 0 && (
          <p className="text-gray-400 text-center py-12">No reviews yet.</p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Write ReviewCard component**

```typescript
// src/components/reviews/ReviewCard.tsx
'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Star } from 'lucide-react'
import { format } from 'date-fns'

type Review = {
  id: string; overall_rating: number; food_quality_rating: number | null
  service_rating: number | null; value_rating: number | null
  title: string | null; body: string | null; event_type: string | null
  event_date: Date | null; vendor_reply: string | null; is_verified: boolean
  created_at: Date; customer: { name: string }
}

type Props = { review: Review; isVendorView?: boolean }

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={`h-4 w-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
      ))}
    </div>
  )
}

export function ReviewCard({ review, isVendorView }: Props) {
  const [replyText, setReplyText] = useState('')
  const [showReplyBox, setShowReplyBox] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [reply, setReply] = useState(review.vendor_reply)

  async function submitReply() {
    if (!replyText.trim()) return
    setSubmitting(true)
    const res = await fetch(`/api/reviews/${review.id}/reply`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vendor_reply: replyText }),
    })
    if (res.ok) {
      setReply(replyText)
      setShowReplyBox(false)
    }
    setSubmitting(false)
  }

  return (
    <div className="bg-white rounded-xl border p-5">
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2">
            <Stars rating={review.overall_rating} />
            {review.is_verified && (
              <Badge className="bg-green-50 text-green-700 border-green-200 text-xs">Verified</Badge>
            )}
          </div>
          <p className="font-medium text-gray-900 mt-1">{review.customer.name}</p>
          {review.event_type && <p className="text-xs text-gray-400">{review.event_type}</p>}
        </div>
        <span className="text-xs text-gray-400">{format(new Date(review.created_at), 'd MMM yyyy')}</span>
      </div>

      {(review.food_quality_rating || review.service_rating || review.value_rating) && (
        <div className="flex gap-4 text-xs text-gray-500 mb-3">
          {review.food_quality_rating && <span>Food: {review.food_quality_rating}/5</span>}
          {review.service_rating && <span>Service: {review.service_rating}/5</span>}
          {review.value_rating && <span>Value: {review.value_rating}/5</span>}
        </div>
      )}

      {review.title && <p className="font-medium text-gray-800 mb-1">{review.title}</p>}
      {review.body && <p className="text-sm text-gray-600">{review.body}</p>}

      {reply && (
        <div className="mt-3 pl-4 border-l-2 border-orange-200">
          <p className="text-xs text-orange-700 font-medium mb-1">Vendor response</p>
          <p className="text-sm text-gray-600">{reply}</p>
        </div>
      )}

      {isVendorView && !reply && !showReplyBox && (
        <Button size="sm" variant="outline" className="mt-3" onClick={() => setShowReplyBox(true)}>
          Reply
        </Button>
      )}

      {isVendorView && showReplyBox && (
        <div className="mt-3 space-y-2">
          <Textarea
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            placeholder="Write your response…"
            rows={3}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={submitReply} disabled={submitting} className="bg-orange-600 hover:bg-orange-700">
              {submitting ? 'Posting…' : 'Post Reply'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowReplyBox(false)}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add src/app/api/feedback/ src/components/reviews/ src/app/\(vendor\)/vendor/reviews/
git commit -m "feat: add reviews system, vendor reply, hidden feedback form, and vendor reviews page"
git push
```

---
