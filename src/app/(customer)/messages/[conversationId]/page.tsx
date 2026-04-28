import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ConversationList } from '@/components/messages/ConversationList'
import { MessageThread } from '@/components/messages/MessageThread'

export default async function CustomerConversationPage({ params }: { params: Promise<{ conversationId: string }> }) {
  const session = await auth()
  if (!session) redirect('/login')

  const { conversationId } = await params

  return (
    <div className="flex h-[calc(100vh-4rem)] -mx-6 -my-8">
      <ConversationList role="customer" basePath="/messages" />
      <div className="flex-1">
        <MessageThread
          conversationId={conversationId}
          currentUserRole="customer"
          currentUserId={session.user!.id as string}
        />
      </div>
    </div>
  )
}
