'use client'
import { useSession } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function DashboardPage() {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !isPending && !session) {
      router.push('/auth/signin')
    }
  }, [session, isPending, router, mounted])

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
                await fetch('/api/auth/signout', { method: 'POST' })
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
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Welcome to Your Dashboard</h2>
          
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded p-4">
              <h3 className="font-semibold text-blue-900">User Information</h3>
              <dl className="mt-2 space-y-2 text-sm text-blue-800">
                <div>
                  <dt className="font-medium">Email:</dt>
                  <dd>{session.user.email}</dd>
                </div>
                <div>
                  <dt className="font-medium">Name:</dt>
                  <dd>{session.user.name || 'Not set'}</dd>
                </div>
                <div>
                  <dt className="font-medium">Email Verified:</dt>
                  <dd className={session.user.emailVerified ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                    {session.user.emailVerified ? '✓ Yes' : '✗ No'}
                  </dd>
                </div>
              </dl>
            </div>

            {!session.user.emailVerified && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                <h3 className="font-semibold text-yellow-900">Email Not Verified</h3>
                <p className="mt-2 text-sm text-yellow-800">
                  Please check your email for a verification link to complete your account setup.
                </p>
              </div>
            )}

            <div className="bg-green-50 border border-green-200 rounded p-4">
              <h3 className="font-semibold text-green-900">Your Account is Active</h3>
              <p className="mt-2 text-sm text-green-800">
                You can now start using DevAlly. More features coming soon!
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
