'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus } from 'lucide-react'

type Props = {
  eventId: string
}

const CATEGORIES = [
  'Food & Drink', 'Venue & Decor', 'Entertainment', 'Photography',
  'Beauty & Wellness', 'Ceremony', 'Admin', 'Other'
]

export function AddChecklistItemDialog({ eventId }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'external' | 'custom'>('external')
  const [form, setForm] = useState({
    item_name: '', category: '', external_vendor_name: '',
    external_vendor_phone: '', external_vendor_email: '',
  })
  const [saving, setSaving] = useState(false)

  async function handleAdd() {
    if (!form.item_name || !form.category) return
    setSaving(true)
    await fetch(`/api/events/${eventId}/checklist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    setOpen(false)
    setForm({ item_name: '', category: '', external_vendor_name: '', external_vendor_phone: '', external_vendor_email: '' })
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className="inline-flex items-center gap-1 px-3 py-1.5 border rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        <Plus className="h-4 w-4" /> Add item
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add checklist item</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex rounded-lg border overflow-hidden">
            <button
              className={`flex-1 py-2 text-sm font-medium ${mode === 'external' ? 'bg-orange-600 text-white' : 'text-gray-600'}`}
              onClick={() => setMode('external')}
            >External Vendor</button>
            <button
              className={`flex-1 py-2 text-sm font-medium ${mode === 'custom' ? 'bg-orange-600 text-white' : 'text-gray-600'}`}
              onClick={() => setMode('custom')}
            >Custom Item</button>
          </div>

          <div className="space-y-1">
            <Label>Item / Service name *</Label>
            <Input value={form.item_name} onChange={e => setForm(f => ({ ...f, item_name: e.target.value }))} placeholder="e.g. Sound system hire" />
          </div>

          <div className="space-y-1">
            <Label>Category *</Label>
            <Select value={form.category} onValueChange={(v: string | null) => setForm(f => ({ ...f, category: v ?? '' }))}>
              <SelectTrigger><SelectValue placeholder="Select category…" /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {mode === 'external' && (
            <>
              <div className="space-y-1">
                <Label>Vendor name</Label>
                <Input value={form.external_vendor_name} onChange={e => setForm(f => ({ ...f, external_vendor_name: e.target.value }))} placeholder="ABC Catering Ltd" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Phone</Label>
                  <Input value={form.external_vendor_phone} onChange={e => setForm(f => ({ ...f, external_vendor_phone: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Email</Label>
                  <Input type="email" value={form.external_vendor_email} onChange={e => setForm(f => ({ ...f, external_vendor_email: e.target.value }))} />
                </div>
              </div>
            </>
          )}

          <Button onClick={handleAdd} disabled={saving} className="w-full bg-orange-600 hover:bg-orange-700">
            {saving ? 'Adding…' : 'Add to checklist'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
