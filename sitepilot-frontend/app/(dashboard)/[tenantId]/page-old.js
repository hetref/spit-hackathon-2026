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
            <p className="text-gray-600 text-sm mb-4">Create and manage your websites</p>
            <button
              onClick={() => router.push(`/${params.tenantId}/sites`)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
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
          <p className="text-gray-600 text-sm mb-4">Build custom forms with our form builder</p>
          <button
            onClick={() => router.push(`/${params.tenantId}/forms`)}
            className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Manage Forms
          </button>
        </div>
      </div>

      {/* Members Section */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
          {userRole === 'OWNER' && (
            <button
              onClick={() => setShowAddMember(true)}
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Invite Member
            </button>
            </RoleGate>
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
                  <option value="OWNER">Owner</option>
                </select>
                <div className="flex gap-2">
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
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${member.role === 'OWNER'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-blue-100 text-blue-800'
                  }`}>
                  {member.role}
                </span>
                {userRole === 'OWNER' && member.userId !== tenant.ownerId && (
                  <button
                    onClick={() => handleRemoveMember(member.userId)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
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
    </div >
  )
}
