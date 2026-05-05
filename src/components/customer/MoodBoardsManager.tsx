'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Bookmark, Image, Share2, Plus, Grid, Pencil, Trash2, ArrowLeft, Loader2 } from 'lucide-react'

type BoardItem = {
  id: string
  image_url: string
  source_url: string | null
  caption: string | null
  category: string
}

type Board = {
  id: string
  title: string
  description: string | null
  event_id: string | null
  is_shared: boolean
  items: BoardItem[]
}

const ITEM_CATEGORIES = [
  { value: 'decor', label: 'Decor' },
  { value: 'food', label: 'Food' },
  { value: 'outfit', label: 'Outfit' },
  { value: 'venue', label: 'Venue' },
  { value: 'flowers', label: 'Flowers' },
]

const CATEGORY_COLORS: Record<string, string> = {
  decor: 'bg-pink-50 text-pink-700 border-pink-200',
  food: 'bg-cream text-brand border-brand-border',
  outfit: 'bg-purple-50 text-purple-700 border-purple-200',
  venue: 'bg-blue-50 text-blue-700 border-blue-200',
  flowers: 'bg-green-50 text-green-700 border-green-200',
}

const emptyBoardForm = { title: '', description: '', event_id: '', is_shared: false }
const emptyItemForm = { image_url: '', source_url: '', caption: '', category: 'decor' }

export function MoodBoardsManager() {
  const [boards, setBoards] = useState<Board[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [showBoardForm, setShowBoardForm] = useState(false)
  const [boardForm, setBoardForm] = useState(emptyBoardForm)
  const [activeBoard, setActiveBoard] = useState<Board | null>(null)
  const [showItemForm, setShowItemForm] = useState(false)
  const [itemForm, setItemForm] = useState(emptyItemForm)

  function showAlertMsg(type: 'success' | 'error', msg: string) {
    setAlert({ type, msg })
    setTimeout(() => setAlert(null), 3000)
  }

  async function fetchBoards() {
    setLoading(true)
    try {
      const res = await fetch('/api/mood-boards')
      if (!res.ok) throw new Error('Failed to load')
      setBoards(await res.json())
    } catch {
      showAlertMsg('error', 'Failed to load mood boards')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchBoards() }, [])

  async function handleCreateBoard(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/mood-boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: boardForm.title,
          description: boardForm.description || null,
          event_id: boardForm.event_id || null,
          is_shared: boardForm.is_shared,
        }),
      })
      if (!res.ok) throw new Error('Failed to create')
      showAlertMsg('success', 'Board created')
      setShowBoardForm(false)
      setBoardForm(emptyBoardForm)
      fetchBoards()
    } catch (err: any) {
      showAlertMsg('error', err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteBoard(id: string) {
    if (!confirm('Delete this board?')) return
    try {
      const res = await fetch(`/api/mood-boards/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      showAlertMsg('success', 'Board deleted')
      setBoards(b => b.filter(x => x.id !== id))
      if (activeBoard?.id === id) setActiveBoard(null)
    } catch {
      showAlertMsg('error', 'Failed to delete')
    }
  }

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault()
    if (!activeBoard) return
    setSaving(true)
    try {
      const res = await fetch(`/api/mood-boards/${activeBoard.id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: itemForm.image_url,
          source_url: itemForm.source_url || null,
          caption: itemForm.caption || null,
          category: itemForm.category,
        }),
      })
      if (!res.ok) throw new Error('Failed to add')
      showAlertMsg('success', 'Item added')
      setShowItemForm(false)
      setItemForm(emptyItemForm)
      const updated = await fetch(`/api/mood-boards/${activeBoard.id}`)
      if (updated.ok) {
        const data = await updated.json()
        setActiveBoard(data)
        setBoards(b => b.map(bd => bd.id === data.id ? data : bd))
      }
    } catch (err: any) {
      showAlertMsg('error', err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteItem(itemId: string) {
    if (!activeBoard) return
    try {
      const res = await fetch(`/api/mood-boards/${activeBoard.id}/items/${itemId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setActiveBoard(b => b ? { ...b, items: b.items.filter(i => i.id !== itemId) } : b)
      showAlertMsg('success', 'Item removed')
    } catch {
      showAlertMsg('error', 'Failed to delete')
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-text-4" /></div>
  }

  const inputCls = 'w-full rounded-xl border border-brand-border px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none'

  if (activeBoard) {
    return (
      <div>
        {alert && (
          <div className={`mb-4 rounded-xl px-4 py-3 text-sm ${alert.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            {alert.msg}
          </div>
        )}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon-xs" onClick={() => setActiveBoard(null)}><ArrowLeft className="h-4 w-4" /></Button>
            <div>
              <h2 className="font-bold text-text-1">{activeBoard.title}</h2>
              {activeBoard.description && <p className="text-sm text-text-4">{activeBoard.description}</p>}
            </div>
            {activeBoard.is_shared && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                <Share2 className="h-3 w-3" /> Shared
              </span>
            )}
          </div>
          <Button onClick={() => setShowItemForm(!showItemForm)} className="bg-brand hover:bg-brand-hover">
            <Plus className="h-4 w-4 mr-1" /> Add Item
          </Button>
        </div>

        {showItemForm && (
          <div className="bg-white dark:bg-cream-2 rounded-2xl border border-brand-border p-6 shadow-sm mb-6">
            <form onSubmit={handleAddItem} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-text-2 mb-1">Image URL</label>
                  <input required className={inputCls} value={itemForm.image_url} onChange={e => setItemForm(f => ({ ...f, image_url: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-2 mb-1">Category</label>
                  <select className={inputCls} value={itemForm.category} onChange={e => setItemForm(f => ({ ...f, category: e.target.value }))}>
                    {ITEM_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-2 mb-1">Source URL</label>
                  <input className={inputCls} value={itemForm.source_url} onChange={e => setItemForm(f => ({ ...f, source_url: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-2 mb-1">Caption</label>
                  <input className={inputCls} value={itemForm.caption} onChange={e => setItemForm(f => ({ ...f, caption: e.target.value }))} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowItemForm(false)}>Cancel</Button>
                <Button type="submit" disabled={saving} className="bg-brand hover:bg-brand-hover">{saving ? 'Adding...' : 'Add'}</Button>
              </div>
            </form>
          </div>
        )}

        {activeBoard.items.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed rounded-xl">
            <Image className="h-10 w-10 text-text-4 mx-auto mb-3" />
            <p className="text-text-4">No items in this board yet.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {activeBoard.items.map(item => (
              <div key={item.id} className="bg-white dark:bg-cream-2 rounded-2xl border border-brand-border shadow-sm overflow-hidden">
                <div className="relative">
                  <img src={item.image_url} alt={item.caption ?? ''} className="w-full h-48 object-cover" />
                  <Button variant="ghost" size="icon-xs" className="absolute top-2 right-2 bg-white dark:bg-cream-2/80" onClick={() => handleDeleteItem(item.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                  </Button>
                </div>
                <div className="p-3">
                  {item.caption && <p className="text-sm text-text-2 mb-2">{item.caption}</p>}
                  <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[item.category] ?? 'bg-cream text-text-2 border-brand-border'}`}>
                    {ITEM_CATEGORIES.find(c => c.value === item.category)?.label ?? item.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      {alert && (
        <div className={`mb-4 rounded-xl px-4 py-3 text-sm ${alert.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {alert.msg}
        </div>
      )}

      <div className="flex justify-end mb-6">
        <Button onClick={() => setShowBoardForm(!showBoardForm)} className="bg-brand hover:bg-brand-hover">
          <Plus className="h-4 w-4 mr-1" /> Create Board
        </Button>
      </div>

      {showBoardForm && (
        <div className="bg-white dark:bg-cream-2 rounded-2xl border border-brand-border p-6 shadow-sm mb-6">
          <h3 className="font-bold text-text-1 mb-6">Create Mood Board</h3>
          <form onSubmit={handleCreateBoard} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-text-2 mb-1">Title</label>
                <input required className={inputCls} value={boardForm.title} onChange={e => setBoardForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-2 mb-1">Event ID (optional)</label>
                <input className={inputCls} value={boardForm.event_id} onChange={e => setBoardForm(f => ({ ...f, event_id: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-2 mb-1">Description</label>
              <textarea rows={2} className={inputCls} value={boardForm.description} onChange={e => setBoardForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <label className="flex items-center gap-2 text-sm text-text-2">
              <input type="checkbox" checked={boardForm.is_shared} onChange={e => setBoardForm(f => ({ ...f, is_shared: e.target.checked }))} className="rounded border-brand-border" />
              Share this board
            </label>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowBoardForm(false)}>Cancel</Button>
              <Button type="submit" disabled={saving} className="bg-brand hover:bg-brand-hover">{saving ? 'Creating...' : 'Create'}</Button>
            </div>
          </form>
        </div>
      )}

      {boards.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-xl">
          <Bookmark className="h-10 w-10 text-text-4 mx-auto mb-3" />
          <p className="text-text-4">No mood boards yet. Create your first one.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {boards.map(board => (
            <div
              key={board.id}
              className="bg-white dark:bg-cream-2 rounded-2xl border border-brand-border p-6 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setActiveBoard(board)}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-text-1">{board.title}</h3>
                <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                  <Button variant="ghost" size="icon-xs" onClick={() => handleDeleteBoard(board.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                  </Button>
                </div>
              </div>
              {board.description && <p className="text-sm text-text-4 mb-2">{board.description}</p>}
              <div className="flex items-center gap-3 text-xs text-text-4">
                <span className="flex items-center gap-1"><Grid className="h-3 w-3" /> {board.items?.length ?? 0} items</span>
                {board.is_shared && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    <Share2 className="h-3 w-3" /> Shared
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
