'use client'

const EVENT_TYPES = [
  // Celebrations
  { value: 'wedding',      label: 'Wedding',         emoji: '💍', desc: 'Full wedding celebration' },
  { value: 'engagement',   label: 'Engagement',      emoji: '💑', desc: 'Engagement ceremony & party' },
  { value: 'birthday',     label: 'Birthday',        emoji: '🎂', desc: 'Birthday party' },
  { value: 'graduation',   label: 'Graduation',      emoji: '🎓', desc: 'Graduation party & dinner' },
  { value: 'baby_shower',  label: 'Baby Shower',     emoji: '👶', desc: 'Baby shower celebration' },
  { value: 'get_together', label: 'Get Together',    emoji: '🥂', desc: 'Friends & family gathering' },
  { value: 'farewell',     label: 'Farewell',        emoji: '👋', desc: 'Farewell or leaving party' },
  // Cultural & Religious
  { value: 'diwali',       label: 'Diwali',          emoji: '🪔', desc: 'Diwali celebration' },
  { value: 'eid',          label: 'Eid',             emoji: '🌙', desc: 'Eid celebration' },
  { value: 'navratri',     label: 'Navratri',        emoji: '🎉', desc: 'Navratri garba event' },
  { value: 'holi',         label: 'Holi',            emoji: '🎨', desc: 'Holi party' },
  { value: 'pooja',        label: 'Pooja / Puja',    emoji: '🙏', desc: 'Religious ceremony or pooja' },
  // Professional
  { value: 'corporate',       label: 'Corporate',       emoji: '🏢', desc: 'Company event or dinner' },
  { value: 'business_lunch',  label: 'Business Lunch',  emoji: '🍽️', desc: 'Client lunches & team meals' },
  { value: 'community_event', label: 'Community Event',  emoji: '🏘️', desc: 'Neighbourhood or association event' },
  // Open-ended
  { value: 'other',        label: 'Other / Custom',  emoji: '🎊', desc: 'Tell us what you need' },
]

type Props = { onNext: (eventType: string) => void }

export function Step1EventType({ onNext }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-text-1">What kind of event are you planning?</h2>
        <p className="text-text-4 text-sm mt-1">We'll build a custom planning checklist for you.</p>
      </div>

      {[
        { heading: 'Celebrations', types: EVENT_TYPES.slice(0, 7) },
        { heading: 'Cultural & Religious', types: EVENT_TYPES.slice(7, 12) },
        { heading: 'Professional & Community', types: EVENT_TYPES.slice(12, 15) },
        { heading: 'Other', types: EVENT_TYPES.slice(15) },
      ].map(group => (
        <div key={group.heading}>
          <p className="text-xs font-semibold text-text-4 uppercase tracking-wide mb-2">{group.heading}</p>
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
            {group.types.map(type => (
              <button
                key={type.value}
                onClick={() => onNext(type.value)}
                className="p-3.5 border-2 rounded-xl text-left hover:border-brand hover:bg-cream transition-colors group"
              >
                <span className="text-2xl block mb-1.5">{type.emoji}</span>
                <p className="font-medium text-sm text-text-1 group-hover:text-brand leading-tight">{type.label}</p>
                <p className="text-xs text-text-4 mt-0.5 leading-tight">{type.desc}</p>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
