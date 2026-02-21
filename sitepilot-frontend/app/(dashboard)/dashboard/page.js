'use client'
import { useSession, signOut } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function DashboardPage() {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [ownedTenants, setOwnedTenants] = useState([])
  const [sharedTenants, setSharedTenants] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !isPending && !session) {
      router.push('/auth/signin')
    }
  }, [session, isPending, router, mounted])

  useEffect(() => {
    if (session) {
      fetchTenants()
    }
  }, [session])

  const fetchTenants = async () => {
    try {
      const response = await fetch('/api/tenants')
      if (response.ok) {
        const data = await response.json()
        const owned = data.tenants.filter(t => t.userRole === 'OWNER')
        const shared = data.tenants.filter(t => t.userRole !== 'OWNER')
        setOwnedTenants(owned)
        setSharedTenants(shared)
      }
    } catch (error) {
      console.error('Error fetching tenants:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!mounted || isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">DevAlly</h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">{session.user.email}</span>
            <button
              onClick={async () => {
                await signOut()
                router.push('/auth/signin')
              }}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Welcome, {session.user.name || session.user.email}!</h2>

          {!session.user.emailVerified && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-4">
              <h3 className="font-semibold text-yellow-900">Email Not Verified</h3>
              <p className="mt-2 text-sm text-yellow-800">
                Please check your email for a verification link to complete your account setup.
              </p>
            </div>
          )}
        </div>

        {/* Workspaces Section */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Owned Workspaces</h2>
            <button
              onClick={() => router.push('/tenants/new')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              + New Workspace
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
            </div>
          ) : ownedTenants.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No owned workspaces</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new workspace.</p>
              <div className="mt-6">
                <button
                  onClick={() => router.push('/tenants/new')}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  + Create Workspace
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ownedTenants.map((tenant) => (
                <div
                  key={tenant.id}
                  onClick={() => router.push(`/${tenant.id}`)}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{tenant.name}</h3>
                      <p className="text-sm text-gray-500">/{tenant.slug}</p>
                    </div>
                    <span className="px-2 py-1 text-xs font-semibold rounded bg-purple-100 text-purple-800">
                      OWNER
                    </span>
                  </div>
                  <div className="mt-4 flex items-center text-sm text-gray-600">
                    <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    {tenant._count.tenantUsers} members
                    <span className="mx-2">•</span>
                    <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {tenant._count.sites} sites
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Plan: <span className="font-semibold">{tenant.plan}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Shared Workspaces Section */}
        {sharedTenants.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Shared Workspaces</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sharedTenants.map((tenant) => (
                <div
                  key={tenant.id}
                  onClick={() => router.push(`/${tenant.id}`)}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{tenant.name}</h3>
                      <p className="text-sm text-gray-500">/{tenant.slug}</p>
                    </div>
                    <span className="px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800">
                      {tenant.userRole}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center text-sm text-gray-600">
                    <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    {tenant._count.tenantUsers} members
                    <span className="mx-2">•</span>
                    <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {tenant._count.sites} sites
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Plan: <span className="font-semibold">{tenant.plan}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
