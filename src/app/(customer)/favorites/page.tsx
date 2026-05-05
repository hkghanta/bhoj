import { FavoritesGrid } from '@/components/customer/FavoritesGrid'

export default function FavoritesPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-black tracking-tight text-text-1">My Favorites</h1>
        <p className="text-text-3 mt-1">
          Vendors you have saved for quick access.
        </p>
      </div>
      <FavoritesGrid />
    </div>
  )
}
