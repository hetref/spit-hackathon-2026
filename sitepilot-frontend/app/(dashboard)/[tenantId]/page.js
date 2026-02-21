'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from '@/lib/auth-client'
import {
  ArrowLeft,
  Users,
  Globe,
  CreditCard,
  MoreVertical,
  Plus,
  Mail,
  ShieldAlert,
  ShieldCheck,
  UserX,
  Clock,
  Loader2
} from 'lucide-react'

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
    const invitationUrl = `${window.location.origin}/invitations/${token}`
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
      <div className="min-h-screen flex items-center justify-center bg-[#FDFDFD]">
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 animate-spin text-gray-500 mb-4" />
        </div>
      </div>
    )
  }

  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFDFD]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Workspace not found</h2>
          <p className="text-gray-500 mb-6">The workspace you are looking for does not exist or you don't have access.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-medium text-base inline-flex items-center"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-sans text-gray-900 text-base">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 py-5 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 -ml-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Back to Dashboard"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">{tenant.name}</h1>
                <p className="text-sm sm:text-base text-gray-500 mt-0.5">/{tenant.slug}</p>
              </div>
            </div>
            {/* Additional actions if needed can go here */}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 py-8 sm:py-12">
        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex items-start gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <CreditCard className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Current Plan</p>
              <h3 className="text-2xl font-bold capitalize">{tenant.plan.toLowerCase()}</h3>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex items-start gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Team Members</p>
              <h3 className="text-2xl font-bold">{tenant._count.tenantUsers}</h3>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex items-start gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Globe className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Active Sites</p>
              <h3 className="text-2xl font-bold">{tenant._count.sites}</h3>
            </div>
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
            <p className="text-gray-600 text-sm mb-4">Create and manage your websites</p>
            <button
              onClick={() => router.push(`/${params.tenantId}/sites`)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Manage Sites
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
            <p className="text-gray-600 text-sm mb-4">Build custom forms with our form builder</p>
            <button
              onClick={() => router.push(`/${params.tenantId}/forms`)}
              className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Manage Forms
            </button>
          </div>
        </div>

        {/* Members Section Content */}
        <div className="mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Team Members</h2>
            {userRole === 'OWNER' && !showAddMember && (
              <button
                onClick={() => setShowAddMember(true)}
                className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Invite Member
              </button>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">

            {/* Success Message */}
            {successMessage && (
              <div className="px-6 py-4 bg-emerald-50 border-b border-emerald-200 flex items-start">
                <ShieldCheck className="h-5 w-5 text-emerald-600 mt-0.5 mr-3 flex-shrink-0" />
                <p className="text-sm font-medium text-emerald-800">{successMessage}</p>
              </div>
            )}

            {/* Add Member Form */}
            {showAddMember && (
              <div className="p-6 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold">Invite new team member</h3>
                  <button
                    onClick={() => {
                      setShowAddMember(false)
                      setError('')
                      setMemberEmail('')
                      setSuccessMessage('')
                    }}
                    className="text-sm text-gray-500 hover:text-gray-900 font-medium"
                  >
                    Cancel
                  </button>
                </div>

                <form onSubmit={handleAddMember} className="space-y-4">
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start text-sm">
                      <ShieldAlert className="h-4 w-4 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
                      <p className="font-medium">{error}</p>
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        placeholder="member@example.com"
                        value={memberEmail}
                        onChange={(e) => setMemberEmail(e.target.value)}
                        required
                        className="pl-10 block w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-colors text-base"
                      />
                    </div>
                    <div className="sm:w-48">
                      <select
                        value={memberRole}
                        onChange={(e) => setMemberRole(e.target.value)}
                        className="block w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-colors text-base appearance-none cursor-pointer"
                      >
                        <option value="EDITOR">Editor</option>
                        <option value="OWNER">Owner</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      disabled={addMemberLoading}
                      className="inline-flex items-center justify-center px-6 py-2.5 text-base font-medium text-white bg-gray-900 border border-transparent rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-[140px]"
                    >
                      {addMemberLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Send Invite'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Members List */}
            <ul className="divide-y divide-gray-100">
              {members.map((member) => (
                <li key={member.id} className="p-6 sm:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full border border-gray-200 bg-gray-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {member.user.image ? (
                        <img
                          src={member.user.image}
                          alt={member.user.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-600 font-semibold text-lg">
                          {(member.user.name || member.user.email).charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-base font-semibold text-gray-900">
                        {member.user.name || 'Unknown User'}
                        {member.userId === session.user.id && (
                          <span className="ml-2 text-xs font-normal text-gray-500">(You)</span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500">{member.user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 justify-between sm:justify-end">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${member.role === 'OWNER'
                        ? 'bg-gray-900 text-white border-transparent'
                        : 'bg-gray-100 text-gray-600 border-gray-200'
                      }`}>
                      {member.role === 'OWNER' ? 'Owner' : 'Editor'}
                    </span>

                    {userRole === 'OWNER' && member.userId !== tenant.ownerId && (
                      <button
                        onClick={() => handleRemoveMember(member.userId)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove member"
                      >
                        <UserX className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Pending Invitations */}
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
        {/* Pending Invitations Section */}
        {userRole === 'OWNER' && invitations.length > 0 && (
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-6">Pending Invitations</h2>
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <ul className="divide-y divide-gray-100">
                {invitations.map((invitation) => (
                  <li key={invitation.id} className="p-6 sm:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-base font-semibold text-gray-900">{invitation.email}</p>
                        <div className="mt-1 flex items-center text-sm text-gray-500 space-x-2">
                          <span className="flex items-center"><Clock className="h-4 w-4 mr-1.5" /> Invited {new Date(invitation.createdAt).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>Expires {new Date(invitation.expiresAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center self-start sm:self-center">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border bg-amber-50 text-amber-700 border-amber-200 capitalize">
                        {invitation.role.toLowerCase()} • Pending
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
