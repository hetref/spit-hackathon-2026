'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth-client'
import { 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Globe, 
  ArrowLeft,
  X,
  Loader2,
  AlertCircle,
  Home,
  MonitorOff,
  ExternalLink
} from 'lucide-react'

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
  const [error, setError] = useState('')

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

  const handleCreatePage = async (e) => {
    if (e) e.preventDefault()
    setError('')
    if (!newPageName.trim() || !newPageSlug.trim()) {
      setError('Name and slug are required.')
      return
    }

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
        setError(error || 'Failed to create page')
      }
    } catch (error) {
      console.error('Error creating page:', error)
      setError('Failed to create page')
    } finally {
      setCreating(false)
    }
  }

  const handleDeletePage = async (pageId, pageName) => {
    if (!confirm(`Are you sure you want to delete "${pageName}"? This cannot be undone.`)) return

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

  const handleSetAsHome = async (pageId) => {
    if (!confirm('Set this page as the home page? The current home page will be moved to a different URL.')) return

    try {
      const response = await fetch(`/api/sites/${params.siteId}/pages/${pageId}/set-home`, {
        method: 'POST'
      })

      const result = await response.json()
      
      if (response.ok) {
        // Refresh the page list
        fetchData()
      } else {
        alert(result.error || 'Failed to set as home page')
      }
    } catch (error) {
      console.error('Error setting home page:', error)
      alert('Failed to set as home page')
    }
  }

  if (isPending || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFDFD]">
        <Loader2 size={32} className="animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-sans text-gray-900 pb-12">
      
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 py-5 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push(`/${params.tenantId}/sites/${params.siteId}`)}
                className="p-2 -ml-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
                title="Back to Site Details"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">Pages</h1>
                <p className="text-sm sm:text-base text-gray-500 mt-0.5 max-w-md truncate">Manage content for {site?.name}</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center justify-center px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 shrink-0"
            >
              <Plus size={16} className="mr-2" />
              New Page
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 py-8 sm:py-12">
        {/* Pages Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {pages.length === 0 ? (
            <div className="col-span-full text-center py-24 bg-white rounded-3xl border border-dashed border-gray-300 flex flex-col items-center">
              <div className="h-16 w-16 bg-gray-50 border border-gray-200 rounded-2xl flex items-center justify-center mb-6">
                <FileText size={32} className="text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2 tracking-tight">No pages found</h3>
              <p className="text-base text-gray-500 max-w-sm mb-8">
                Your site doesn't have any pages yet. Create one to start building.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center justify-center px-6 py-3 bg-white border border-gray-300 text-gray-900 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
              >
                <Plus size={16} className="mr-2" />
                Create your first page
              </button>
            </div>
          ) : (
            pages.map((page) => (
              <div key={page.id} className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-gray-300 hover:shadow-md transition-all duration-200 flex flex-col h-[400px]">
                
                {/* Visual Preview / Status Top Frame */}
                <div className="h-56 relative flex items-center justify-center overflow-hidden border-b border-gray-100 bg-white">
                  {page.isPublished && site?.slug ? (
                     <div className="absolute inset-0 w-full h-full overflow-hidden">
                       <iframe 
                         src={`/published/${site.slug}/${page.slug === '/' ? 'index' : page.slug.replace(/^\//, '')}.html`} 
                         className="border-0 pointer-events-none origin-top-left" 
                         style={{ width: '400%', height: '400%', transform: 'scale(0.25)' }}
                         title={`${page.name} Preview`}
                       />
                     </div>
                  ) : (
                    <div className="flex flex-col items-center text-center px-4">
                      {page.isPublished ? (
                         <Globe size={32} className="text-gray-300 mb-2" />
                      ) : (
                         <MonitorOff size={32} className="text-gray-300 mb-2" />
                      )}
                      <span className="text-xs font-medium text-gray-400">
                        {page.isPublished ? 'Preview hidden' : 'Draft preview hidden'}
                      </span>
                    </div>
                  )}
                  {/* Absolute overlay block to prevent clicking the iframe inside the card grid view */}
                  <div className="absolute inset-0 z-10 bg-transparent hover:bg-gray-900/5 transition-colors cursor-pointer" onClick={() => router.push(`/${params.tenantId}/sites/${params.siteId}/pages/${page.id}/builder`)}></div>
                </div>

                {/* Info Area */}
                <div className="p-5 flex-1 flex flex-col justify-between bg-white relative">
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                       <div className="min-w-0 flex-1">
                         <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-base font-bold text-gray-900 tracking-tight truncate group-hover:text-gray-900 transition-colors">
                              {page.name}
                            </h3>
                            {page.slug === '/' && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-gray-100 text-gray-700 border border-gray-200" title="Home Page">
                                <Home size={10} className="mr-1 inline-block" />
                                Home
                              </span>
                            )}
                         </div>
                         <p className="text-xs text-gray-500 truncate flex items-center font-mono bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-md inline-block">
                           {page.slug}
                         </p>
                       </div>
                    </div>

                    <div className="flex items-center gap-2 mt-4">
                      {page.isPublished ? (
                         <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-2 py-0.5">
                           <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                           Published {new Date(page.publishedAt).toLocaleDateString()}
                         </span>
                      ) : (
                         <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-100 border border-gray-200 rounded-md px-2 py-0.5">
                           <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                           Draft
                         </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Actions Footer */}
                <div className="px-5 py-3.5 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between gap-2 z-20">
                    <button
                      onClick={() => router.push(`/${params.tenantId}/sites/${params.siteId}/pages/${page.id}/builder`)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white text-gray-900 text-xs font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
                    >
                      <Edit size={14} className="text-gray-500" />
                      Builder
                    </button>
                    
                    <div className="flex items-center gap-1 shrink-0">
                      {page.isPublished && (
                        <button
                          onClick={() => window.open(`/published/${site.slug}/${page.slug === '/' ? 'index' : page.slug.replace(/^\//, '')}.html`, '_blank')}
                          className="p-2 text-gray-500 hover:text-gray-900 hover:bg-white border border-transparent hover:border-gray-200 rounded-lg transition-colors"
                          title="Open published URL"
                        >
                          <ExternalLink size={16} />
                        </button>
                      )}
                      {page.slug !== '/' && (
                        <button
                          onClick={() => handleSetAsHome(page.id)}
                          className="px-2.5 py-2 text-xs font-medium text-gray-600 hover:text-gray-900 border border-transparent hover:border-gray-200 hover:bg-white rounded-lg transition-colors"
                          title="Set as Home Page"
                        >
                          Set Home
                        </button>
                      )}
                      {page.slug !== '/' && (
                        <button
                          onClick={() => handleDeletePage(page.id, page.name)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 hover:border-red-100 border border-transparent rounded-lg transition-colors"
                          title="Delete Page"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                </div>

              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Page Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-semibold text-gray-900 tracking-tight">Create New Page</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setNewPageName('')
                  setNewPageSlug('')
                  setError('')
                }}
                className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleCreatePage} className="px-6 py-6 space-y-5">
              {error && (
                <div className="flex items-start gap-3 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-500" />
                  <span className="font-medium">{error}</span>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Page Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newPageName}
                  onChange={(e) => {
                    setNewPageName(e.target.value)
                    if (!newPageSlug || newPageSlug === `/${newPageName.toLowerCase().replace(/\s+/g, '-')}`) {
                      setNewPageSlug(`/${e.target.value.toLowerCase().replace(/\s+/g, '-')}`)
                    }
                  }}
                  placeholder="e.g. About Us"
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-colors"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  URL Slug <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newPageSlug}
                  onChange={(e) => setNewPageSlug(e.target.value)}
                  placeholder="/about-us"
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm font-mono text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-colors"
                  required
                />
                <p className="mt-2 text-xs text-gray-500">
                  The URL path structure for this specific page.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 mt-6 -mx-6 px-6 sm:pb-0 pb-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false)
                    setNewPageName('')
                    setNewPageSlug('')
                    setError('')
                  }}
                  disabled={creating}
                  className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex items-center justify-center px-6 py-2.5 bg-gray-900 text-white text-sm font-medium border border-transparent rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-[120px]"
                >
                  {creating ? (
                    <>
                      <Loader2 size={16} className="animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    'Create Page'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
