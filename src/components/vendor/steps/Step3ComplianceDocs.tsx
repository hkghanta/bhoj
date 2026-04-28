'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Upload } from 'lucide-react'

type DocEntry = { doc_type: string; url: string; expires_at?: string }
type Props = { onNext: () => void; onBack: () => void }

const REQUIRED_DOCS = [
  { key: 'food_hygiene', label: 'Food Hygiene Certificate', required: true },
  { key: 'public_liability', label: 'Public Liability Insurance', required: true },
  { key: 'allergen_training', label: 'Allergen Training Certificate', required: false },
  { key: 'halal_cert', label: 'Halal Certificate', required: false },
]

export function Step3ComplianceDocs({ onNext, onBack }: Props) {
  const [docs, setDocs] = useState<Record<string, DocEntry>>({})
  const [uploading, setUploading] = useState<string | null>(null)
  const [profile, setProfile] = useState({ license_number: '', insurance_number: '' })
  const [saving, setSaving] = useState(false)

  async function uploadDoc(doc_type: string, file: File) {
    setUploading(doc_type)
    const sigRes = await fetch('/api/vendor/upload-signature')
    const { signature, timestamp, folder, cloud_name, api_key } = await sigRes.json()

    const formData = new FormData()
    formData.append('file', file)
    formData.append('signature', signature)
    formData.append('timestamp', String(timestamp))
    formData.append('folder', folder)
    formData.append('api_key', api_key)
    formData.append('resource_type', 'auto')

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud_name}/raw/upload`, { method: 'POST', body: formData })
    const data = await res.json()
    setDocs(d => ({ ...d, [doc_type]: { doc_type, url: data.secure_url } }))
    setUploading(null)
  }

  async function handleSave() {
    setSaving(true)
    await fetch('/api/vendor/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    })
    if (Object.keys(docs).length > 0) {
      await fetch('/api/vendor/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents: Object.values(docs) }),
      })
    }
    setSaving(false)
    onNext()
  }

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold text-gray-900">Compliance Documents</h2>
      <p className="text-gray-500 text-sm">
        Upload your certifications. Required documents must be provided before receiving leads.
      </p>

      <div className="space-y-3">
        {REQUIRED_DOCS.map(doc => (
          <div key={doc.key} className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-800">{doc.label}</p>
              {doc.required && <Badge variant="outline" className="text-xs mt-0.5">Required</Badge>}
            </div>
            <div className="flex items-center gap-2">
              {docs[doc.key] ? (
                <span className="flex items-center gap-1.5 text-green-600 text-sm">
                  <CheckCircle2 className="h-4 w-4" /> Uploaded
                </span>
              ) : (
                <label className="cursor-pointer">
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,image/*"
                    disabled={uploading === doc.key}
                    onChange={e => e.target.files?.[0] && uploadDoc(doc.key, e.target.files[0])}
                  />
                  <span className="flex items-center gap-1.5 px-3 py-1.5 border rounded-md text-sm text-gray-600 hover:bg-gray-50 cursor-pointer">
                    <Upload className="h-3.5 w-3.5" />
                    {uploading === doc.key ? 'Uploading…' : 'Upload'}
                  </span>
                </label>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>License / Registration number</Label>
          <Input value={profile.license_number} onChange={e => setProfile(p => ({ ...p, license_number: e.target.value }))} />
        </div>
        <div className="space-y-1">
          <Label>Insurance policy number</Label>
          <Input value={profile.insurance_number} onChange={e => setProfile(p => ({ ...p, insurance_number: e.target.value }))} />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onBack}>← Back</Button>
        <Button onClick={handleSave} disabled={saving} className="flex-1 bg-orange-600 hover:bg-orange-700">
          {saving ? 'Saving…' : 'Save & Continue →'}
        </Button>
      </div>
    </div>
  )
}
