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
import { hasPermission, ROLE_LABELS, ROLE_COLORS } from '@/lib/permissions'

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
      <div className="min-h-screen flex items-center justify-center bg-[#fcfdfc]">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-[4px] border-gray-100 border-t-[#0b1411] mb-4" />
        </div>
      </div>
    )
  }

  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfdfc]">
        <div className="text-center max-w-sm px-6">
          <div className="bg-red-50 text-red-500 p-5 rounded-[2rem] inline-flex mb-8 shadow-sm">
            <ShieldAlert className="h-10 w-10" />
          </div>
          <h2 className="text-3xl font-black text-[#1d2321] uppercase tracking-tighter mb-3">Workspace Not Found</h2>
          <p className="text-sm font-medium text-gray-500 mb-10 leading-relaxed">This workspace doesn't exist or you don't have access to it.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full py-4 px-6 bg-[#0b1411] text-[#d3ff4a] rounded-full hover:bg-[#1d2321] transition-all font-black uppercase tracking-widest text-xs inline-flex justify-center items-center shadow-lg hover:scale-[1.02] active:scale-95"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fcfdfc] font-sans text-gray-900 text-base pb-20 relative">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="flex items-start sm:items-center gap-6">
              <button
                onClick={() => router.push('/dashboard')}
                className="mt-1 sm:mt-0 p-3 bg-white border border-gray-200 text-gray-400 hover:text-[#0b1411] hover:border-[#0b1411]/20 rounded-2xl transition-all shadow-sm hover:shadow-md focus:outline-none"
                title="Back to Dashboard"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div className="flex flex-row items-center gap-4">
                <div className="h-14 w-14 bg-[#0b1411] text-[#d3ff4a] rounded-2xl flex items-center justify-center overflow-hidden shrink-0 shadow-lg font-black text-xl">
                  {tenant.logo ? (
                    <img src={tenant.logo} alt={tenant.name} className="h-full w-full object-cover" />
                  ) : (
                    <span>{tenant.name.substring(0, 2).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <p className="text-[#8bc4b1] text-[10px] font-bold tracking-[0.2em] uppercase mb-1">
                    WORKSPACE OVERVIEW
                  </p>
                  <h1 className="text-3xl sm:text-4xl font-black text-[#1d2321] uppercase tracking-tighter leading-tight">
                    {tenant.name}
                  </h1>
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1 block">sitepilot.com/{tenant.slug}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-12 space-y-16">

        {/* Quick Actions (Sites & Forms) */}
        <div>
          <h2 className="text-sm font-black text-gray-400 tracking-[0.15em] uppercase mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="group bg-white border border-gray-100 rounded-[2rem] shadow-sm p-6 lg:p-8 flex flex-col hover:border-[#8bc4b1] hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-500 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#d3ff4a]/0 to-[#8bc4b1]/0 group-hover:from-[#d3ff4a]/5 group-hover:to-[#8bc4b1]/5 rounded-bl-[100px] transition-all duration-500 pointer-events-none" />
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 bg-[#0b1411] text-[#d3ff4a] rounded-2xl flex items-center justify-center shadow-lg shadow-black/5 group-hover:bg-[#d3ff4a] group-hover:text-[#0b1411] transition-colors">
                    <Globe className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-black text-[#1d2321] tracking-tight group-hover:text-[#8bc4b1] transition-colors">Sites</h3>
                </div>
              </div>
              <p className="text-gray-500 text-sm font-medium mb-8 flex-1 relative z-10 leading-relaxed max-w-[90%]">
                {hasPermission(userRole, 'sites:create') ? 'Create, launch, and manage your websites.' : 'View your websites.'}
              </p>
              <button
                onClick={() => router.push(`/${params.tenantId}/sites`)}
                className="w-full relative z-10 py-3.5 px-6 bg-[#0b1411] text-[#d3ff4a] text-xs font-black uppercase tracking-widest rounded-full group-hover:bg-[#d3ff4a] group-hover:text-[#0b1411] shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all focus:outline-none"
              >
                {hasPermission(userRole, 'sites:create') ? 'Manage Sites' : 'View Sites'}
              </button>
            </div>

            <div className="group bg-white border border-gray-100 rounded-[2rem] shadow-sm p-6 lg:p-8 flex flex-col hover:border-[#8bc4b1] hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-500 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#00e5ff]/0 to-[#0b1411]/0 group-hover:from-[#00e5ff]/5 group-hover:to-[#0b1411]/5 rounded-bl-[100px] transition-all duration-500 pointer-events-none" />
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 bg-[#f2f4f2] text-[#0b1411] rounded-2xl flex items-center justify-center shadow-inner group-hover:bg-[#00e5ff] transition-colors">
                    <LayoutTemplate className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-black text-[#1d2321] tracking-tight group-hover:text-[#00e5ff] transition-colors">Forms</h3>
                </div>
              </div>
              <p className="text-gray-500 text-sm font-medium mb-8 flex-1 relative z-10 leading-relaxed max-w-[90%]">
                {hasPermission(userRole, 'forms:create') ? 'Build custom forms with the drag-and-drop builder.' : 'View your forms.'}
              </p>
              <button
                onClick={() => router.push(`/${params.tenantId}/forms`)}
                className="w-full relative z-10 py-3.5 px-6 bg-[#f2f4f2] border border-transparent text-[#0b1411] text-xs font-black uppercase tracking-widest rounded-full group-hover:bg-[#0b1411] group-hover:text-[#00e5ff] shadow-inner group-hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all focus:outline-none"
              >
                {hasPermission(userRole, 'forms:create') ? 'Manage Forms' : 'View Forms'}
              </button>
            </div>
          </div>
        </div>

        {/* Workspace Overview Stats */}
        <div>
          <h2 className="text-sm font-black text-gray-400 tracking-[0.15em] uppercase mb-6">Overview Data</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white border border-gray-100 rounded-[2rem] p-6 lg:p-8 shadow-sm flex flex-col justify-between hover:border-[#8bc4b1] transition-all">
              <div className="flex items-center gap-4 mb-8 text-gray-500">
                <div className="h-10 w-10 rounded-2xl bg-[#f2f4f2] text-[#0b1411] flex items-center justify-center">
                  <CreditCard className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#0b1411]">Billing Plan</span>
              </div>
              <div>
                <h3 className="text-3xl font-black tracking-tight text-[#1d2321] capitalize">{tenant.plan.toLowerCase()}</h3>
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-[2rem] p-6 lg:p-8 shadow-sm flex flex-col justify-between hover:border-[#00e5ff] transition-all">
              <div className="flex items-center gap-4 mb-8 text-gray-500">
                <div className="h-10 w-10 rounded-2xl bg-[#f2f4f2] text-[#0b1411] flex items-center justify-center">
                  <Users className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#0b1411]">Team Members</span>
              </div>
              <div>
                <h3 className="text-4xl font-black tracking-tighter text-[#1d2321]">{tenant._count?.tenantUsers || members.length}</h3>
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-[2rem] p-6 lg:p-8 shadow-sm flex flex-col justify-between hover:border-[#d3ff4a] transition-all">
              <div className="flex items-center gap-4 mb-8 text-gray-500">
                <div className="h-10 w-10 rounded-2xl bg-[#f2f4f2] text-[#0b1411] flex items-center justify-center">
                  <Globe className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#0b1411]">Active Sites</span>
              </div>
              <div>
                <h3 className="text-4xl font-black tracking-tighter text-[#1d2321]">{tenant._count?.sites || 0}</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Team Settings */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-sm font-black text-gray-400 tracking-[0.15em] uppercase">User Access</h2>
            {hasPermission(userRole, 'members:invite') && !showAddMember && (
              <button
                onClick={() => setShowAddMember(true)}
                className="inline-flex items-center justify-center px-6 h-10 text-xs font-black uppercase tracking-widest text-[#d3ff4a] bg-[#0b1411] rounded-full hover:bg-[#1d2321] transition-all hover:scale-105 active:scale-95 shadow-lg focus:outline-none"
              >
                <Plus className="h-4 w-4 mr-2" />
                Invite Member
              </button>
            )}
          </div>

          <div className="bg-white border border-gray-100 rounded-[2rem] shadow-sm overflow-hidden relative">

            {/* Success Message */}
            {successMessage && (
              <div className="px-8 py-6 bg-emerald-50 border-b border-emerald-100 flex items-start">
                <ShieldCheck className="h-5 w-5 text-emerald-600 mt-0.5 mr-3 flex-shrink-0" />
                <p className="text-sm font-bold text-emerald-800">{successMessage}</p>
              </div>
            )}

            {/* Add Member Form */}
            {showAddMember && (
              <div className="p-8 bg-[#fcfdfc] border-b border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-[#0b1411]">Invite new team member</h3>
                  <button
                    onClick={() => {
                      setShowAddMember(false)
                      setError('')
                      setMemberEmail('')
                      setSuccessMessage('')
                    }}
                    className="text-xs text-gray-400 font-bold uppercase tracking-widest hover:text-[#0b1411] transition-colors"
                  >
                    Cancel
                  </button>
                </div>

                <form onSubmit={handleAddMember} className="space-y-4">
                  {error && (
                    <div className="bg-red-50 border border-red-100 text-red-600 px-5 py-4 rounded-2xl flex items-start text-sm">
                      <ShieldAlert className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0" />
                      <p className="font-bold">{error}</p>
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        placeholder="member@example.com"
                        value={memberEmail}
                        onChange={(e) => setMemberEmail(e.target.value)}
                        required
                        className="pl-12 block w-full px-5 py-3.5 bg-[#f2f4f2] border-none rounded-2xl text-[#0b1411] font-bold placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0b1411]/20 transition-all text-sm shadow-inner"
                      />
                    </div>
                    <div className="sm:w-48 relative">
                      <select
                        value={memberRole}
                        onChange={(e) => setMemberRole(e.target.value)}
                        className="block w-full px-5 py-3.5 bg-[#f2f4f2] border-none rounded-2xl text-[#0b1411] font-bold focus:outline-none focus:ring-2 focus:ring-[#0b1411]/20 transition-all text-sm appearance-none cursor-pointer shadow-inner"
                      >
                        <option value="EDITOR">Editor</option>
                        <option value="VIEWER">Viewer</option>
                        <option value="OWNER">Owner</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      disabled={addMemberLoading}
                      className="inline-flex items-center justify-center px-8 py-3.5 text-xs font-black uppercase tracking-widest text-[#0b1411] bg-[#d3ff4a] rounded-full hover:bg-[#c0eb3f] hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(211,255,74,0.3)] transition-all min-w-[140px]"
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
                <li key={member.id} className="p-6 lg:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-5">
                    <div className="h-12 w-12 rounded-2xl border border-gray-100 bg-[#f2f4f2] text-[#0b1411] flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm">
                      {member.user.image ? (
                        <img
                          src={member.user.image}
                          alt={member.user.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="font-black text-lg">
                          {(member.user.name || member.user.email).charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#1d2321]">
                        {member.user.name || 'Unknown User'}
                        {member.userId === session.user.id && (
                          <span className="ml-2 text-[10px] font-black uppercase tracking-widest text-[#8bc4b1]">(You)</span>
                        )}
                      </p>
                      <p className="text-xs font-medium text-gray-500 mt-0.5">{member.user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 justify-between sm:justify-end">
                    <span className="inline-flex items-center px-3 py-1.5 bg-[#f2f4f2] text-gray-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-gray-100">
                      {ROLE_LABELS[member.role] || member.role}
                    </span>

                    {hasPermission(userRole, 'members:remove') && member.userId !== tenant.ownerId && (
                      <button
                        onClick={() => handleRemoveMember(member.userId)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
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
        {hasPermission(userRole, 'members:invite') && invitations.length > 0 && (
          <div>
            <h2 className="text-sm font-black text-gray-400 tracking-[0.15em] uppercase mb-6 mt-16">Pending Invitations</h2>
            <div className="bg-white border border-gray-100 rounded-[2rem] shadow-sm overflow-hidden relative">
              <ul className="divide-y divide-gray-100">
                {invitations.map((invitation) => (
                  <li key={invitation.id} className="p-6 lg:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-[#1d2321]">{invitation.email}</p>
                        <div className="mt-1.5 flex items-center text-xs font-black uppercase tracking-widest text-[#8bc4b1] space-x-2">
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            Invited {new Date(invitation.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 self-start sm:self-center">
                      <span className="inline-flex items-center px-3 py-1.5 bg-[#f2f4f2] text-gray-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-gray-100">
                        {invitation.role.toLowerCase()} • Pending
                      </span>
                      <button
                        onClick={() => copyInvitationLink(invitation.token)}
                        className="px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-[#0b1411] bg-[#d3ff4a] rounded-full hover:bg-[#c0eb3f] transition-colors shadow-sm focus:outline-none"
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
