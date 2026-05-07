import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Compass,
  Scissors,
  Wallet,
  User,
  LogOut,
  type LucideIcon,
  ArrowLeftRight,
  Building2,
  Video,
  ClipboardList,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore, type UserRole } from '@/lib/stores/authStore'
import { useAuth } from '@/lib/hooks/use-auth'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  to: string
  icon: LucideIcon
}

const CLIPPER_NAV: NavItem[] = [
  { label: 'Dashboard', to: '/clipper/dashboard', icon: LayoutDashboard },
  { label: 'Discover', to: '/clipper/campaigns', icon: Compass },
  { label: 'My Clips', to: '/clipper/clips', icon: Scissors },
  { label: 'Earnings', to: '/clipper/earnings', icon: Wallet },
  { label: 'Account', to: '/clipper/account', icon: User },
]

const BRAND_NAV: NavItem[] = [
  { label: 'Dashboard', to: '/brand/dashboard', icon: LayoutDashboard },
  { label: 'Campaigns', to: '/brand/campaigns', icon: Video },
  { label: 'Clip submissions', to: '/brand/submissions', icon: ClipboardList },
  { label: 'Account', to: '/brand/account', icon: User },
]

interface AppSidebarProps {
  role: UserRole
}

function getInitials(name?: string, email?: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/)
    return parts
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('')
  }
  if (email) return email[0]?.toUpperCase() ?? 'U'
  return 'U'
}

export function AppSidebar({ role }: AppSidebarProps) {
  const navigation = role === 'brand' ? BRAND_NAV : CLIPPER_NAV
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const setRole = useAuthStore((s) => s.setRole)
  const signOut = useAuthStore((s) => s.signOut)

  function handleSignOut() {
    signOut()
    toast.success('Signed out')
    navigate('/auth', { replace: true })
  }

  function handleSwitchRole() {
    const next: UserRole = role === 'brand' ? 'clipper' : 'brand'
    setRole(next)
    navigate(next === 'brand' ? '/brand/dashboard' : '/clipper/dashboard', { replace: true })
    toast.success(`Switched to ${next === 'brand' ? 'Brand' : 'Creator'}`)
  }

  const userInitials = getInitials(user?.name, user?.email)
  const displayName = user?.name || user?.email?.split('@')[0] || 'You'

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden h-dvh min-h-dvh w-64 shrink-0 flex-col overflow-hidden bg-sidebar text-sidebar-foreground border-r border-sidebar-border md:flex">
        <div className="flex items-center px-6 h-16 border-b border-sidebar-border">
          <div className="leading-tight">
            <div className="font-display text-base font-extrabold">Arpify</div>
            <div className="text-[10px] uppercase tracking-widest text-sidebar-foreground/60">
              {role === 'brand' ? 'Brand' : 'Creator'}
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive =
              location.pathname === item.to || location.pathname.startsWith(item.to + '/')
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-white shadow-[rgba(0,0,0,0.12)_0px_3px_8px_0px]'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
                {isActive && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white" />
                )}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-sidebar-accent/60 transition-colors text-left">
                <Avatar className="h-9 w-9 border border-sidebar-border">
                  <AvatarImage src={user?.avatarUrl} />
                  <AvatarFallback className="bg-phc-gradient text-white text-xs font-bold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{displayName}</p>
                  <p className="truncate text-[11px] text-sidebar-foreground/60">{user?.email}</p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Signed in as</span>
                  <span className="text-sm truncate">{user?.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSwitchRole} className="cursor-pointer">
                {role === 'brand' ? (
                  <>
                    <Scissors className="h-4 w-4" /> Switch to Creator
                  </>
                ) : (
                  <>
                    <Building2 className="h-4 w-4" /> Switch to Brand
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleSignOut}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-sidebar text-sidebar-foreground border-t border-sidebar-border">
        <div className="grid" style={{ gridTemplateColumns: `repeat(${navigation.length}, 1fr)` }}>
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive =
              location.pathname === item.to || location.pathname.startsWith(item.to + '/')
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'flex flex-col items-center gap-1 py-3 text-[10px] font-medium',
                  isActive ? 'text-primary' : 'text-sidebar-foreground/60'
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between bg-background/90 backdrop-blur border-b border-border px-4 h-14">
        <Link to="/" className="flex items-center">
          <span className="font-display font-extrabold">Arpify</span>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatarUrl} />
                <AvatarFallback className="bg-phc-gradient text-white text-xs font-bold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Signed in as</span>
                <span className="text-sm truncate">{user?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSwitchRole} className="cursor-pointer">
              <ArrowLeftRight className="h-4 w-4" />
              Switch to {role === 'brand' ? 'Creator' : 'Brand'}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleSignOut}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
    </>
  )
}
