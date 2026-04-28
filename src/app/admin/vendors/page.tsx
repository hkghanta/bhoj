'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'

type Vendor = {
  id: string
  business_name: string
  email: string
  vendor_type: string
  city: string
  is_active: boolean
  is_verified: boolean
  created_at: string
  subscriptions: { tier: string; status: string }[]
}

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [filter, setFilter] = useState<'pending' | 'approved' | 'all'>('pending')
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/vendors?status=${filter}`)
      .then(r => {
        if (r.status === 401) { router.push('/admin/login'); return null }
        return r.json()
      })
      .then(data => { if (data) { setVendors(data); setLoading(false) } })
  }, [filter, router])

  async function approve(id: string) {
    await fetch(`/api/admin/vendors/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: true, is_verified: true }),
    })
    setVendors(v => v.filter(vendor => vendor.id !== id))
  }

  async function reject(id: string) {
    await fetch(`/api/admin/vendors/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: false }),
    })
    setVendors(v => v.filter(vendor => vendor.id !== id))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Vendor Management</h1>
          <div className="flex gap-2">
            {(['pending', 'approved', 'all'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize ${
                  filter === f ? 'bg-orange-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="text-gray-400 text-center py-12">Loading…</p>
        ) : vendors.length === 0 ? (
          <p className="text-gray-400 text-center py-12">No vendors in this category.</p>
        ) : (
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-500 font-medium">Vendor</th>
                  <th className="px-4 py-3 text-left text-gray-500 font-medium">Type</th>
                  <th className="px-4 py-3 text-left text-gray-500 font-medium">Location</th>
                  <th className="px-4 py-3 text-left text-gray-500 font-medium">Plan</th>
                  <th className="px-4 py-3 text-left text-gray-500 font-medium">Status</th>
                  <th className="px-4 py-3 text-left text-gray-500 font-medium">Joined</th>
                  <th className="px-4 py-3 text-left text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {vendors.map(vendor => (
                  <tr key={vendor.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{vendor.business_name}</p>
                      <p className="text-gray-400 text-xs">{vendor.email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{vendor.vendor_type.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3 text-gray-600">{vendor.city}</td>
                    <td className="px-4 py-3">
                      {vendor.subscriptions[0] ? (
                        <Badge className={`text-xs ${vendor.subscriptions[0].tier === 'PREMIUM' ? 'bg-orange-100 text-orange-700' : vendor.subscriptions[0].tier === 'PRO' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                          {vendor.subscriptions[0].tier}
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-600 text-xs">FREE</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {vendor.is_active ? (
                          <Badge className="bg-green-100 text-green-700 text-xs">Active</Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-700 text-xs">Pending</Badge>
                        )}
                        {vendor.is_verified && (
                          <Badge className="bg-blue-100 text-blue-700 text-xs">Verified</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {format(new Date(vendor.created_at), 'd MMM yyyy')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {!vendor.is_active && (
                          <button
                            onClick={() => approve(vendor.id)}
                            className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded"
                          >
                            Approve
                          </button>
                        )}
                        {vendor.is_active && (
                          <button
                            onClick={() => reject(vendor.id)}
                            className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded"
                          >
                            Deactivate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
