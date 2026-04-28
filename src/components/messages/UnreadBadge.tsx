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
    const interval = setInterval(fetchCount, 15000)
    return () => clearInterval(interval)
  }, [])

  if (count === 0) return null

  return (
    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold">
      {count > 9 ? '9+' : count}
    </span>
  )
}
