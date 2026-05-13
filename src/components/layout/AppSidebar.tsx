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
  Video,
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
  /** Shorter label for the narrow (w-24) rail */
  shortLabel?: string
  to: string
  icon: LucideIcon
}

const CREATOR_NAV: NavItem[] = [
  { label: 'Dashboard', to: '/creator/dashboard', icon: LayoutDashboard },
  { label: 'Discover', to: '/creator/campaigns', icon: Compass },
  { label: 'My Content', to: '/creator/content', icon: Scissors },
  { label: 'Earnings', to: '/creator/earnings', icon: Wallet },
  { label: 'Account', to: '/creator/account', icon: User },
]

const BRAND_NAV: NavItem[] = [
  { label: 'Dashboard', to: '/brand/dashboard', icon: LayoutDashboard },
  { label: 'Campaigns', to: '/brand/campaigns', icon: Video },
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

function useAppSidebarModel(role: UserRole) {
  const navigation = role === 'brand' ? BRAND_NAV : CREATOR_NAV
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const setRole = useAuthStore((s) => s.setRole)
  const signOut = useAuthStore((s) => s.signOut)

  const homeTo = role === 'brand' ? '/brand/dashboard' : '/creator/dashboard'

  function handleSignOut() {
    signOut()
    toast.success('Signed out')
    navigate('/auth', { replace: true })
  }

  function handleSwitchRole() {
    const next: UserRole = role === 'brand' ? 'creator' : 'brand'
    setRole(next)
    navigate(next === 'brand' ? '/brand/dashboard' : '/creator/dashboard', { replace: true })
    toast.success(`Switched to ${next === 'brand' ? 'Brand' : 'Creator'}`)
  }

  const userInitials = getInitials(user?.name, user?.email)
  const displayName = user?.name || user?.email?.split('@')[0] || 'You'

  return {
    navigation,
    location,
    homeTo,
    user,
    handleSignOut,
    handleSwitchRole,
    userInitials,
    displayName,
  }
}

/** Desktop rail only — use as first flex child next to `<main>` (BugHyve-style shell). */
export function AppSidebarDesktop({ role }: AppSidebarProps) {
  const {
    navigation,
    location,
    homeTo,
    user,
    userInitials,
    handleSignOut,
    handleSwitchRole,
    displayName,
  } = useAppSidebarModel(role)

  return (
    <aside className="hidden h-dvh w-24 shrink-0 border-r border-gray-800 bg-gray-900 text-gray-100 md:flex md:flex-col">
      <div className="flex h-20 shrink-0 items-center justify-center border-b border-gray-800">
        <Link to={homeTo} className="flex items-center justify-center" title="Arpify">
          <img
            src="/arpify-logo.svg"
            alt=""
            className="h-12 w-12 rounded-sm object-cover object-left"
          />
        </Link>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto px-2 py-4">
        {navigation.map((item) => {
          const Icon = item.icon
          const isActive =
            location.pathname === item.to || location.pathname.startsWith(item.to + '/')
          const navLabel = item.shortLabel ?? item.label
          return (
            <Link
              key={item.to}
              to={item.to}
              title={item.label}
              className={cn(
                'group flex flex-col items-center justify-center gap-1 rounded-sm px-2 py-3 transition-colors',
                isActive
                  ? 'bg-sky-500/15 text-primary'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-300'
              )}
            >
              <Icon
                className={cn(
                  'h-5 w-5 shrink-0',
                  isActive ? 'text-primary' : 'text-gray-400 group-hover:text-gray-300'
                )}
              />
              <span className="text-center text-[11px] font-medium leading-tight">{navLabel}</span>
            </Link>
          )
        })}
      </nav>

      <div className="relative space-y-2 border-t border-gray-800 px-2 py-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex w-full cursor-pointer items-center justify-center text-gray-400 outline-none transition-colors hover:text-gray-300"
              title="Account"
            >
              <Avatar className="h-12 w-12 border border-gray-700">
                <AvatarImage src={user?.avatarUrl} />
                <AvatarFallback className="bg-phc-gradient text-xs font-bold text-white">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="right" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-xs text-muted-foreground">Signed in as</p>
                <p className="truncate text-sm text-foreground">{displayName}</p>
                {user?.email ? (
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                ) : null}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer"
              onSelect={(e) => {
                e.preventDefault()
                handleSwitchRole()
              }}
            >
              <ArrowLeftRight className="h-4 w-4 shrink-0" aria-hidden />
              <span className="ml-1">Switch to {role === 'brand' ? 'Creator' : 'Brand'}</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer text-destructive focus:text-destructive"
              onSelect={(e) => {
                e.preventDefault()
                handleSignOut()
              }}
            >
              <LogOut className="h-4 w-4 shrink-0" aria-hidden />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  )
}

/** Mobile top bar + bottom nav — render inside `<main>` so the layout shell stays sidebar | main only. */
export function AppSidebarMobile({ role }: AppSidebarProps) {
  const { navigation, location, homeTo, user, userInitials, handleSignOut, handleSwitchRole } =
    useAppSidebarModel(role)

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur md:hidden">
        <Link to={homeTo} className="flex items-center gap-2">
          <img
            src="/arpify-logo.svg"
            alt=""
            className="h-9 w-9 shrink-0 rounded-lg object-cover object-left"
          />
          <span className="font-display font-extrabold tracking-tight">Arpify</span>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="p-1 outline-none">
              <Avatar className="h-8 w-8 border border-gray-700">
                <AvatarImage src={user?.avatarUrl} />
                <AvatarFallback className="bg-phc-gradient text-[10px] font-bold text-white">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Signed in as</span>
                <span className="truncate text-sm">{user?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer"
              onSelect={(e) => {
                e.preventDefault()
                handleSwitchRole()
              }}
            >
              <ArrowLeftRight className="h-4 w-4" />
              Switch to {role === 'brand' ? 'Creator' : 'Brand'}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer text-destructive focus:text-destructive"
              onSelect={(e) => {
                e.preventDefault()
                handleSignOut()
              }}
            >
              <LogOut className="h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-800 bg-gray-900 pb-[env(safe-area-inset-bottom)] md:hidden">
        <div className="flex items-center justify-between px-2 py-3">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive =
              location.pathname === item.to || location.pathname.startsWith(item.to + '/')
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-label={item.label}
                className={cn(
                  'flex min-w-0 flex-1 justify-center py-1',
                  isActive ? 'text-primary' : 'text-gray-400'
                )}
              >
                <Icon
                  className={cn('h-5 w-5 shrink-0', isActive ? 'text-primary' : 'text-gray-400')}
                />
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
