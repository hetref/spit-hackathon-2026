'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from '@/lib/auth-client'
import RoleGate from '@/components/RoleGate'
import { ROLE_COLORS, ROLE_LABELS } from '@/lib/permissions'

export default function TenantDashboardPage() {
  const router = useRouter()
  const params = useParams()
  const { data: session, isPending } = useSession()
  const [tenant, setTenant] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [members, setMembers] = useState([])
  const [invitations, setInvitations] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddMember, setShowAddMember] = useState(false)
  const [memberEmail, setMemberEmail] = useState('')
  const [memberRole, setMemberRole] = useState('EDITOR')
  const [addMemberLoading, setAddMemberLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [copiedId, setCopiedId] = useState(null)

  useEffect(() => {
    if (!isPending && !session) {
      router.push('/auth/signin')
    }
  }, [session, isPending, router])

  useEffect(() => {
    if (session && params.tenantId) {
      fetchTenantData()
      fetchMembers()
      fetchInvitations()
    }
  }, [session, params.tenantId])

  const fetchTenantData = async () => {
    try {
      const response = await fetch(`/api/tenants/${params.tenantId}`)
      if (response.ok) {
        const data = await response.json()
        setTenant(data.tenant)
        setUserRole(data.userRole)
      }
    } catch (err) {
      console.error('Error fetching tenant:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchMembers = async () => {
    try {
      const response = await fetch(`/api/tenants/${params.tenantId}/members`)
      if (response.ok) {
        const data = await response.json()
        setMembers(data.members)
      }
    } catch (err) {
      console.error('Error fetching members:', err)
    }
  }

  const fetchInvitations = async () => {
    try {
      const response = await fetch(`/api/tenants/${params.tenantId}/invitations`)
      if (response.ok) {
        const data = await response.json()
        setInvitations(data.invitations)
      }
    } catch (err) {
      console.error('Error fetching invitations:', err)
    }
  }

  const handleAddMember = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')
    setAddMemberLoading(true)

    try {
      const response = await fetch(`/api/tenants/${params.tenantId}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: memberEmail, role: memberRole })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invitation')
      }

      // Show success message with invitation URL if email wasn't sent
      if (data.invitationUrl) {
        setSuccessMessage(`Invitation created! Share this link: ${data.invitationUrl}`)
      } else {
        setSuccessMessage('Invitation sent successfully!')
      }
      
      setMemberEmail('')
      setMemberRole('EDITOR')
      setShowAddMember(false)
      fetchInvitations() // Refresh invitations list
    } catch (err) {
      setError(err.message)
    } finally {
      setAddMemberLoading(false)
    }
  }

  const handleRemoveMember = async (userId) => {
    if (!confirm('Are you sure you want to remove this member?')) return

    try {
      const response = await fetch(
        `/api/tenants/${params.tenantId}/members?userId=${userId}`,
        { method: 'DELETE' }
      )

      if (response.ok) {
        setMembers(members.filter(m => m.userId !== userId))
      }
    } catch (err) {
      console.error('Error removing member:', err)
    }
  }

  const copyInvitationLink = async (token) => {
    const invitationUrl = `${window.location.origin}/api/invitations/${token}/accept`
    try {
      await navigator.clipboard.writeText(invitationUrl)
      setCopiedId(token)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  if (isPending || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Workspace not found</h2>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go to Dashboard
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
              <h1 className="text-2xl font-bold text-gray-900">{tenant.name}</h1>
              <p className="text-sm text-gray-500">/{tenant.slug}</p>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Stats Cards */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Plan</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">{tenant.plan}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Team Members</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">{tenant._count.tenantUsers}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Sites</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">{tenant._count.sites}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Sites</h3>
              <button
                onClick={() => router.push(`/${params.tenantId}/sites`)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View All →
              </button>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              {userRole === 'VIEWER' ? 'View your websites' : 'Create and manage your websites'}
            </p>
            <button
              onClick={() => router.push(`/${params.tenantId}/sites`)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {userRole === 'VIEWER' ? 'View Sites' : 'Manage Sites'}
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Forms</h3>
              <button
                onClick={() => router.push(`/${params.tenantId}/forms`)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View All →
              </button>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              {userRole === 'VIEWER' ? 'View forms' : 'Build custom forms with our form builder'}
            </p>
            <button
              onClick={() => router.push(`/${params.tenantId}/forms`)}
              className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              {userRole === 'VIEWER' ? 'View Forms' : 'Manage Forms'}
            </button>
          </div>
        </div>

        {/* Members Section */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
            <RoleGate role={userRole} permission="members:invite">
              <button
                onClick={() => setShowAddMember(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                + Invite Member
              </button>
            </RoleGate>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="px-6 py-3 bg-green-50 border-b border-green-200">
              <p className="text-sm text-green-800">{successMessage}</p>
            </div>
          )}

          {/* Add Member Form */}
          {showAddMember && (
            <div className="px-6 py-4 bg-blue-50 border-b border-blue-200">
              <form onSubmit={handleAddMember} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded text-sm">
                    {error}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="email"
                    placeholder="member@example.com"
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    required
                    className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={memberRole}
                    onChange={(e) => setMemberRole(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="EDITOR">Editor</option>
                    <option value="VIEWER">Viewer</option>
                    <option value="OWNER">Owner</option>
                  </select>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={addMemberLoading}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {addMemberLoading ? 'Sending...' : 'Send Invite'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddMember(false)
                        setError('')
                        setMemberEmail('')
                        setSuccessMessage('')
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Members List */}
          <div className="divide-y divide-gray-200">
            {members.map((member) => (
              <div key={member.id} className="px-6 py-4 flex justify-between items-center">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                    {member.user.image ? (
                      <img
                        src={member.user.image}
                        alt={member.user.name}
                        className="h-10 w-10 rounded-full"
                      />
                    ) : (
                      <span className="text-gray-600 font-semibold">
                        {member.user.name?.charAt(0).toUpperCase() || '?'}
                      </span>
                    )}
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">{member.user.name}</p>
                    <p className="text-sm text-gray-500">{member.user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${ROLE_COLORS[member.role] || 'bg-gray-100 text-gray-700'}`}>
                    {ROLE_LABELS[member.role] || member.role}
                  </span>
                  <RoleGate role={userRole} permission="members:remove">
                    {member.userId !== tenant.ownerId && (
                      <button
                        onClick={() => handleRemoveMember(member.userId)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </RoleGate>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Invitations */}
        <RoleGate role={userRole} permission="members:invite">
          {invitations.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Pending Invitations</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {invitations.map((invitation) => (
                <div key={invitation.id} className="px-6 py-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{invitation.email}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Invited {new Date(invitation.createdAt).toLocaleDateString()} • Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                        {invitation.role} • PENDING
                      </span>
                      <button
                        onClick={() => copyInvitationLink(invitation.token)}
                        className="px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 border border-blue-300 rounded hover:bg-blue-50"
                        title="Copy invitation link"
                      >
                        {copiedId === invitation.token ? '✓ Copied!' : 'Copy Link'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        </RoleGate>
      </div>
    </div>
  )
}
