'use client'
import { useSession, signOut } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import {
  LayoutDashboard,
  Briefcase,
  Globe,
  Users,
  CreditCard,
  Settings,
  Plus,
  LogOut,
  ChevronDown,
  Menu,
  X
} from "lucide-react"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

const SIDEBAR_ITEMS = [
  { label: 'Workspaces', icon: Briefcase, active: true, href: '/dashboard' },
  { label: 'Billing', icon: CreditCard, href: '/dashboard?tab=billing' },
  { label: 'Settings', icon: Settings, href: '/dashboard?tab=settings' },
]

export default function DashboardPage() {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [ownedTenants, setOwnedTenants] = useState([])
  const [sharedTenants, setSharedTenants] = useState([])
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
      <div className="min-h-screen flex items-center justify-center bg-[#fcfdfc]">
        <div className="animate-spin rounded-full h-10 w-10 border-[4px] border-gray-100 border-t-[#0b1411] mb-4" />
      </div>
    )
  }

  if (!session) {
    return null
  }

  const userInitials = session.user.name
    ? session.user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : session.user.email.substring(0, 2).toUpperCase()

  const renderWorkspaceCard = (tenant, isOwner) => (
    <div
      key={tenant.id}
      onClick={() => router.push(`/${tenant.id}`)}
      className="group bg-white border border-gray-200 rounded-[2rem] p-6 lg:p-8 cursor-pointer hover:border-[#0b1411]/20 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] hover:-translate-y-1 transition-all duration-300 flex flex-col relative h-[240px]"
    >
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#f2f4f2] text-[#0b1411] flex items-center justify-center font-black text-xl group-hover:bg-[#d3ff4a] transition-colors">
            {tenant.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#0b1411] transition-colors">{tenant.name}</h3>
            <p className="text-sm text-gray-500 font-medium tracking-tight">/{tenant.slug}</p>
          </div>
        </div>
        <div className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-[10px] font-bold uppercase tracking-widest">
          {isOwner ? "Owner" : tenant.userRole.toLowerCase()}
        </div>
      </div>

      <div className="mt-auto pt-6 border-t border-gray-100 flex items-center gap-6">
        <div className="flex items-center gap-2 text-gray-500 font-medium text-sm">
          <Globe className="w-4 h-4 text-gray-400 group-hover:text-[#0b1411] transition-colors" />
          <span className="group-hover:text-gray-900 transition-colors">{tenant._count.sites} Sites</span>
        </div>
        <div className="flex items-center gap-2 text-gray-500 font-medium text-sm">
          <Users className="w-4 h-4 text-gray-400 group-hover:text-[#0b1411] transition-colors" />
          <span className="group-hover:text-gray-900 transition-colors">{tenant._count.tenantUsers} Members</span>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#fcfdfc] font-sans flex text-gray-900">

      {/* Sidebar Navigation */}
      <aside className="w-72 flex-shrink-0 bg-gradient-to-b from-[#0b1411] to-[#0c1a16] border-r border-white/5 min-h-screen hidden lg:flex flex-col sticky top-0">
        <div className="h-24 flex items-center px-8 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="flex flex-col gap-0.5 w-6">
              <span className="w-5 h-[3px] bg-[#d3ff4a] rounded-full" />
              <span className="w-6 h-[3px] bg-[#00e5ff] rounded-full" />
              <span className="w-4 h-[3px] bg-white rounded-full" />
            </div>
            <span className="text-xl font-black uppercase tracking-tight text-white">SitePilot</span>
          </div>
        </div>

        <div className="px-6 py-8 flex-1">
          <div className="space-y-3">
            {SIDEBAR_ITEMS.map((item) => (
              <button
                key={item.label}
                onClick={() => router.push(item.href || '#')}
                className={`w-full flex items-center py-4 px-5 text-sm font-bold rounded-2xl transition-all ${item.active
                  ? 'bg-[#d3ff4a] text-[#0b1411] shadow-[0_0_20px_rgba(211,255,74,0.15)]'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
              >
                <item.icon className={`h-5 w-5 mr-4 transition-colors ${item.active ? 'text-[#0b1411]' : 'text-gray-500 group-hover:text-white'}`} />
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-white/10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center p-3 rounded-2xl hover:bg-white/5 transition-colors outline-none shrink-0 border border-transparent hover:border-white/10 group">
                <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center text-white font-black border border-white/5 mr-4 shrink-0 group-hover:bg-[#d3ff4a] group-hover:text-[#0b1411] transition-colors">
                  {userInitials}
                </div>
                <div className="flex flex-col items-start flex-1 overflow-hidden min-w-0">
                  <span className="text-sm font-bold leading-none truncate w-full text-white">
                    {session.user.name || session.user.email.split('@')[0]}
                  </span>
                  <span className="text-[11px] font-medium text-gray-400 mt-1.5 truncate w-full">
                    {session.user.email}
                  </span>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-500 ml-2 flex-shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 rounded-2xl p-2 font-sans bg-white border border-gray-100 shadow-xl">
              <DropdownMenuLabel className="text-xs font-bold text-gray-400 uppercase tracking-widest px-2 py-1.5">My Account</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-100 my-2" />
              <DropdownMenuItem className="py-2.5 px-3 rounded-xl text-sm font-bold text-gray-700 cursor-pointer hover:bg-[#f2f4f2] hover:text-[#0b1411]">Profile Settings</DropdownMenuItem>
              <DropdownMenuItem className="py-2.5 px-3 rounded-xl text-sm font-bold text-gray-700 cursor-pointer hover:bg-[#f2f4f2] hover:text-[#0b1411]">Billing</DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-100 my-2" />
              <DropdownMenuItem
                className="py-2.5 px-3 rounded-xl text-sm font-bold cursor-pointer text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={async () => {
                  await signOut()
                  router.push('/signin')
                }}
              >
                <LogOut className="h-4 w-4 mr-3" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto min-h-screen relative">
        {/* Mobile Header */}
        <div className="lg:hidden h-20 flex items-center justify-between px-6 border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <div className="flex flex-col gap-0.5 w-5">
              <span className="w-4 h-[3px] bg-[#d3ff4a] rounded-full" />
              <span className="w-5 h-[3px] bg-[#00e5ff] rounded-full" />
              <span className="w-3 h-[3px] bg-[#0b1411] rounded-full" />
            </div>
          </div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-[#0b1411] p-2">
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <div className="max-w-7xl mx-auto py-12 px-6 sm:px-10 lg:py-20 lg:px-16">

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-16">
            <div>
              <p className="text-[#8bc4b1] text-[10px] font-bold tracking-[0.2em] uppercase mb-4">
                TENANT ECOSYSTEM
              </p>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#1d2321] uppercase tracking-tighter leading-[1]">
                Workspaces
              </h2>
            </div>

            <button onClick={() => router.push('/tenants/new')} className="w-full sm:w-auto bg-[#d3ff4a] text-[#0b1411] h-14 px-8 rounded-full font-bold flex items-center justify-center hover:bg-[#c0eb3f] transition-all active:scale-95 shadow-[0_0_20px_rgba(211,255,74,0.3)] hover:scale-105 duration-200">
              <Plus className="h-5 w-5 mr-2" />
              New Workspace
            </button>
          </div>

          {!session.user.emailVerified && (
            <div className="mb-12 p-6 bg-amber-50 rounded-[1.5rem] border border-amber-100 flex items-start text-amber-900">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500 mt-1.5 mr-4 flex-shrink-0 animate-pulse" />
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider mb-1">Verify Account</h4>
                <p className="text-sm font-medium text-amber-800/80">
                  Please check your inbox for a verification link to fully activate your SitePilot account.
                </p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center border-2 border-gray-100 rounded-[2.5rem] bg-white border-dashed">
              <div className="animate-spin rounded-full h-10 w-10 border-[4px] border-gray-100 border-t-[#0b1411] mb-6" />
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Loading...</p>
            </div>
          ) : ownedTenants.length === 0 && sharedTenants.length === 0 ? (
            <div className="py-32 text-center border-2 border-gray-100 rounded-[2.5rem] bg-white border-dashed px-6 flex flex-col items-center">
              <div className="h-20 w-20 rounded-[2rem] bg-gray-50 border border-gray-100 flex items-center justify-center mb-8">
                <Briefcase className="h-8 w-8 text-gray-300" />
              </div>
              <h3 className="text-2xl font-black text-[#0b1411] tracking-tight">No Workspaces Built</h3>
              <p className="text-base text-gray-500 font-medium mt-3 max-w-sm mx-auto mb-10 leading-relaxed">
                You don't belong to any workspaces yet. Create your very first workspace to begin building.
              </p>
              <button className="h-14 px-8 bg-[#d3ff4a] text-[#0b1411] font-bold rounded-full flex items-center justify-center hover:bg-[#c0eb3f] transition-all hover:scale-105 active:scale-95" onClick={() => router.push('/tenants/new')}>
                <Plus className="h-5 w-5 mr-2" />
                Initialize Workspace
              </button>
            </div>
          ) : (
            <Tabs defaultValue="owned" className="w-full">
              <TabsList className="mb-10 w-full flex flex-wrap gap-2 bg-transparent border-none p-0">
                <TabsTrigger
                  value="owned"
                  className="rounded-full px-8 py-3.5 text-sm font-bold bg-[#f2f4f2] text-gray-500 data-[state=active]:bg-[#1d2321] data-[state=active]:text-white data-[state=active]:shadow-lg transition-all outline-none border-none group"
                >
                  My Workspaces <span className="ml-2 bg-gray-200 text-gray-600 group-data-[state=active]:bg-white/20 group-data-[state=active]:text-white rounded-full px-2 py-0.5 text-xs">{ownedTenants.length}</span>
                </TabsTrigger>
                <TabsTrigger
                  value="shared"
                  className="rounded-full px-8 py-3.5 text-sm font-bold bg-[#f2f4f2] text-gray-500 data-[state=active]:bg-[#1d2321] data-[state=active]:text-white data-[state=active]:shadow-lg transition-all outline-none border-none group"
                >
                  Shared With Me <span className="ml-2 bg-gray-200 text-gray-600 group-data-[state=active]:bg-white/20 group-data-[state=active]:text-white rounded-full px-2 py-0.5 text-xs">{sharedTenants.length}</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="owned" className="mt-0 outline-none">
                {ownedTenants.length === 0 ? (
                  <div className="py-32 text-center border border-gray-200 rounded-[2rem] bg-[#fcfdfc] border-dashed shadow-sm">
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No primary workspaces</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {ownedTenants.map(tenant => renderWorkspaceCard(tenant, true))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="shared" className="mt-0 outline-none">
                {sharedTenants.length === 0 ? (
                  <div className="py-32 text-center border border-gray-200 rounded-[2rem] bg-[#fcfdfc] border-dashed shadow-sm">
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No shared connections</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {sharedTenants.map(tenant => renderWorkspaceCard(tenant, false))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}

        </div>
      </main>
    </div>
  )
}
