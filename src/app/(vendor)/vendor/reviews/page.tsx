import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { ReviewCard } from '@/components/reviews/ReviewCard'

export default async function VendorReviewsPage() {
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== 'vendor') redirect('/login')

  const reviews = await prisma.review.findMany({
    where: { vendor_id: (session.user!.id as string), is_published: true },
    include: { customer: { select: { name: true } } },
    orderBy: { created_at: 'desc' },
  })

  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.overall_rating, 0) / reviews.length
    : null

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-text-1">Reviews</h1>
        {avgRating && (
          <p className="text-text-4 mt-1">
            Average: <strong className="text-brand">{avgRating.toFixed(1)}</strong> / 5 ({reviews.length} reviews)
          </p>
        )}
      </div>
      <div className="space-y-5">
        {reviews.map(review => (
          <ReviewCard key={review.id} review={review as any} isVendorView={true} />
        ))}
        {reviews.length === 0 && (
          <p className="text-base text-text-4 text-center py-16">No reviews yet.</p>
        )}
      </div>
    </div>
  )
}
