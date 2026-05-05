'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Heart, MapPin, Star, Building2, Loader2 } from 'lucide-react'
import { BadgesList } from '@/components/vendor/BadgesList'

type FavoriteVendor = {
  id: string
  vendor_id: string
  vendor: {
    id: string
    business_name: string
    vendor_type: string
    city: string
    profile_photo_url: string | null
  }
}

export function FavoritesGrid() {
  const [favorites, setFavorites] = useState<FavoriteVendor[]>([])
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState<string | null>(null)

  async function fetchFavorites() {
    setLoading(true)
    try {
      const res = await fetch('/api/favorites')
      if (!res.ok) throw new Error('Failed to load')
      setFavorites(await res.json())
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFavorites()
  }, [])

  async function handleUnfavorite(vendorId: string) {
    setRemoving(vendorId)
    try {
      const res = await fetch(`/api/favorites/${vendorId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to remove')
      setFavorites(prev => prev.filter(f => f.vendor_id !== vendorId))
    } catch {
      // silently fail
    } finally {
      setRemoving(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-text-4" />
      </div>
    )
  }

  if (favorites.length === 0) {
    return (
      <div className="text-center py-16 border-2 border-dashed rounded-xl">
        <Heart className="h-10 w-10 text-text-4 mx-auto mb-3" />
        <p className="text-text-4">No favorites yet. Browse vendors to save your favorites!</p>
      </div>
    )
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {favorites.map(fav => (
        <div
          key={fav.id}
          className="bg-white dark:bg-cream-2 rounded-2xl border border-brand-border p-6 shadow-sm flex flex-col hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between mb-3">
            <Link href={`/vendors/${fav.vendor.id}`} className="flex items-start gap-3 min-w-0 flex-1">
              {fav.vendor.profile_photo_url ? (
                <img
                  src={fav.vendor.profile_photo_url}
                  alt={fav.vendor.business_name}
                  className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-cream flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-6 w-6 text-brand" />
                </div>
              )}
              <div className="min-w-0">
                <h3 className="font-bold text-text-1 text-sm truncate">
                  {fav.vendor.business_name}
                </h3>
                <p className="text-xs text-text-4 mt-0.5">
                  {fav.vendor.vendor_type.replace(/_/g, ' ')}
                </p>
              </div>
            </Link>
            <button
              onClick={() => handleUnfavorite(fav.vendor_id)}
              disabled={removing === fav.vendor_id}
              className="p-1.5 rounded-xl hover:bg-red-50 transition-colors flex-shrink-0"
              title="Remove from favorites"
            >
              <Heart
                className={`h-5 w-5 ${
                  removing === fav.vendor_id
                    ? 'text-text-4 animate-pulse'
                    : 'text-red-500 fill-red-500'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center gap-1 text-xs text-text-4 mb-3">
            <MapPin className="h-3 w-3" />
            <span>{fav.vendor.city}</span>
          </div>

          <div className="mt-auto pt-2">
            <BadgesList vendorId={fav.vendor.id} />
          </div>
        </div>
      ))}
    </div>
  )
}
