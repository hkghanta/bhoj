'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  Trash2,
  Edit,
  Loader2,
  Copy,
  Check,
} from 'lucide-react'

type Collaborator = {
  id: string
  email: string
  name: string | null
  role: string
  permissions: string
  status: string
  invite_token: string | null
  created_at: string
}

const ROLES = [
  { value: 'PLANNER', label: 'Planner' },
  { value: 'COORDINATOR', label: 'Coordinator' },
  { value: 'VIEWER', label: 'Viewer' },
]

const PERMISSIONS = [
  { value: 'VIEW', label: 'View Only' },
  { value: 'EDIT', label: 'Edit' },
  { value: 'ADMIN', label: 'Admin' },
]

const emptyForm = {
  email: '',
  name: '',
  role: 'PLANNER',
  permissions: 'VIEW',
}

export function CollaboratorsManager({ eventId }: { eventId: string }) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [loading, setLoading] = useState(true)
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [inviteToken, setInviteToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  function showAlert(type: 'success' | 'error', msg: string) {
    setAlert({ type, msg })
    setTimeout(() => setAlert(null), 3000)
  }

  async function fetchCollaborators() {
    setLoading(true)
    try {
      const res = await fetch(`/api/events/${eventId}/collaborators`)
      if (!res.ok) throw new Error('Failed to load')
      setCollaborators(await res.json())
    } catch {
      showAlert('error', 'Failed to load collaborators')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCollaborators()
  }, [])

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setInviteToken(null)
    setDialogOpen(true)
  }

  function openEdit(item: Collaborator) {
    setEditingId(item.id)
    setForm({
      email: item.email,
      name: item.name ?? '',
      role: item.role,
      permissions: item.permissions,
    })
    setInviteToken(null)
    setDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      if (editingId) {
        const res = await fetch(`/api/events/${eventId}/collaborators/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name || null,
            role: form.role,
            permissions: form.permissions,
          }),
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error ?? 'Failed to update')
        }
        showAlert('success', 'Collaborator updated')
        setDialogOpen(false)
      } else {
        const res = await fetch(`/api/events/${eventId}/collaborators`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: form.email,
            name: form.name || null,
            role: form.role,
            permissions: form.permissions,
          }),
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error ?? 'Failed to invite')
        }
        const data = await res.json()
        setInviteToken(data.invite_token ?? null)
        showAlert('success', 'Invitation sent')
      }
      fetchCollaborators()
    } catch (err: any) {
      showAlert('error', err.message ?? 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this collaborator?')) return
    try {
      const res = await fetch(`/api/events/${eventId}/collaborators/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to remove')
      showAlert('success', 'Collaborator removed')
      setCollaborators((prev) => prev.filter((c) => c.id !== id))
    } catch {
      showAlert('error', 'Failed to remove collaborator')
    }
  }

  function copyInviteLink() {
    if (!inviteToken) return
    const link = `${window.location.origin}/invite/${inviteToken}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function roleLabel(value: string) {
    return ROLES.find((r) => r.value === value)?.label ?? value
  }

  function permissionLabel(value: string) {
    return PERMISSIONS.find((p) => p.value === value)?.label ?? value
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-text-4" />
      </div>
    )
  }

  return (
    <div>
      {alert && (
        <div
          className={`mb-4 rounded-xl px-4 py-3 text-sm ${
            alert.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {alert.msg}
        </div>
      )}

      <div className="flex justify-end mb-6">
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setInviteToken(null) }}>
          <DialogTrigger
            render={
              <Button className="bg-brand hover:bg-brand-hover" onClick={openCreate}>
                <UserPlus className="h-4 w-4 mr-1" /> Invite Co-Planner
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Collaborator' : 'Invite Co-Planner'}</DialogTitle>
            </DialogHeader>

            {inviteToken ? (
              <div className="space-y-4 mt-2">
                <p className="text-sm text-text-2">
                  Invitation created! Share this link with your collaborator:
                </p>
                <div className="flex items-center gap-2 bg-cream rounded-xl border px-3 py-2">
                  <code className="text-sm text-text-1 truncate flex-1">
                    {typeof window !== 'undefined'
                      ? `${window.location.origin}/invite/${inviteToken}`
                      : `/invite/${inviteToken}`}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={copyInviteLink}
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-text-4" />
                    )}
                  </Button>
                </div>
                <div className="flex justify-end pt-2">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Done
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                <div>
                  <label className="block text-sm font-medium text-text-2 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    disabled={!!editingId}
                    className="w-full rounded-xl border border-brand-border px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none disabled:bg-cream"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-2 mb-1">
                    Name
                  </label>
                  <input
                    className="w-full rounded-xl border border-brand-border px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-text-2 mb-1">Role</label>
                    <select
                      className="w-full rounded-xl border border-brand-border px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                      value={form.role}
                      onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                    >
                      {ROLES.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-2 mb-1">
                      Permissions
                    </label>
                    <select
                      className="w-full rounded-xl border border-brand-border px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                      value={form.permissions}
                      onChange={(e) => setForm((f) => ({ ...f, permissions: e.target.value }))}
                    >
                      {PERMISSIONS.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving}
                    className="bg-brand hover:bg-brand-hover"
                  >
                    {saving ? 'Saving...' : editingId ? 'Update' : 'Send Invite'}
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {collaborators.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-xl">
          <Users className="h-10 w-10 text-text-4 mx-auto mb-3" />
          <p className="text-text-4">No collaborators yet. Invite someone to help plan your event.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {collaborators.map((collab) => (
            <div
              key={collab.id}
              className="bg-white dark:bg-cream-2 rounded-2xl border border-brand-border p-6 shadow-sm flex items-start justify-between"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-text-1 truncate">
                    {collab.name || collab.email}
                  </h3>
                  <span
                    className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full border ${
                      collab.status === 'accepted'
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                    }`}
                  >
                    {collab.status === 'accepted' ? 'Accepted' : 'Pending'}
                  </span>
                </div>
                <div className="space-y-1 text-sm text-text-3">
                  <div className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-text-4" />
                    <span className="truncate">{collab.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-text-4" />
                      {roleLabel(collab.role)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Shield className="h-3.5 w-3.5 text-text-4" />
                      {permissionLabel(collab.permissions)}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-1 ml-3">
                <Button variant="ghost" size="icon-xs" onClick={() => openEdit(collab)}>
                  <Edit className="h-3.5 w-3.5 text-text-4" />
                </Button>
                <Button variant="ghost" size="icon-xs" onClick={() => handleDelete(collab.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
