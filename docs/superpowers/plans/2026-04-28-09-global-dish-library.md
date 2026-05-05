# Global Dish Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a platform-managed global dish library that all vendors can browse and use, with a vendor suggestion + admin approval flow.

**Architecture:** Two boolean flags (`is_global`, `pending_review`) on the existing `MenuItem` model distinguish private vendor dishes, admin-published global dishes, and pending suggestions. A new `/api/dishes` public endpoint serves global items. Admin gets a review queue at `/admin/dishes`. Vendor menu page gains a "Global Library" tab for browsing and importing dishes.

**Tech Stack:** Next.js App Router, Prisma/PostgreSQL, existing auth patterns (vendor session via Auth.js, admin via cookie)

---

### Task 1: Schema — add is_global and pending_review to MenuItem

**Files:**
- Modify: `prisma/schema.prisma` (MenuItem model, ~line 372)

- [ ] **Step 1: Add fields to schema**

In `prisma/schema.prisma`, update MenuItem:

```prisma
model MenuItem {
  id                 String       @id @default(cuid())
  vendor_id          String
  name               String
  description        String?
  category           MenuCategory
  is_vegetarian      Boolean      @default(false)
  is_vegan           Boolean      @default(false)
  is_jain            Boolean      @default(false)
  is_halal           Boolean      @default(false)
  is_kosher          Boolean      @default(false)
  contains_nuts      Boolean      @default(false)
  contains_gluten    Boolean      @default(false)
  contains_dairy     Boolean      @default(false)
  contains_eggs      Boolean      @default(false)
  contains_soy       Boolean      @default(false)
  contains_shellfish Boolean      @default(false)
  spice_level        SpiceLevel   @default(MEDIUM)
  is_active          Boolean      @default(true)
  is_global          Boolean      @default(false)
  pending_review     Boolean      @default(false)
  vendor             Vendor       @relation(fields: [vendor_id], references: [id], onDelete: Cascade)
  packages           MenuPackageItem[]
  quote_items        QuoteMenuItem[]
}
```

- [ ] **Step 2: Push schema to database**

```bash
cd /home/hareesh/projects/oneseva && pnpm prisma db push
```

Expected: "Your database is now in sync with your Prisma schema."

- [ ] **Step 3: Update seed to mark demo dishes as global**

In `prisma/seed.ts`, find the `dishData` array (line ~119) and add `is_global: true` to each object:

```typescript
{ name: 'Paneer Tikka', ..., is_global: true },
{ name: 'Seekh Kebab', ..., is_global: true },
// etc for all 10 dishes
```

Also update the MenuItem.create call:
```typescript
const item = await prisma.menuItem.create({
  data: { ...dishData[i], vendor_id: vendor.id, is_active: true },
})
```
(No change needed here since `is_global` is now in each dish object.)

- [ ] **Step 4: Commit**

```bash
cd /home/hareesh/projects/oneseva
git add prisma/schema.prisma prisma/seed.ts
git commit -m "feat: add is_global and pending_review flags to MenuItem"
```

---

### Task 2: Global library API — GET /api/dishes

**Files:**
- Create: `src/app/api/dishes/route.ts`

- [ ] **Step 1: Create the route**

```typescript
// src/app/api/dishes/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const q = searchParams.get('q')

  const items = await prisma.menuItem.findMany({
    where: {
      is_global: true,
      pending_review: false,
      is_active: true,
      ...(category ? { category: category as any } : {}),
      ...(q ? { name: { contains: q, mode: 'insensitive' } } : {}),
    },
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
    select: {
      id: true, name: true, description: true, category: true,
      is_vegetarian: true, is_vegan: true, is_jain: true, is_halal: true,
      contains_nuts: true, contains_gluten: true, contains_dairy: true,
      spice_level: true,
    },
  })

  return NextResponse.json(items)
}
```

- [ ] **Step 2: Test the endpoint**

With the app running: `curl http://localhost:3000/api/dishes | jq '.[0]'`
Expected: first global dish with all fields.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/dishes/route.ts
git commit -m "feat: GET /api/dishes returns global dish library"
```

---

### Task 3: Vendor — suggest dish to global library

**Files:**
- Modify: `src/app/api/vendor/menu-items/route.ts`

- [ ] **Step 1: Add suggest_global flag to POST handler**

In `src/app/api/vendor/menu-items/route.ts`, update the POST handler to accept `suggest_global`:

```typescript
export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { suggest_global, ...itemData } = body

  const item = await prisma.menuItem.create({
    data: {
      ...itemData,
      vendor_id: session.user!.id as string,
      is_active: true,
      pending_review: suggest_global === true,
      is_global: false,
    },
  })

  return NextResponse.json(item, { status: 201 })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/vendor/menu-items/route.ts
git commit -m "feat: vendor can suggest dish to global library (pending_review=true)"
```

---

### Task 4: Vendor menu page — Global Library tab + suggest checkbox

**Files:**
- Modify: `src/app/(vendor)/vendor/menu/page.tsx`

- [ ] **Step 1: Add tabs and global library state**

Replace the page with a tabbed version (My Dishes / Global Library):

```typescript
'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2, Library, CheckCircle } from 'lucide-react'

type MenuItem = {
  id: string; name: string; description: string | null; category: string;
  is_vegetarian: boolean; is_vegan: boolean; is_halal: boolean;
  contains_nuts: boolean; contains_gluten: boolean; contains_dairy: boolean;
  spice_level: string; is_global?: boolean; pending_review?: boolean;
}

const CATEGORIES = [
  { value: 'SOUP_SALAD', label: 'Soups & Salads' },
  { value: 'APPETIZER', label: 'Appetizers' },
  { value: 'MAIN_COURSE', label: 'Main Course' },
  { value: 'BREAD', label: 'Bread' },
  { value: 'RICE_BIRYANI', label: 'Rice & Biryani' },
  { value: 'DAL', label: 'Dal & Lentils' },
  { value: 'DESSERT', label: 'Desserts' },
  { value: 'BEVERAGE', label: 'Beverages' },
  { value: 'LIVE_COUNTER', label: 'Live Counter' },
  { value: 'OTHER', label: 'Other' },
]

const SPICE_LEVELS = ['MILD', 'MEDIUM', 'HOT', 'VERY_HOT']

export default function MenuPage() {
  const [tab, setTab] = useState<'mine' | 'global'>('mine')
  const [items, setItems] = useState<MenuItem[]>([])
  const [globalItems, setGlobalItems] = useState<MenuItem[]>([])
  const [globalSearch, setGlobalSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set())
  const [form, setForm] = useState({
    name: '', description: '', category: 'MAIN_COURSE', spice_level: 'MEDIUM',
    is_vegetarian: false, is_vegan: false, is_halal: false,
    contains_nuts: false, contains_gluten: false, contains_dairy: false,
    contains_eggs: false, contains_soy: false, contains_shellfish: false,
    suggest_global: false,
  })

  useEffect(() => {
    fetch('/api/vendor/menu-items').then(r => r.json()).then(setItems)
  }, [])

  useEffect(() => {
    if (tab !== 'global') return
    const url = globalSearch
      ? `/api/dishes?q=${encodeURIComponent(globalSearch)}`
      : '/api/dishes'
    fetch(url).then(r => r.json()).then(setGlobalItems)
  }, [tab, globalSearch])

  async function addItem() {
    if (!form.name || !form.description) return
    setSaving(true)
    const res = await fetch('/api/vendor/menu-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const item = await res.json()
    setItems(prev => [...prev, item])
    setForm(f => ({ ...f, name: '', description: '', suggest_global: false }))
    setShowForm(false)
    setSaving(false)
  }

  async function deleteItem(id: string) {
    await fetch(`/api/vendor/menu-items/${id}`, { method: 'DELETE' })
    setItems(prev => prev.filter(i => i.id !== id))
  }

  async function importFromGlobal(globalItem: MenuItem) {
    setSaving(true)
    const res = await fetch('/api/vendor/menu-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: globalItem.name,
        description: globalItem.description,
        category: globalItem.category,
        spice_level: globalItem.spice_level,
        is_vegetarian: globalItem.is_vegetarian,
        is_vegan: globalItem.is_vegan,
        is_halal: globalItem.is_halal,
        contains_nuts: globalItem.contains_nuts,
        contains_gluten: globalItem.contains_gluten,
        contains_dairy: globalItem.contains_dairy,
        suggest_global: false,
      }),
    })
    const item = await res.json()
    setItems(prev => [...prev, item])
    setImportedIds(prev => new Set([...prev, globalItem.id]))
    setSaving(false)
  }

  const grouped = CATEGORIES.reduce<Record<string, MenuItem[]>>((acc, cat) => {
    acc[cat.value] = items.filter(i => i.category === cat.value)
    return acc
  }, {})

  const globalGrouped = CATEGORIES.reduce<Record<string, MenuItem[]>>((acc, cat) => {
    acc[cat.value] = globalItems.filter(i => i.category === cat.value)
    return acc
  }, {})

  const myItemNames = new Set(items.map(i => i.name.toLowerCase()))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dish Library</h1>
          <p className="text-gray-500 mt-1">Manage your dishes and browse the global library.</p>
        </div>
        {tab === 'mine' && (
          <Button onClick={() => setShowForm(v => !v)} className="bg-orange-600 hover:bg-orange-700">
            <Plus className="h-4 w-4 mr-2" /> Add Dish
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex rounded-lg border overflow-hidden mb-6 w-fit">
        <button
          className={`px-4 py-2 text-sm font-medium ${tab === 'mine' ? 'bg-orange-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          onClick={() => setTab('mine')}
        >My Dishes ({items.length})</button>
        <button
          className={`px-4 py-2 text-sm font-medium flex items-center gap-1.5 ${tab === 'global' ? 'bg-orange-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          onClick={() => setTab('global')}
        ><Library className="h-3.5 w-3.5" /> Global Library</button>
      </div>

      {tab === 'mine' && (
        <>
          {showForm && (
            <div className="bg-white border rounded-xl p-6 mb-6 space-y-4">
              <h3 className="font-semibold text-gray-900">New Dish</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Name *</Label>
                  <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Paneer Tikka" />
                </div>
                <div className="space-y-1">
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={(v: string | null) => setForm(f => ({ ...f, category: v ?? 'MAIN_COURSE' }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label>Description *</Label>
                <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="1–2 sentences describing the dish" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Spice Level</Label>
                  <Select value={form.spice_level} onValueChange={(v: string | null) => setForm(f => ({ ...f, spice_level: v ?? 'MEDIUM' }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SPICE_LEVELS.map(s => <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 text-sm">
                {[
                  { key: 'is_vegetarian', label: 'Vegetarian' },
                  { key: 'is_vegan', label: 'Vegan' },
                  { key: 'is_halal', label: 'Halal' },
                  { key: 'contains_nuts', label: 'Contains nuts' },
                  { key: 'contains_gluten', label: 'Contains gluten' },
                  { key: 'contains_dairy', label: 'Contains dairy' },
                  { key: 'contains_eggs', label: 'Contains eggs' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={(form as any)[key]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))}
                      className="rounded" />
                    {label}
                  </label>
                ))}
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer border-t pt-3">
                <input type="checkbox" checked={form.suggest_global}
                  onChange={e => setForm(f => ({ ...f, suggest_global: e.target.checked }))}
                  className="rounded" />
                <span className="font-medium text-orange-700">Suggest this dish for the global library</span>
                <span className="text-gray-400">(admin will review)</span>
              </label>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button onClick={addItem} disabled={saving || !form.name || !form.description} className="bg-orange-600 hover:bg-orange-700">
                  {saving ? 'Adding…' : 'Add Dish'}
                </Button>
              </div>
            </div>
          )}

          {items.filter(i => i.pending_review).length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4 text-sm text-orange-800">
              <strong>{items.filter(i => i.pending_review).length} dish(es)</strong> pending admin review for the global library.
            </div>
          )}

          {items.length === 0 && !showForm ? (
            <div className="bg-white border rounded-xl p-12 text-center">
              <p className="text-gray-500">No dishes yet. Add your first dish or import from the global library.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {CATEGORIES.filter(cat => grouped[cat.value].length > 0).map(cat => (
                <div key={cat.value} className="bg-white border rounded-xl overflow-hidden">
                  <div className="px-5 py-3 bg-gray-50 border-b flex items-center justify-between">
                    <h3 className="font-medium text-gray-800">{cat.label}</h3>
                    <span className="text-xs text-gray-400">{grouped[cat.value].length} dishes</span>
                  </div>
                  <div className="divide-y">
                    {grouped[cat.value].map(item => (
                      <div key={item.id} className="px-5 py-4 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{item.name}</span>
                            {item.is_vegetarian && <Badge variant="outline" className="text-xs text-green-700 border-green-200">V</Badge>}
                            {item.is_halal && <Badge variant="outline" className="text-xs">Halal</Badge>}
                            {item.contains_nuts && <Badge variant="outline" className="text-xs text-orange-700 border-orange-200">Nuts</Badge>}
                            {item.pending_review && <Badge variant="outline" className="text-xs text-orange-600 border-orange-200">Pending review</Badge>}
                          </div>
                          {item.description && <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>}
                          <span className="text-xs text-gray-400">{item.spice_level.replace('_', ' ')}</span>
                        </div>
                        <button onClick={() => deleteItem(item.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'global' && (
        <div>
          <div className="mb-4">
            <Input
              placeholder="Search global library…"
              value={globalSearch}
              onChange={e => setGlobalSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>
          {globalItems.length === 0 ? (
            <div className="bg-white border rounded-xl p-12 text-center text-gray-400">No dishes found.</div>
          ) : (
            <div className="space-y-4">
              {CATEGORIES.filter(cat => globalGrouped[cat.value].length > 0).map(cat => (
                <div key={cat.value} className="bg-white border rounded-xl overflow-hidden">
                  <div className="px-5 py-3 bg-gray-50 border-b">
                    <h3 className="font-medium text-gray-800">{cat.label}</h3>
                  </div>
                  <div className="divide-y">
                    {globalGrouped[cat.value].map(item => {
                      const alreadyHave = myItemNames.has(item.name.toLowerCase()) || importedIds.has(item.id)
                      return (
                        <div key={item.id} className="px-5 py-4 flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">{item.name}</span>
                              {item.is_vegetarian && <Badge variant="outline" className="text-xs text-green-700 border-green-200">V</Badge>}
                              {item.is_halal && <Badge variant="outline" className="text-xs">Halal</Badge>}
                            </div>
                            {item.description && <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>}
                            <span className="text-xs text-gray-400">{item.spice_level.replace('_', ' ')}</span>
                          </div>
                          {alreadyHave ? (
                            <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle className="h-3.5 w-3.5" /> Added</span>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => importFromGlobal(item)} disabled={saving}>
                              + Add to my dishes
                            </Button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(vendor)/vendor/menu/page.tsx
git commit -m "feat: vendor menu page with global library tab and suggest-to-library option"
```

---

### Task 5: Admin — dish review queue

**Files:**
- Create: `src/app/api/admin/dishes/route.ts`
- Create: `src/app/api/admin/dishes/[id]/route.ts`
- Create: `src/app/admin/dishes/page.tsx`
- Modify: `src/app/admin/layout.tsx` or nav (add Dishes link)

- [ ] **Step 1: Admin API — list pending dishes**

```typescript
// src/app/api/admin/dishes/route.ts
import { NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  if (!isAdminRequest(req as any)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const pending = await prisma.menuItem.findMany({
    where: { pending_review: true },
    include: { vendor: { select: { business_name: true } } },
    orderBy: { created_at: 'asc' },
  })

  return NextResponse.json(pending)
}

export async function POST(req: Request) {
  if (!isAdminRequest(req as any)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const item = await prisma.menuItem.create({
    data: {
      ...body,
      vendor_id: body.vendor_id,
      is_global: true,
      pending_review: false,
      is_active: true,
    },
  })

  return NextResponse.json(item, { status: 201 })
}
```

- [ ] **Step 2: Admin API — approve / reject / edit dish**

```typescript
// src/app/api/admin/dishes/[id]/route.ts
import { NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(req as any)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()
  const { action, ...updates } = body

  if (action === 'approve') {
    const item = await prisma.menuItem.update({
      where: { id },
      data: { ...updates, is_global: true, pending_review: false },
    })
    return NextResponse.json(item)
  }

  if (action === 'reject') {
    const item = await prisma.menuItem.update({
      where: { id },
      data: { pending_review: false, is_global: false },
    })
    return NextResponse.json(item)
  }

  // Generic update (edit fields before approving)
  const item = await prisma.menuItem.update({ where: { id }, data: updates })
  return NextResponse.json(item)
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(req as any)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  await prisma.menuItem.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
```

- [ ] **Step 3: Admin dishes page**

```typescript
// src/app/admin/dishes/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Check, X, Plus } from 'lucide-react'

type DishItem = {
  id: string; name: string; description: string | null; category: string;
  spice_level: string; is_vegetarian: boolean; is_vegan: boolean; is_halal: boolean;
  contains_nuts: boolean; contains_gluten: boolean; contains_dairy: boolean;
  is_global: boolean; pending_review: boolean;
  vendor: { business_name: string }
}

const CATEGORIES = [
  { value: 'SOUP_SALAD', label: 'Soups & Salads' },
  { value: 'APPETIZER', label: 'Appetizers' },
  { value: 'MAIN_COURSE', label: 'Main Course' },
  { value: 'BREAD', label: 'Bread' },
  { value: 'RICE_BIRYANI', label: 'Rice & Biryani' },
  { value: 'DAL', label: 'Dal & Lentils' },
  { value: 'DESSERT', label: 'Desserts' },
  { value: 'BEVERAGE', label: 'Beverages' },
  { value: 'LIVE_COUNTER', label: 'Live Counter' },
  { value: 'OTHER', label: 'Other' },
]

export default function AdminDishesPage() {
  const [tab, setTab] = useState<'pending' | 'global'>('pending')
  const [items, setItems] = useState<DishItem[]>([])
  const [globalItems, setGlobalItems] = useState<DishItem[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Partial<DishItem>>({})
  const [showAddForm, setShowAddForm] = useState(false)
  const [newDish, setNewDish] = useState({
    name: '', description: '', category: 'MAIN_COURSE', spice_level: 'MEDIUM',
    is_vegetarian: false, is_vegan: false, is_halal: false,
    contains_nuts: false, contains_gluten: false, contains_dairy: false,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadPending() }, [])
  useEffect(() => { if (tab === 'global') loadGlobal() }, [tab])

  async function loadPending() {
    const res = await fetch('/api/admin/dishes')
    if (res.ok) setItems(await res.json())
  }

  async function loadGlobal() {
    const res = await fetch('/api/dishes')
    if (res.ok) setGlobalItems(await res.json())
  }

  async function approve(id: string) {
    setSaving(true)
    const updates = editingId === id ? editValues : {}
    await fetch(`/api/admin/dishes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve', ...updates }),
    })
    setItems(prev => prev.filter(i => i.id !== id))
    setEditingId(null)
    setSaving(false)
  }

  async function reject(id: string) {
    setSaving(true)
    await fetch(`/api/admin/dishes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reject' }),
    })
    setItems(prev => prev.filter(i => i.id !== id))
    setSaving(false)
  }

  async function deleteGlobal(id: string) {
    if (!confirm('Remove from global library?')) return
    await fetch(`/api/admin/dishes/${id}`, { method: 'DELETE' })
    setGlobalItems(prev => prev.filter(i => i.id !== id))
  }

  async function addGlobalDish() {
    if (!newDish.name || !newDish.description) return
    setSaving(true)
    // Use a placeholder vendor_id — admin-created global dishes need a vendor reference.
    // We'll create with the first vendor or use a system approach.
    // Since vendor_id is required, fetch any vendor id for admin-created items.
    const vendorRes = await fetch('/api/admin/vendors?limit=1')
    const vendors = await vendorRes.json()
    if (!vendors.length) { setSaving(false); alert('No vendors in system'); return }
    await fetch('/api/admin/dishes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newDish, vendor_id: vendors[0].id }),
    })
    setShowAddForm(false)
    setNewDish({ name: '', description: '', category: 'MAIN_COURSE', spice_level: 'MEDIUM',
      is_vegetarian: false, is_vegan: false, is_halal: false,
      contains_nuts: false, contains_gluten: false, contains_dairy: false })
    loadGlobal()
    setSaving(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dish Library</h1>
        {tab === 'global' && (
          <Button onClick={() => setShowAddForm(v => !v)} className="bg-orange-600 hover:bg-orange-700">
            <Plus className="h-4 w-4 mr-2" /> Add Dish
          </Button>
        )}
      </div>

      <div className="flex rounded-lg border overflow-hidden mb-6 w-fit">
        <button
          className={`px-4 py-2 text-sm font-medium ${tab === 'pending' ? 'bg-orange-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          onClick={() => setTab('pending')}
        >Pending Review {items.length > 0 && `(${items.length})`}</button>
        <button
          className={`px-4 py-2 text-sm font-medium ${tab === 'global' ? 'bg-orange-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          onClick={() => setTab('global')}
        >Global Library</button>
      </div>

      {tab === 'pending' && (
        <div>
          {items.length === 0 ? (
            <div className="bg-white border rounded-xl p-12 text-center text-gray-400">No dishes pending review.</div>
          ) : (
            <div className="bg-white border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Dish</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Suggested by</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Description</th>
                    <th className="w-28" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.map(item => (
                    <tr key={item.id} className={editingId === item.id ? 'bg-orange-50' : 'hover:bg-gray-50'}>
                      <td className="px-4 py-3">
                        {editingId === item.id ? (
                          <Input value={String(editValues.name ?? item.name)} onChange={e => setEditValues(v => ({ ...v, name: e.target.value }))} className="h-8 text-sm" />
                        ) : (
                          <div>
                            <div className="font-medium text-gray-900">{item.name}</div>
                            <div className="flex gap-1 mt-0.5">
                              {item.is_vegetarian && <Badge variant="outline" className="text-xs text-green-700 border-green-200">V</Badge>}
                              {item.is_halal && <Badge variant="outline" className="text-xs">Halal</Badge>}
                              {item.contains_nuts && <Badge variant="outline" className="text-xs text-orange-700 border-orange-200">Nuts</Badge>}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {CATEGORIES.find(c => c.value === item.category)?.label ?? item.category}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{item.vendor.business_name}</td>
                      <td className="px-4 py-3 text-gray-500 max-w-xs">
                        {editingId === item.id ? (
                          <Input value={String(editValues.description ?? item.description ?? '')} onChange={e => setEditValues(v => ({ ...v, description: e.target.value }))} className="h-8 text-sm" />
                        ) : (
                          item.description ?? <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {editingId !== item.id && (
                            <button onClick={() => { setEditingId(item.id); setEditValues({ name: item.name, description: item.description ?? '' }) }} className="px-2 py-1 text-xs border rounded hover:bg-gray-50">Edit</button>
                          )}
                          <button onClick={() => approve(item.id)} disabled={saving} className="p-1 text-green-600 hover:bg-green-50 rounded" title="Approve">
                            <Check className="h-4 w-4" />
                          </button>
                          <button onClick={() => reject(item.id)} disabled={saving} className="p-1 text-red-500 hover:bg-red-50 rounded" title="Reject">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'global' && (
        <div className="space-y-4">
          {showAddForm && (
            <div className="bg-white border rounded-xl p-6 space-y-4">
              <h3 className="font-semibold">Add to Global Library</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Name *</label>
                  <Input value={newDish.name} onChange={e => setNewDish(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Category</label>
                  <Select value={newDish.category} onValueChange={(v: string | null) => setNewDish(f => ({ ...f, category: v ?? 'MAIN_COURSE' }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Description *</label>
                <Input value={newDish.description} onChange={e => setNewDish(f => ({ ...f, description: e.target.value }))} placeholder="1-2 sentence description" />
              </div>
              <div className="flex flex-wrap gap-3 text-sm">
                {[{ key: 'is_vegetarian', label: 'Vegetarian' }, { key: 'is_vegan', label: 'Vegan' }, { key: 'is_halal', label: 'Halal' }, { key: 'contains_nuts', label: 'Nuts' }, { key: 'contains_gluten', label: 'Gluten' }, { key: 'contains_dairy', label: 'Dairy' }].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={(newDish as any)[key]} onChange={e => setNewDish(f => ({ ...f, [key]: e.target.checked }))} className="rounded" /> {label}
                  </label>
                ))}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
                <Button onClick={addGlobalDish} disabled={saving || !newDish.name || !newDish.description} className="bg-orange-600 hover:bg-orange-700">Add to Library</Button>
              </div>
            </div>
          )}
          <div className="bg-white border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Dish</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Description</th>
                  <th className="w-16" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {globalItems.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{item.name}</div>
                      <div className="flex gap-1 mt-0.5">
                        {item.is_vegetarian && <Badge variant="outline" className="text-xs text-green-700 border-green-200">V</Badge>}
                        {item.is_halal && <Badge variant="outline" className="text-xs">Halal</Badge>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{CATEGORIES.find(c => c.value === item.category)?.label ?? item.category}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-xs">{item.description}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => deleteGlobal(item.id)} className="p-1 text-gray-300 hover:text-red-500 rounded">
                        <X className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Add Dishes link to admin nav**

In `src/app/admin/layout.tsx` (or wherever the admin nav links are), add:
```typescript
{ href: '/admin/dishes', label: 'Dish Library' }
```

- [ ] **Step 5: Commit**

```bash
git add src/app/api/admin/dishes/ src/app/admin/dishes/
git commit -m "feat: admin dish review queue and global library management"
```
