'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth-client'

export default function InvitationPage({ params }) {
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const [invitation, setInvitation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [accepting, setAccepting] = useState(false)
  const [token, setToken] = useState(null)

  useEffect(() => {
    const getToken = async () => {
      const resolvedParams = await params
      setToken(resolvedParams.token)
    }
    getToken()
  }, [params])

  useEffect(() => {
    if (token) {
      fetchInvitation()
    }
  }, [token])

  const fetchInvitation = async () => {
    try {
      const response = await fetch(`/api/invitations/${token}`)
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to load invitation')
      } else {
        setInvitation(data.invitation)
      }
    } catch (err) {
      setError('Failed to load invitation')
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async () => {
    if (!session) {
      // Check if user is registered
      try {
        const checkResponse = await fetch(`/api/check-user?email=${invitation.email}`)
        const checkData = await checkResponse.json()
        
        if (checkData.exists) {
          // User is registered, redirect to signin
          router.push(`/auth/signin?redirect=/invitations/${token}`)
        } else {
          // User not registered, redirect to signup
          router.push(`/auth/signup?redirect=/invitations/${token}&email=${encodeURIComponent(invitation.email)}`)
        }
      } catch (err) {
        // Default to signin page
        router.push(`/auth/signin?redirect=/invitations/${token}`)
      }
      return
    }

    setAccepting(true)
    setError('')

    try {
      const response = await fetch(`/api/invitations/${token}`, {
        method: 'POST'
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to accept invitation')
      }

      router.push(`/dashboard`)
    } catch (err) {
      setError(err.message)
    } finally {
      setAccepting(false)
    }
  }

  const handleDecline = () => {
    router.push('/dashboard')
  }

  if (loading || isPending || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading invitation...</p>
        </div>
      </div>
    )
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <div className="text-red-600 text-5xl mb-4">✕</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Invalid Invitation
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white shadow rounded-lg p-8">
          <div className="text-center mb-6">
            {invitation.tenant.logo ? (
              <img 
                src={invitation.tenant.logo} 
                alt={invitation.tenant.name}
                className="h-16 w-16 mx-auto mb-4 rounded"
              />
            ) : (
              <div className="h-16 w-16 mx-auto mb-4 bg-blue-100 rounded flex items-center justify-center">
                <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            )}
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Join {invitation.tenant.name}
            </h2>
            <p className="text-gray-600">
              You've been invited to join this workspace as a <span className="font-semibold">{invitation.role}</span>
            </p>
          </div>

          {!session && (
            <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
              <p className="text-sm text-blue-800">
                You need to sign in or create an account to accept this invitation
              </p>
            </div>
          )}

          {session && !session.user.emailVerified && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-6">
              <p className="text-sm text-yellow-800">
                Please verify your email address before accepting invitations. Check your inbox for a verification link.
              </p>
            </div>
          )}

          {session && session.user.email !== invitation.email && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-6">
              <p className="text-sm text-yellow-800">
                This invitation was sent to <strong>{invitation.email}</strong>, but you're signed in as <strong>{session.user.email}</strong>.
                Please sign in with the correct account.
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={handleDecline}
              disabled={accepting}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Decline
            </button>
            <button
              onClick={handleAccept}
              disabled={accepting || (session && !session.user.emailVerified) || (session && session.user.email !== invitation.email)}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {!session ? 'Sign In to Accept' : accepting ? 'Accepting...' : 'Accept Invitation'}
            </button>
          </div>

          {!session && (
            <p className="mt-4 text-center text-sm text-gray-600">
              Don't have an account?{' '}
              <a href={`/auth/signup?redirect=/invitations/${token}`} className="font-medium text-blue-600 hover:text-blue-500">
                Sign up
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
