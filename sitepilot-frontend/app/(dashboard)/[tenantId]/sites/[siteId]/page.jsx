'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth-client'

export default function SiteDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const [site, setSite] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAddDomain, setShowAddDomain] = useState(false)
  const [domainInput, setDomainInput] = useState('')
  const [domains, setDomains] = useState([])

  useEffect(() => {
    if (!isPending && !session) {
      router.push('/auth/signin')
    }
  }, [session, isPending, router])

  useEffect(() => {
    if (session && params.siteId) {
      fetchSiteDetails()
    }
  }, [session, params.siteId])

  const fetchSiteDetails = async () => {
    try {
      const response = await fetch(`/api/tenants/${params.tenantId}/sites/${params.siteId}`)
      if (response.ok) {
        const data = await response.json()
        setSite(data.site)
        // Initialize domains array with the site's domain if it exists
        if (data.site.domain) {
          setDomains([data.site.domain])
        }
      }
    } catch (error) {
      console.error('Error fetching site:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddDomain = () => {
    if (domainInput.trim() && !domains.includes(domainInput.trim())) {
      setDomains([...domains, domainInput.trim()])
      setDomainInput('')
      setShowAddDomain(false)
    }
  }

  const handleRemoveDomain = (domain) => {
    setDomains(domains.filter(d => d !== domain))
  }

  if (isPending || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!site) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Site not found</h2>
          <button
            onClick={() => router.push(`/${params.tenantId}`)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Workspace
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{site.name}</h1>
              <p className="text-sm text-gray-500">/{site.slug}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => router.push(`/${params.tenantId}/sites/${params.siteId}/builder`)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Open Builder
              </button>
              <button
                onClick={() => router.push(`/${params.tenantId}`)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                ← Back
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Site Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Created</h3>
            <p className="mt-2 text-lg font-semibold text-gray-900">
              {new Date(site.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
            <p className="mt-2 text-lg font-semibold text-gray-900">
              {new Date(site.updatedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Versions</h3>
            <p className="mt-2 text-lg font-semibold text-gray-900">
              {site._count?.versions || 0}
            </p>
          </div>
        </div>

        {/* Domains Section */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Connected Domains</h2>
            <button
              onClick={() => setShowAddDomain(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              + Add Domain
            </button>
          </div>

          {/* Add Domain Form */}
          {showAddDomain && (
            <div className="px-6 py-4 bg-blue-50 border-b border-blue-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="example.com"
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddDomain()}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleAddDomain}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setShowAddDomain(false)
                    setDomainInput('')
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Domains List */}
          <div className="divide-y divide-gray-200">
            {domains.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                <p>No domains connected yet</p>
              </div>
            ) : (
              domains.map((domain, idx) => (
                <div key={idx} className="px-6 py-4 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{domain}</p>
                    <p className="text-xs text-gray-500">
                      {idx === 0 ? 'Primary Domain' : 'Additional Domain'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveDomain(domain)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Analytics Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Site Analytics</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-3xl font-bold text-blue-600">0</p>
                <p className="text-sm text-gray-600 mt-1">Total Visits</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-3xl font-bold text-green-600">0</p>
                <p className="text-sm text-gray-600 mt-1">Unique Visitors</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-3xl font-bold text-purple-600">0s</p>
                <p className="text-sm text-gray-600 mt-1">Avg. Duration</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-3xl font-bold text-orange-600">0%</p>
                <p className="text-sm text-gray-600 mt-1">Bounce Rate</p>
              </div>
            </div>
            <div className="border-t pt-4">
              <p className="text-sm text-gray-500 text-center">
                Analytics tracking will be available once the site is published
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}