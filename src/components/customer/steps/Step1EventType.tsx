'use client'

const EVENT_TYPES = [
  { value: 'wedding', label: 'Wedding', emoji: '💍', desc: 'Full wedding celebration' },
  { value: 'engagement', label: 'Engagement', emoji: '💑', desc: 'Engagement ceremony & party' },
  { value: 'birthday', label: 'Birthday', emoji: '🎂', desc: 'Birthday party' },
  { value: 'corporate', label: 'Corporate', emoji: '🏢', desc: 'Company event or dinner' },
  { value: 'diwali', label: 'Diwali', emoji: '🪔', desc: 'Diwali celebration' },
  { value: 'eid', label: 'Eid', emoji: '🌙', desc: 'Eid celebration' },
  { value: 'navratri', label: 'Navratri', emoji: '🎉', desc: 'Navratri garba event' },
  { value: 'holi', label: 'Holi', emoji: '🎨', desc: 'Holi party' },
  { value: 'other', label: 'Other', emoji: '🎊', desc: 'Custom event' },
]

type Props = { onNext: (eventType: string) => void }

export function Step1EventType({ onNext }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">What kind of event are you planning?</h2>
        <p className="text-gray-500 text-sm mt-1">We'll build a custom planning checklist for you.</p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {EVENT_TYPES.map(type => (
          <button
            key={type.value}
            onClick={() => onNext(type.value)}
            className="p-4 border-2 rounded-xl text-left hover:border-orange-400 hover:bg-orange-50 transition-colors group"
          >
            <span className="text-2xl block mb-2">{type.emoji}</span>
            <p className="font-medium text-gray-900 group-hover:text-orange-700">{type.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{type.desc}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
