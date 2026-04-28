'use client'
import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Upload, Trash2, Star } from 'lucide-react'
import Image from 'next/image'

type Photo = { id: string; url: string; caption: string | null; is_cover: boolean; sort_order: number }

export default function PhotosPage() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/vendor/photos').then(r => r.json()).then(setPhotos)
  }, [])

  async function handleUpload(file: File) {
    setUploading(true)
    try {
      const sigRes = await fetch('/api/vendor/upload-signature')
      const { signature, timestamp, folder, cloud_name, api_key } = await sigRes.json()

      const formData = new FormData()
      formData.append('file', file)
      formData.append('signature', signature)
      formData.append('timestamp', String(timestamp))
      formData.append('folder', folder)
      formData.append('api_key', api_key)

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`,
        { method: 'POST', body: formData }
      )
      const uploadData = await uploadRes.json()

      const photoRes = await fetch('/api/vendor/photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: uploadData.secure_url, is_cover: photos.length === 0 }),
      })
      const newPhoto = await photoRes.json()
      setPhotos(p => [...p, newPhoto])
    } finally {
      setUploading(false)
    }
  }

  async function deletePhoto(id: string) {
    await fetch(`/api/vendor/photos/${id}`, { method: 'DELETE' })
    setPhotos(p => p.filter(ph => ph.id !== id))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Photos</h1>
          <p className="text-gray-500 mt-1">Showcase your food and events. First photo is your cover image.</p>
        </div>
        <Button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="bg-orange-600 hover:bg-orange-700"
        >
          <Upload className="h-4 w-4 mr-2" />
          {uploading ? 'Uploading…' : 'Upload Photo'}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0])}
        />
      </div>

      {photos.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-16 text-center">
          <p className="text-gray-400">No photos yet. Upload your first photo to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {photos.map(photo => (
            <div key={photo.id} className="relative group rounded-xl overflow-hidden border">
              <div className="aspect-video relative">
                <Image src={photo.url} alt={photo.caption ?? ''} fill className="object-cover" />
              </div>
              {photo.is_cover && (
                <Badge className="absolute top-2 left-2 bg-orange-600">
                  <Star className="h-3 w-3 mr-1" /> Cover
                </Badge>
              )}
              <button
                onClick={() => deletePhoto(photo.id)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-red-600 text-white rounded-full p-1.5 transition-opacity"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
