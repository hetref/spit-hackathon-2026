'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth-client'
import { FileText, Plus, Edit, Trash2, Eye, Globe } from 'lucide-react'

export default function PagesManagementPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const [site, setSite] = useState(null)
  const [pages, setPages] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newPageName, setNewPageName] = useState('')
  const [newPageSlug, setNewPageSlug] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (!isPending && !session) {
      router.push('/signin')
    }
  }, [session, isPending, router])

  useEffect(() => {
    if (session && params.siteId) {
      fetchData()
    }
  }, [session, params.siteId])

  const fetchData = async () => {
    try {
      const [siteRes, pagesRes] = await Promise.all([
        fetch(`/api/sites/${params.siteId}`),
        fetch(`/api/sites/${params.siteId}/pages`)
      ])

      if (siteRes.ok) {
        const { site } = await siteRes.json()
        setSite(site)
      }

      if (pagesRes.ok) {
        const { pages } = await pagesRes.json()
        setPages(pages)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePage = async () => {
    if (!newPageName.trim() || !newPageSlug.trim()) return

    setCreating(true)
    try {
      const response = await fetch(`/api/sites/${params.siteId}/pages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPageName,
          slug: newPageSlug.startsWith('/') ? newPageSlug : `/${newPageSlug}`,
          seo: {
            title: `${site?.name} — ${newPageName}`,
            description: '',
            ogImage: ''
          },
          layout: []
        })
      })

      if (response.ok) {
        const { page } = await response.json()
        setPages([...pages, page])
        setShowCreateModal(false)
        setNewPageName('')
        setNewPageSlug('')
        // Navigate to builder for the new page
        router.push(`/${params.tenantId}/sites/${params.siteId}/pages/${page.id}/builder`)
      } else {
        const { error } = await response.json()
        alert(error || 'Failed to create page')
      }
    } catch (error) {
      console.error('Error creating page:', error)
      alert('Failed to create page')
    } finally {
      setCreating(false)
    }
  }

  const handleDeletePage = async (pageId) => {
    if (!confirm('Are you sure you want to delete this page?')) return

    try {
      const response = await fetch(`/api/sites/${params.siteId}/pages/${pageId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setPages(pages.filter(p => p.id !== pageId))
      } else {
        const { error } = await response.json()
        alert(error || 'Failed to delete page')
      }
    } catch (error) {
      console.error('Error deleting page:', error)
      alert('Failed to delete page')
    }
  }

  if (isPending || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
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
              <h1 className="text-2xl font-bold text-gray-900">Pages</h1>
              <p className="text-sm text-gray-500">{site?.name}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus size={16} />
                New Page
              </button>
              <button
                onClick={() => router.push(`/${params.tenantId}/sites/${params.siteId}`)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                ← Back to Site
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Pages List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="divide-y divide-gray-200">
            {pages.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-500">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                <p className="text-lg font-medium">No pages yet</p>
                <p className="text-sm mt-1">Create your first page to get started</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Create Page
                </button>
              </div>
            ) : (
              pages.map((page) => (
                <div key={page.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <FileText className="text-gray-400" size={20} />
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{page.name}</h3>
                          <p className="text-sm text-gray-500">{page.slug}</p>
                        </div>
                        {page.isPublished && (
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                            Published
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                        <span>Updated {new Date(page.updatedAt).toLocaleDateString()}</span>
                        {page.publishedAt && (
                          <span>Published {new Date(page.publishedAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {page.isPublished && (
                        <button
                          onClick={() => window.open(`/published/${site.slug}${page.slug === '/' ? '/index.html' : page.slug + '.html'}`, '_blank')}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="View Published"
                        >
                          <Globe size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => router.push(`/${params.tenantId}/sites/${params.siteId}/pages/${page.id}/builder`)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="Edit in Builder"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDeletePage(page.id)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                        title="Delete Page"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Create Page Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Create New Page</h2>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Page Name
                </label>
                <input
                  type="text"
                  value={newPageName}
                  onChange={(e) => {
                    setNewPageName(e.target.value)
                    // Auto-generate slug from name
                    if (!newPageSlug || newPageSlug === `/${newPageName.toLowerCase().replace(/\s+/g, '-')}`) {
                      setNewPageSlug(`/${e.target.value.toLowerCase().replace(/\s+/g, '-')}`)
                    }
                  }}
                  placeholder="About Us"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL Slug
                </label>
                <input
                  type="text"
                  value={newPageSlug}
                  onChange={(e) => setNewPageSlug(e.target.value)}
                  placeholder="/about-us"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  URL path for this page (e.g., /about, /contact)
                </p>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-2 rounded-b-lg">
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setNewPageName('')
                  setNewPageSlug('')
                }}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
                disabled={creating}
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePage}
                disabled={creating || !newPageName.trim() || !newPageSlug.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? 'Creating...' : 'Create Page'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
