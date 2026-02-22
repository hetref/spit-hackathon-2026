'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth-client'
import { ArrowLeft, Briefcase, Globe, Type, Image as ImageIcon, Loader2 } from 'lucide-react'

export default function NewTenantPage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    logo: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const generateSlug = (name) => {  
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const handleNameChange = (e) => {
    const name = e.target.value
    setFormData({
      ...formData,
      name,
      slug: generateSlug(name)
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create tenant')
      }

      router.push(`/${data.tenant.id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFDFD]">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500 mb-4" />
        </div>
      </div>
    )
  }

  if (!session) {
    router.push('/auth/signin')
    return null
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-sans text-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">

        {/* Navigation / Back Button */}
        <button
          onClick={() => router.back()}
          className="group inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </button>

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Create Workspace
          </h1>
          <p className="mt-2 text-base text-gray-500">
            A workspace is where you manage your team, sites, and billing.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <form onSubmit={handleSubmit} className="divide-y divide-gray-100">

            {/* Error Message */}
            {error && (
              <div className="p-6 pb-0">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 mr-3 flex-shrink-0" />
                  <p className="font-medium">{error}</p>
                </div>
              </div>
            )}

            {/* Content area */}
            <div className="p-6 sm:p-8 space-y-8">

              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-900 mb-2">
                  Workspace Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Briefcase className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="name"
                    required
                    value={formData.name}
                    onChange={handleNameChange}
                    placeholder="e.g. Acme Inc."
                    className="block w-full pl-11 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-colors text-base"
                  />
                </div>
              </div>

              {/* Slug Field */}
              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-gray-900 mb-2">
                  Workspace URL
                </label>
                <div className="flex rounded-xl shadow-sm border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-gray-900/10 focus-within:border-gray-900 focus-within:z-10 transition-colors">
                  <span className="inline-flex items-center px-4 bg-gray-50 border-r border-gray-300 text-gray-500 text-base select-none">
                    sitepilot.com/
                  </span>
                  <input
                    type="text"
                    id="slug"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="acme-inc"
                    pattern="[a-z0-9-]+"
                    className="flex-1 block w-full px-4 py-3 bg-white text-gray-900 placeholder-gray-400 focus:outline-none text-base"
                  />
                </div>
                <p className="mt-2.5 text-sm text-gray-500 flex items-center">
                  <Globe className="h-4 w-4 mr-1.5" />
                  Lowercase letters, numbers, and hyphens only.
                </p>
              </div>

              {/* Description Field */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-900 mb-2">
                    Description <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                <div className="relative">
                  <div className="absolute top-3.5 left-3.5 flex items-start pointer-events-none">
                    <Type className="h-5 w-5 text-gray-400" />
                  </div>
                    <textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description of your collaborative workspace"
                      rows={3}
                      className="block w-full pl-11 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-colors text-base resize-y"
                    />
                </div>
                </div>

              {/* Logo Field */}
              <div>
                <label htmlFor="logo" className="block text-sm font-medium text-gray-900 mb-2">
                  Logo URL <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <ImageIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="url"
                    id="logo"
                    value={formData.logo}
                    onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                    placeholder="https://example.com/logo.png"
                    className="block w-full pl-11 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-colors text-base"
                  />
                </div>
              </div>

            </div>

            {/* Footer / Actions */}
            <div className="px-6 py-5 sm:px-8 bg-gray-50 flex items-center justify-end gap-3 rounded-b-2xl border-t border-gray-100">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center px-6 py-3 text-sm font-medium text-white bg-gray-900 border border-transparent rounded-xl hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-[160px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Workspace'
                )}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  )
}
