'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth-client'

export default function FormsListPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const [forms, setForms] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (!isPending && !session) {
      router.push('/auth/signin')
    }
  }, [session, isPending, router])

  useEffect(() => {
    if (session && params.tenantId) {
      fetchForms()
    }
  }, [session, params.tenantId])

  const fetchForms = async () => {
    try {
      const response = await fetch(`/api/tenants/${params.tenantId}/forms`)
      if (response.ok) {
        const data = await response.json()
        setForms(data.forms)
      }
    } catch (error) {
      console.error('Error fetching forms:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateForm = async (e) => {
    e.preventDefault()
    setCreating(true)

    try {
      const response = await fetch(`/api/tenants/${params.tenantId}/forms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          description: formDescription
        })
      })

      if (response.ok) {
        const data = await response.json()
        router.push(`/${params.tenantId}/forms/${data.form.id}/builder`)
      }
    } catch (error) {
      console.error('Error creating form:', error)
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteForm = async (formId) => {
    if (!confirm('Are you sure you want to delete this form?')) return

    try {
      const response = await fetch(`/api/tenants/${params.tenantId}/forms/${formId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setForms(forms.filter(f => f.id !== formId))
      }
    } catch (error) {
      console.error('Error deleting form:', error)
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
              <h1 className="text-2xl font-bold text-gray-900">Forms</h1>
              <p className="text-sm text-gray-500">Create and manage your forms</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                + Create Form
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
        {/* Create Form Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Form</h2>
              <form onSubmit={handleCreateForm}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Form Name
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Contact Form"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (optional)
                  </label>
                  <textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Form description..."
                    rows="3"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {creating ? 'Creating...' : 'Create Form'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false)
                      setFormName('')
                      setFormDescription('')
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Forms List */}
        {forms.length === 0 ? (
          <div className="bg-white rounded-lg shadow text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900">No forms yet</h3>
            <p className="text-gray-500 mt-2">Get started by creating your first form</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              + Create Form
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {forms.map((form) => (
              <div key={form.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{form.name}</h3>
                      {form.description && (
                        <p className="text-sm text-gray-500 mt-1">{form.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="text-sm text-gray-500 mb-4">
                    <p>Created: {new Date(form.createdAt).toLocaleDateString()}</p>
                    <p>Versions: {form._count?.versions || 0}</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/${params.tenantId}/forms/${form.id}/builder`)}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteForm(form.id)}
                      className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
