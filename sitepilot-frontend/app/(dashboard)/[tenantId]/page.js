'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from '@/lib/auth-client'
import {
  ArrowLeft,
  Users,
  Globe,
  CreditCard,
  Plus,
  Mail,
  ShieldAlert,
  ShieldCheck,
  UserX,
  Clock,
  Loader2,
  LayoutTemplate
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
          <Loader2 className="h-10 w-10 animate-spin text-gray-400 mb-4" />
        </div>
      </div>
    )
  }

  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFDFD]">
        <div className="text-center max-w-sm px-6">
          <div className="bg-red-50 text-red-600 p-4 rounded-full inline-flex mb-6">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Workspace Not Found</h2>
          <p className="text-gray-500 mb-8">This workspace doesn't exist or you don't have access to it.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full py-3 px-4 bg-gray-900 border border-transparent text-white rounded-xl hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors font-medium inline-flex justify-center items-center"
          >
            <ArrowLeft className="h-5 w-5 mr-2 -ml-1" />
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
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 -ml-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
                title="Back to Dashboard"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-3 border-l border-gray-200 pl-4">
                <div className="h-8 w-8 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                  {tenant.logo ? (
                    <img src={tenant.logo} alt={tenant.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-gray-500 font-semibold text-sm">{tenant.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <h1 className="text-lg font-semibold tracking-tight text-gray-900 leading-tight">
                    {tenant.name}
                  </h1>
                  <span className="text-sm text-gray-500">sitepilot.com/{tenant.slug}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 py-10 space-y-12">

        {/* Quick Actions (Sites & Forms) */}
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 flex flex-col hover:border-gray-300 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-gray-700">
                    <Globe className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900">Sites</h3>
                </div>
                <button
                  onClick={() => router.push(`/${params.tenantId}/sites`)}
                  className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
                >
                  View All →
                </button>
              </div>
              <p className="text-gray-500 text-sm mb-6 flex-1">Create, launch, and manage your websites.</p>
              <button
                onClick={() => router.push(`/${params.tenantId}/sites`)}
                className="w-full py-2.5 px-4 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-1"
              >
                Manage Sites
              </button>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 flex flex-col hover:border-gray-300 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-gray-700">
                    <LayoutTemplate className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900">Forms</h3>
                </div>
                <button
                  onClick={() => router.push(`/${params.tenantId}/forms`)}
                  className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
                >
                  View All →
                </button>
              </div>
              <p className="text-gray-500 text-sm mb-6 flex-1">Build custom forms with the drag-and-drop builder.</p>
              <button
                onClick={() => router.push(`/${params.tenantId}/forms`)}
                className="w-full py-2.5 px-4 bg-white border border-gray-200 text-gray-900 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-1"
              >
                Manage Forms
              </button>
            </div>
          </div>
        </div>

        {/* Workspace Overview Stats */}
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-gray-900 mb-4">Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-3 mb-4 text-gray-500">
                <CreditCard className="h-5 w-5" />
                <span className="text-sm font-medium">Billing Plan</span>
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-gray-900 capitalize">{tenant.plan.toLowerCase()}</h3>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-3 mb-4 text-gray-500">
                <Users className="h-5 w-5" />
                <span className="text-sm font-medium">Team Members</span>
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-gray-900">{tenant._count?.tenantUsers || members.length}</h3>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-3 mb-4 text-gray-500">
                <Globe className="h-5 w-5" />
                <span className="text-sm font-medium">Active Sites</span>
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-gray-900">{tenant._count?.sites || 0}</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Team Settings */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <h2 className="text-lg font-semibold tracking-tight text-gray-900">Team Setting</h2>
            {userRole === 'OWNER' && !showAddMember && (
              <button
                onClick={() => setShowAddMember(true)}
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Invite Member
              </button>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">

            {/* Success Message */}
            {successMessage && (
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-start">
                <ShieldCheck className="h-5 w-5 text-gray-900 mt-0.5 mr-3 flex-shrink-0" />
                <p className="text-sm font-medium text-gray-900">{successMessage}</p>
              </div>
            )}

            {/* Add Member Form */}
            {showAddMember && (
              <div className="p-6 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-medium text-gray-900">Invite new team member</h3>
                  <button
                    onClick={() => {
                      setShowAddMember(false)
                      setError('')
                      setMemberEmail('')
                      setSuccessMessage('')
                    }}
                    className="text-sm text-gray-500 hover:text-gray-900 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>

                <form onSubmit={handleAddMember} className="space-y-4">
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl flex items-start text-sm">
                      <ShieldAlert className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0" />
                      <p className="font-medium">{error}</p>
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        placeholder="member@example.com"
                        value={memberEmail}
                        onChange={(e) => setMemberEmail(e.target.value)}
                        required
                        className="pl-9 block w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-colors text-sm"
                      />
                    </div>
                    <div className="sm:w-40 relative">
                      <select
                        value={memberRole}
                        onChange={(e) => setMemberRole(e.target.value)}
                        className="block w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-colors text-sm appearance-none cursor-pointer"
                      >
                        <option value="EDITOR">Editor</option>
                        <option value="OWNER">Owner</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      disabled={addMemberLoading}
                      className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-medium text-white bg-gray-900 border border-transparent rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-[120px]"
                    >
                      {addMemberLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Invite'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Members List */}
            <ul className="divide-y divide-gray-100">
              {members.map((member) => (
                <li key={member.id} className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full border border-gray-200 bg-white flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm">
                      {member.user.image ? (
                        <img
                          src={member.user.image}
                          alt={member.user.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-500 font-medium text-sm">
                          {(member.user.name || member.user.email).charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {member.user.name || 'Unknown User'}
                        {member.userId === session.user.id && (
                          <span className="ml-2 text-xs font-normal text-gray-500">(You)</span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500">{member.user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 justify-between sm:justify-end">
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                      {member.role === 'OWNER' ? 'Owner' : 'Editor'}
                    </span>

                    {userRole === 'OWNER' && member.userId !== tenant.ownerId && (
                      <button
                        onClick={() => handleRemoveMember(member.userId)}
                        className="p-1.5 text-gray-400 hover:text-gray-900 rounded-md transition-colors"
                        title="Remove member"
                      >
                        <UserX className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Pending Invitations Section */}
        {userRole === 'OWNER' && invitations.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-gray-900 mb-4">Pending Invitations</h2>
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <ul className="divide-y divide-gray-100">
                {invitations.map((invitation) => (
                  <li key={invitation.id} className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{invitation.email}</p>
                        <div className="mt-1 flex items-center text-xs text-gray-500 space-x-2">
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            Invited {new Date(invitation.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 self-start sm:self-center">
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200 capitalize">
                        {invitation.role.toLowerCase()} • Pending
                      </span>
                      <button
                        onClick={() => copyInvitationLink(invitation.token)}
                        className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                        title="Copy invitation link"
                      >
                        {copiedId === invitation.token ? 'Copied' : 'Copy URL'}
                      </button>
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
