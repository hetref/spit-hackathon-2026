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
  MoreVertical,
  LogOut,
  ChevronDown
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

const SIDEBAR_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, active: true },
  { label: 'Workspaces', icon: Briefcase },
  { label: 'Sites', icon: Globe },
  { label: 'Team', icon: Users },
  { label: 'Billing', icon: CreditCard },
  { label: 'Settings', icon: Settings },
]

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
      <div className="min-h-screen flex items-center justify-center bg-[#FDFDFD]">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-[4px] border-muted border-t-primary mb-4" />
        </div>
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
    <Card
      key={tenant.id}
      className="group relative cursor-pointer hover:shadow-md transition-shadow duration-200 border-muted rounded-2xl flex flex-col"
      onClick={() => router.push(`/${tenant.id}`)}
    >
      <CardHeader className="pb-5 pt-6 px-6 sm:px-8">
        <div className="flex flex-row items-start justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <Avatar className="h-14 w-14 sm:h-16 sm:w-16 border border-muted flex-shrink-0">
              <AvatarFallback className="bg-primary/5 text-primary text-xl font-medium">
                {tenant.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-xl sm:text-2xl font-bold text-foreground group-hover:text-primary transition-colors truncate">
                {tenant.name}
              </CardTitle>
              <CardDescription className="text-base mt-1 truncate">
                {tenant.slug}
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            <Badge variant={isOwner ? "default" : "secondary"} className="font-medium text-sm sm:text-base px-3 py-1">
              {isOwner ? "Owner" : tenant.userRole.toLowerCase()}
            </Badge>
            <div onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-foreground">
                    <MoreVertical className="h-5 w-5" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 text-base">
                  <DropdownMenuLabel className="text-base text-muted-foreground font-medium">Actions</DropdownMenuLabel>
                  <DropdownMenuItem className="py-2.5 text-base" onClick={() => router.push(`/${tenant.id}`)}>
                    View Workspace
                  </DropdownMenuItem>
                  <DropdownMenuItem className="py-2.5 text-base" onClick={() => router.push(`/${tenant.id}/settings`)}>
                    Settings
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </CardHeader>

      <div className="mt-auto">
        <Separator className="bg-muted/60" />

        <CardContent className="pt-5 pb-6 px-6 sm:px-8">
          <div className="flex flex-wrap items-center gap-6 sm:gap-8 text-base text-muted-foreground font-medium">
            <div className="flex items-center gap-2.5">
              <Globe className="h-5 w-5" />
              <span>{tenant._count.sites} Sites</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Users className="h-5 w-5" />
              <span>{tenant._count.tenantUsers} Members</span>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  )

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-sans flex text-foreground">

      {/* Sidebar Navigation */}
      <aside className="w-72 flex-shrink-0 border-r border-muted bg-white min-h-screen hidden lg:flex flex-col sticky top-0">
        <div className="h-24 flex items-center px-8 border-b border-muted">
          <h1 className="text-2xl font-bold tracking-tight">SitePilot</h1>
        </div>

        <div className="px-6 py-8 flex-1">
          <div className="space-y-2">
            {SIDEBAR_ITEMS.map((item) => (
              <Button
                key={item.label}
                variant={item.active ? "secondary" : "ghost"}
                className={`w-full justify-start py-6 px-4 text-base rounded-xl ${item.active ? 'bg-muted/50 font-medium' : 'text-muted-foreground hover:bg-muted/30 hover:text-foreground'}`}
              >
                <item.icon className="h-6 w-6 mr-4" />
                {item.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-muted">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start h-auto p-3 rounded-xl hover:bg-muted/30">
                <Avatar className="h-12 w-12 mr-4 border border-muted">
                  <AvatarFallback className="bg-primary/5 text-sm font-semibold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start flex-1 overflow-hidden min-w-0">
                  <span className="text-base font-medium leading-none truncate w-full">
                    {session.user.name || session.user.email.split('@')[0]}
                  </span>
                  <span className="text-sm text-muted-foreground mt-1.5 truncate w-full">
                    {session.user.email}
                  </span>
                </div>
                <ChevronDown className="h-5 w-5 text-muted-foreground ml-2 flex-shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel className="text-base text-muted-foreground">My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="py-2.5 text-base">Profile Settings</DropdownMenuItem>
              <DropdownMenuItem className="py-2.5 text-base">Billing</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="py-2.5 text-base text-red-600 focus:text-red-700 focus:bg-red-50"
                onClick={async () => {
                  await signOut()
                  router.push('/auth/signin')
                }}
              >
                <LogOut className="h-5 w-5 mr-3" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto min-h-screen">
        {/* Mobile Header */}
        <div className="lg:hidden h-20 flex items-center justify-between px-6 border-b border-muted bg-white sticky top-0 z-10">
          <h1 className="text-2xl font-bold tracking-tight">SitePilot</h1>
          <Avatar className="h-10 w-10 border border-muted" onClick={async () => {
            await signOut()
            router.push('/auth/signin')
          }}>
            <AvatarFallback className="bg-primary/5 text-sm">
              {userInitials}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="max-w-7xl mx-auto py-12 px-6 sm:px-10 lg:py-16 lg:px-12">

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-12">
            <div>
              <h2 className="text-4xl lg:text-5xl font-bold tracking-tight">Workspaces</h2>
              <p className="text-base lg:text-lg text-muted-foreground mt-3">Manage your team's projects and website deployments.</p>
            </div>

            <Button size="lg" onClick={() => router.push('/tenants/new')} className="sm:w-auto w-full text-base h-14 px-8 rounded-xl font-medium">
              <Plus className="h-5 w-5 mr-3" />
              New Workspace
            </Button>
          </div>

          {!session.user.emailVerified && (
            <div className="mb-10 p-5 bg-amber-50 rounded-xl border border-amber-200 flex items-start text-amber-900">
              <div className="w-2 h-2 rounded-full bg-amber-500 mt-2.5 mr-4 flex-shrink-0" />
              <div>
                <h4 className="text-base font-semibold">Verify your email address</h4>
                <p className="text-base mt-1.5 text-amber-800/80">
                  Please check your inbox for a verification link to fully activate your account.
                </p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="py-24 text-center flex flex-col items-center justify-center border border-muted rounded-2xl bg-white border-dashed">
              <div className="animate-spin rounded-full h-10 w-10 border-[4px] border-muted border-t-primary mb-6" />
              <p className="text-base font-medium text-muted-foreground">Loading workspaces...</p>
            </div>
          ) : ownedTenants.length === 0 && sharedTenants.length === 0 ? (
            <div className="py-32 text-center border border-muted rounded-2xl bg-white border-dashed px-6 flex flex-col items-center">
              <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-6">
                <Briefcase className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">No workspaces found</h3>
              <p className="text-base text-muted-foreground mt-3 max-w-md mx-auto mb-8">
                You don't belong to any workspaces yet. Create your first workspace to get started.
              </p>
              <Button size="lg" className="h-14 px-8 text-base rounded-xl" onClick={() => router.push('/tenants/new')}>
                <Plus className="h-5 w-5 mr-3" />
                Create Workspace
              </Button>
            </div>
          ) : (
            <Tabs defaultValue="owned" className="w-full">
              <TabsList className="mb-8 w-full sm:w-auto justify-start bg-transparent border-b border-muted pb-0 rounded-none h-auto p-0 gap-6">
                <TabsTrigger
                  value="owned"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent px-2 py-3 text-lg sm:text-lg font-medium tracking-tight"
                >
                  Owner ({ownedTenants.length})
                </TabsTrigger>
                <TabsTrigger
                  value="shared"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent px-2 py-3 text-lg sm:text-lg font-medium tracking-tight"
                >
                  Shared ({sharedTenants.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="owned" className="mt-0 outline-none">
                {ownedTenants.length === 0 ? (
                  <div className="py-24 text-center border border-muted rounded-2xl bg-white/50 border-dashed">
                    <p className="text-lg text-muted-foreground">You don't own any workspaces.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
                    {ownedTenants.map(tenant => renderWorkspaceCard(tenant, true))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="shared" className="mt-0 outline-none">
                {sharedTenants.length === 0 ? (
                  <div className="py-24 text-center border border-muted rounded-2xl bg-white/50 border-dashed">
                    <p className="text-lg text-muted-foreground">No workspaces have been shared with you.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
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
