'use client'
import { useState } from 'react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Star } from 'lucide-react'
import { format } from 'date-fns'

type Review = {
  id: string; overall_rating: number; food_quality_rating: number | null
  service_rating: number | null; value_rating: number | null
  title: string | null; body: string | null; event_type: string | null
  event_date: Date | string | null; vendor_reply: string | null; is_verified: boolean
  created_at: Date | string; customer: { name: string }
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
        <button
          onClick={() => setShowReplyBox(true)}
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'mt-3')}
        >
          Reply
        </button>
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
            <button
              onClick={submitReply}
              disabled={submitting}
              className={cn(buttonVariants({ size: 'sm' }), 'bg-orange-600 hover:bg-orange-700 disabled:opacity-50')}
            >
              {submitting ? 'Posting…' : 'Post Reply'}
            </button>
            <button
              onClick={() => setShowReplyBox(false)}
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
