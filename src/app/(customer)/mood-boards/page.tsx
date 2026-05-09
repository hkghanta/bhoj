import { MoodBoardsManager } from '@/components/customer/MoodBoardsManager'

export default function MoodBoardsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-text-1">Mood Boards</h1>
        <p className="text-text-3 mt-1">
          Collect and organize inspiration for your event.
        </p>
      </div>
      <MoodBoardsManager />
    </div>
  )
}
