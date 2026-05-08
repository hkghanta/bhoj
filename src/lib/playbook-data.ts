/**
 * Pre-built event playbooks for South Asian celebrations.
 * Each playbook contains a checklist, sub-events, budget tips, and relevant vendor types.
 *
 * due_offset_days: negative = days BEFORE the main event date; 0 = event day
 * offset_days (sub-events): negative = days before main event; 0 = event day
 */

export interface PlaybookChecklistItem {
  name: string
  due_offset_days: number
}

export interface PlaybookChecklistCategory {
  category: string
  items: PlaybookChecklistItem[]
}

export interface PlaybookSubEvent {
  name: string
  type: string
  offset_days: number
}

export interface PlaybookBudgetTips {
  low: { min: number; max: number }
  mid: { min: number; max: number }
  high: { min: number; max: number }
}

export interface Playbook {
  event_type: string
  name: string
  description: string
  checklist: PlaybookChecklistCategory[]
  sub_events: PlaybookSubEvent[] | null
  budget_tips: PlaybookBudgetTips
  vendor_types: string[]
}

export const PLAYBOOKS: Playbook[] = [
  // ─── WEDDING ──────────────────────────────────────────────────────────
  {
    event_type: 'WEDDING',
    name: 'South Asian Wedding',
    description:
      'A comprehensive multi-day wedding plan covering every detail from mehendi to reception, tailored for South Asian celebrations.',
    checklist: [
      {
        category: 'Venue',
        items: [
          { name: 'Research and shortlist ceremony venues', due_offset_days: -180 },
          { name: 'Book ceremony and reception venues', due_offset_days: -150 },
          { name: 'Confirm venue layout and floor plan', due_offset_days: -45 },
          { name: 'Schedule final venue walkthrough', due_offset_days: -14 },
          { name: 'Confirm AV equipment and mic setup', due_offset_days: -7 },
        ],
      },
      {
        category: 'Catering',
        items: [
          { name: 'Research caterers with South Asian menu experience', due_offset_days: -150 },
          { name: 'Schedule tasting sessions', due_offset_days: -120 },
          { name: 'Finalize menu for all events (mehendi, sangeet, reception)', due_offset_days: -60 },
          { name: 'Confirm guest count and dietary restrictions with caterer', due_offset_days: -21 },
          { name: 'Arrange chai/chaat station for baraat', due_offset_days: -30 },
        ],
      },
      {
        category: 'Decor',
        items: [
          { name: 'Hire decorator and discuss theme/color palette', due_offset_days: -120 },
          { name: 'Finalize mandap and stage design', due_offset_days: -60 },
          { name: 'Order florals for all events', due_offset_days: -30 },
          { name: 'Confirm lighting design and uplighting', due_offset_days: -21 },
          { name: 'Set up decor for mehendi and sangeet spaces', due_offset_days: -2 },
          { name: 'Confirm centerpieces and table runners for reception', due_offset_days: -7 },
        ],
      },
      {
        category: 'Photography',
        items: [
          { name: 'Book photographer and videographer', due_offset_days: -150 },
          { name: 'Create shot list for each event', due_offset_days: -30 },
          { name: 'Plan pre-wedding photoshoot', due_offset_days: -45 },
          { name: 'Confirm drone permit if outdoor ceremony', due_offset_days: -14 },
        ],
      },
      {
        category: 'Entertainment',
        items: [
          { name: 'Book DJ or band for sangeet and reception', due_offset_days: -120 },
          { name: 'Hire dhol player for baraat', due_offset_days: -90 },
          { name: 'Arrange choreographer for sangeet performances', due_offset_days: -75 },
          { name: 'Finalize sangeet performance lineup and music', due_offset_days: -14 },
          { name: 'Confirm playlist and sound check with DJ', due_offset_days: -3 },
        ],
      },
      {
        category: 'Attire',
        items: [
          { name: 'Shop for bridal lehenga or saree', due_offset_days: -150 },
          { name: 'Order groom sherwani or suit', due_offset_days: -120 },
          { name: 'Select outfits for mehendi, sangeet, and reception', due_offset_days: -90 },
          { name: 'Schedule bridal jewelry fitting', due_offset_days: -45 },
          { name: 'Final fitting for all wedding outfits', due_offset_days: -14 },
          { name: 'Arrange wedding-day emergency kit (safety pins, stain remover)', due_offset_days: -3 },
        ],
      },
      {
        category: 'Invitations',
        items: [
          { name: 'Design and order wedding invitations', due_offset_days: -120 },
          { name: 'Mail physical invitations or send digital', due_offset_days: -90 },
          { name: 'Send save-the-dates', due_offset_days: -180 },
          { name: 'Track RSVPs and follow up', due_offset_days: -30 },
        ],
      },
      {
        category: 'Transport',
        items: [
          { name: 'Book horse or vintage car for baraat', due_offset_days: -60 },
          { name: 'Arrange shuttle service for guests between venues', due_offset_days: -30 },
          { name: 'Confirm getaway car for couple', due_offset_days: -7 },
        ],
      },
      {
        category: 'Gifts',
        items: [
          { name: 'Set up gift registry', due_offset_days: -120 },
          { name: 'Order wedding favors for guests', due_offset_days: -45 },
          { name: 'Prepare gifts for bridal party and parents', due_offset_days: -14 },
        ],
      },
      {
        category: 'Logistics',
        items: [
          { name: 'Book pandit or officiant for ceremony', due_offset_days: -120 },
          { name: 'Apply for marriage license', due_offset_days: -30 },
          { name: 'Create day-of timeline and distribute to vendors', due_offset_days: -7 },
          { name: 'Assign family point-of-contact for each event', due_offset_days: -14 },
          { name: 'Confirm hotel room blocks for out-of-town guests', due_offset_days: -90 },
          { name: 'Pack items for wedding ceremony (garlands, coconut, rice)', due_offset_days: -3 },
        ],
      },
    ],
    sub_events: [
      { name: 'Mehendi', type: 'MEHENDI', offset_days: -3 },
      { name: 'Haldi', type: 'HALDI', offset_days: -2 },
      { name: 'Sangeet', type: 'SANGEET', offset_days: -1 },
      { name: 'Baraat', type: 'BARAAT', offset_days: 0 },
      { name: 'Wedding Ceremony', type: 'CEREMONY', offset_days: 0 },
      { name: 'Reception', type: 'RECEPTION', offset_days: 0 },
    ],
    budget_tips: {
      low: { min: 15000, max: 35000 },
      mid: { min: 35000, max: 80000 },
      high: { min: 80000, max: 200000 },
    },
    vendor_types: [
      'CATERER', 'DECORATOR', 'PHOTOGRAPHER', 'VIDEOGRAPHER', 'DJ',
      'MEHENDI_ARTIST', 'MAKEUP_HAIR', 'PANDIT_OFFICIANT', 'TRANSPORT',
      'VENUE', 'LIGHTING', 'FLORIST',
    ],
  },

  // ─── ENGAGEMENT ───────────────────────────────────────────────────────
  {
    event_type: 'ENGAGEMENT',
    name: 'Engagement Ceremony',
    description:
      'A curated plan for a memorable ring ceremony and celebration, blending traditional and modern touches.',
    checklist: [
      {
        category: 'Venue',
        items: [
          { name: 'Choose and book venue (banquet hall or home)', due_offset_days: -90 },
          { name: 'Confirm seating arrangement and capacity', due_offset_days: -21 },
          { name: 'Finalize venue decor walkthrough', due_offset_days: -7 },
        ],
      },
      {
        category: 'Catering',
        items: [
          { name: 'Select caterer and schedule tasting', due_offset_days: -75 },
          { name: 'Finalize menu (appetizers, dinner, dessert)', due_offset_days: -30 },
          { name: 'Confirm final headcount with caterer', due_offset_days: -10 },
        ],
      },
      {
        category: 'Photography',
        items: [
          { name: 'Book photographer for ring ceremony and portraits', due_offset_days: -60 },
          { name: 'Plan couple portrait session', due_offset_days: -14 },
          { name: 'Share shot list with photographer', due_offset_days: -7 },
        ],
      },
      {
        category: 'Rings',
        items: [
          { name: 'Shop for engagement rings', due_offset_days: -60 },
          { name: 'Get rings resized if needed', due_offset_days: -21 },
          { name: 'Pick up rings and confirm engraving', due_offset_days: -7 },
        ],
      },
      {
        category: 'Decor',
        items: [
          { name: 'Hire decorator and choose color theme', due_offset_days: -60 },
          { name: 'Order floral arrangements and stage backdrop', due_offset_days: -21 },
          { name: 'Set up ring ceremony stage and photo area', due_offset_days: -1 },
        ],
      },
      {
        category: 'Attire',
        items: [
          { name: 'Select outfit for the couple', due_offset_days: -45 },
          { name: 'Book makeup and hair stylist', due_offset_days: -30 },
          { name: 'Final fitting', due_offset_days: -7 },
        ],
      },
    ],
    sub_events: null,
    budget_tips: {
      low: { min: 3000, max: 8000 },
      mid: { min: 8000, max: 20000 },
      high: { min: 20000, max: 50000 },
    },
    vendor_types: ['CATERER', 'PHOTOGRAPHER', 'DECORATOR', 'VENUE'],
  },

  // ─── BIRTHDAY ─────────────────────────────────────────────────────────
  {
    event_type: 'BIRTHDAY',
    name: 'Birthday Party',
    description:
      'Everything you need to throw an unforgettable birthday celebration, from venue to cake to entertainment.',
    checklist: [
      {
        category: 'Venue',
        items: [
          { name: 'Decide on venue (home, restaurant, or event space)', due_offset_days: -60 },
          { name: 'Book venue and confirm date', due_offset_days: -45 },
          { name: 'Confirm parking and accessibility', due_offset_days: -7 },
        ],
      },
      {
        category: 'Catering',
        items: [
          { name: 'Choose caterer or plan menu', due_offset_days: -45 },
          { name: 'Schedule tasting if using caterer', due_offset_days: -30 },
          { name: 'Confirm final menu and headcount', due_offset_days: -10 },
          { name: 'Arrange beverages and bar setup', due_offset_days: -14 },
        ],
      },
      {
        category: 'Entertainment',
        items: [
          { name: 'Book DJ or live entertainment', due_offset_days: -45 },
          { name: 'Plan party games or activities', due_offset_days: -21 },
          { name: 'Confirm playlist and sound equipment', due_offset_days: -3 },
        ],
      },
      {
        category: 'Decor',
        items: [
          { name: 'Choose party theme and color scheme', due_offset_days: -30 },
          { name: 'Order balloons, banners, and tableware', due_offset_days: -14 },
          { name: 'Set up decorations at venue', due_offset_days: -1 },
        ],
      },
      {
        category: 'Cake',
        items: [
          { name: 'Order custom birthday cake', due_offset_days: -21 },
          { name: 'Confirm cake design and flavor', due_offset_days: -14 },
          { name: 'Arrange cake pickup or delivery', due_offset_days: -1 },
        ],
      },
      {
        category: 'Invitations',
        items: [
          { name: 'Create and send invitations', due_offset_days: -30 },
          { name: 'Track RSVPs', due_offset_days: -10 },
          { name: 'Send reminder to guests', due_offset_days: -3 },
        ],
      },
    ],
    sub_events: null,
    budget_tips: {
      low: { min: 500, max: 2000 },
      mid: { min: 2000, max: 8000 },
      high: { min: 8000, max: 25000 },
    },
    vendor_types: ['CATERER', 'DJ', 'DECORATOR', 'CAKE_VENDOR', 'PHOTOGRAPHER'],
  },

  // ─── BABY SHOWER ──────────────────────────────────────────────────────
  {
    event_type: 'BABY_SHOWER',
    name: 'Baby Shower',
    description:
      'A warm celebration to welcome the new arrival, complete with food, games, and thoughtful touches.',
    checklist: [
      {
        category: 'Venue',
        items: [
          { name: 'Choose venue (home, restaurant, or event space)', due_offset_days: -45 },
          { name: 'Confirm seating and accessibility for guests', due_offset_days: -14 },
          { name: 'Finalize venue logistics', due_offset_days: -7 },
        ],
      },
      {
        category: 'Catering',
        items: [
          { name: 'Plan menu or book caterer', due_offset_days: -30 },
          { name: 'Finalize menu with dietary considerations', due_offset_days: -14 },
          { name: 'Confirm headcount and arrange serving ware', due_offset_days: -7 },
        ],
      },
      {
        category: 'Decor',
        items: [
          { name: 'Pick a theme (gender reveal, storybook, etc.)', due_offset_days: -30 },
          { name: 'Order decorations, balloons, and centerpieces', due_offset_days: -14 },
          { name: 'Set up photo backdrop and diaper cake display', due_offset_days: -1 },
        ],
      },
      {
        category: 'Games',
        items: [
          { name: 'Plan shower games (baby bingo, name game, etc.)', due_offset_days: -21 },
          { name: 'Buy game supplies and prizes', due_offset_days: -10 },
          { name: 'Print game cards and set up stations', due_offset_days: -1 },
        ],
      },
      {
        category: 'Gifts',
        items: [
          { name: 'Set up baby registry', due_offset_days: -60 },
          { name: 'Order party favors for guests', due_offset_days: -14 },
          { name: 'Prepare thank-you cards', due_offset_days: 0 },
        ],
      },
      {
        category: 'Invitations',
        items: [
          { name: 'Design and send invitations', due_offset_days: -30 },
          { name: 'Track RSVPs', due_offset_days: -10 },
          { name: 'Send reminder with parking/directions', due_offset_days: -3 },
        ],
      },
    ],
    sub_events: null,
    budget_tips: {
      low: { min: 300, max: 1500 },
      mid: { min: 1500, max: 5000 },
      high: { min: 5000, max: 15000 },
    },
    vendor_types: ['CATERER', 'DECORATOR', 'PHOTOGRAPHER'],
  },

  // ─── ANNIVERSARY ──────────────────────────────────────────────────────
  {
    event_type: 'ANNIVERSARY',
    name: 'Anniversary Celebration',
    description:
      'Celebrate a milestone anniversary in style with a beautifully planned dinner or party.',
    checklist: [
      {
        category: 'Venue',
        items: [
          { name: 'Select venue (restaurant, banquet hall, or home)', due_offset_days: -60 },
          { name: 'Book venue and confirm date', due_offset_days: -45 },
          { name: 'Final walkthrough and seating plan', due_offset_days: -7 },
        ],
      },
      {
        category: 'Catering',
        items: [
          { name: 'Hire caterer or plan menu', due_offset_days: -45 },
          { name: 'Finalize menu with couple\'s favorite dishes', due_offset_days: -21 },
          { name: 'Arrange anniversary cake', due_offset_days: -14 },
          { name: 'Confirm final guest count', due_offset_days: -7 },
        ],
      },
      {
        category: 'Photography',
        items: [
          { name: 'Book photographer', due_offset_days: -45 },
          { name: 'Plan photo slideshow of milestones', due_offset_days: -14 },
          { name: 'Share shot list and key moments', due_offset_days: -7 },
        ],
      },
      {
        category: 'Entertainment',
        items: [
          { name: 'Book live musician or DJ', due_offset_days: -45 },
          { name: 'Prepare speeches or tribute video', due_offset_days: -14 },
          { name: 'Confirm music and AV setup', due_offset_days: -3 },
        ],
      },
      {
        category: 'Decor',
        items: [
          { name: 'Choose theme and color palette', due_offset_days: -30 },
          { name: 'Order flowers and table arrangements', due_offset_days: -14 },
          { name: 'Set up memory wall or photo display', due_offset_days: -1 },
        ],
      },
    ],
    sub_events: null,
    budget_tips: {
      low: { min: 1000, max: 5000 },
      mid: { min: 5000, max: 15000 },
      high: { min: 15000, max: 50000 },
    },
    vendor_types: ['CATERER', 'PHOTOGRAPHER', 'DJ', 'DECORATOR', 'VENUE'],
  },

  // ─── GRADUATION ───────────────────────────────────────────────────────
  {
    event_type: 'GRADUATION',
    name: 'Graduation Party',
    description:
      'A fun celebration to honor the graduate with family and friends.',
    checklist: [
      {
        category: 'Venue',
        items: [
          { name: 'Decide on venue (backyard, restaurant, or hall)', due_offset_days: -45 },
          { name: 'Book venue and confirm date', due_offset_days: -30 },
          { name: 'Confirm layout for buffet and seating', due_offset_days: -7 },
        ],
      },
      {
        category: 'Catering',
        items: [
          { name: 'Plan menu or hire caterer', due_offset_days: -30 },
          { name: 'Order graduation cake', due_offset_days: -14 },
          { name: 'Confirm final headcount and dietary needs', due_offset_days: -7 },
          { name: 'Arrange drinks and beverage station', due_offset_days: -7 },
        ],
      },
      {
        category: 'Decor',
        items: [
          { name: 'Choose school-colors theme', due_offset_days: -21 },
          { name: 'Order banners, balloons, and cap-and-gown props', due_offset_days: -14 },
          { name: 'Set up achievement display (photos, diplomas)', due_offset_days: -1 },
        ],
      },
      {
        category: 'Invitations',
        items: [
          { name: 'Design and send party invitations', due_offset_days: -30 },
          { name: 'Track RSVPs', due_offset_days: -10 },
          { name: 'Send reminder with venue details', due_offset_days: -3 },
        ],
      },
    ],
    sub_events: null,
    budget_tips: {
      low: { min: 500, max: 2000 },
      mid: { min: 2000, max: 7000 },
      high: { min: 7000, max: 20000 },
    },
    vendor_types: ['CATERER', 'DECORATOR', 'PHOTOGRAPHER'],
  },
]
