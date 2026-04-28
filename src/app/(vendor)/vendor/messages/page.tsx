import { ConversationList } from '@/components/messages/ConversationList'

export default function VendorMessagesPage() {
  return (
    <div className="flex h-[calc(100vh-4rem)] -mx-6 -my-8">
      <ConversationList role="vendor" basePath="/vendor/messages" />
      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
        Select a conversation
      </div>
    </div>
  )
}
