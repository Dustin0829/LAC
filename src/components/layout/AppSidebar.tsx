import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Compass,
  Scissors,
  User,
  LogOut,
  type LucideIcon,
  Flag,
} from 'lucide-react'
import { type UserRole } from '@/lib/stores/authStore'
import { useAuth } from '@/lib/hooks/use-auth'
import { useSignOut } from '@/lib/hooks/use-sign-out'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { VidULogo } from '@/components/VidULogo'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  /** Shorter label for the narrow (w-24) rail */
  shortLabel?: string
  to: string
  icon: LucideIcon
}

const CREATOR_NAV: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Campaigns', to: '/campaigns', icon: Compass },
  { label: 'Submissions', shortLabel: 'Submissions', to: '/submissions', icon: Scissors },
  { label: 'Account', to: '/account', icon: User },
]

const BRAND_NAV: NavItem[] = [
  { label: 'Dashboard', to: '/brand/dashboard', icon: LayoutDashboard },
  { label: 'Campaigns', to: '/brand/campaigns', icon: Flag },
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
  const { user } = useAuth()
  const { signOut: handleSignOut, isSigningOut } = useSignOut()

  const homeTo = role === 'brand' ? '/brand/dashboard' : '/dashboard'

  const userInitials = getInitials(user?.name, user?.email)
  const displayName = user?.name || user?.email?.split('@')[0] || 'You'

  return {
    navigation,
    location,
    homeTo,
    user,
    handleSignOut,
    isSigningOut,
    userInitials,
    displayName,
  }
}

/** Desktop rail only — use as first flex child next to `<main>` (BugHyve-style shell). */
export function AppSidebarDesktop({ role }: AppSidebarProps) {
  const { navigation, location, homeTo, user, userInitials, handleSignOut, isSigningOut, displayName } =
    useAppSidebarModel(role)

  return (
    <aside className="hidden h-dvh w-24 shrink-0 border-r border-gray-800 bg-gray-900 text-gray-100 md:flex md:flex-col">
      <div className="flex h-24 shrink-0 items-center justify-center border-b border-gray-800">
        <Link to={homeTo} className="flex items-center justify-center" aria-label="VidU home">
          <VidULogo variant="mark" className="h-16 w-16" />
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
              variant="red"
              icon={<LogOut className="h-4 w-4" aria-hidden />}
              className="cursor-pointer"
              disabled={isSigningOut}
              onSelect={(e) => {
                e.preventDefault()
                void handleSignOut()
              }}
            >
              {isSigningOut ? 'Signing out…' : 'Sign out'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  )
}

/** Mobile bottom nav only — header + account menu removed; sign out lives on Account (mobile). */
export function AppSidebarMobile({ role }: AppSidebarProps) {
  const { navigation, location } = useAppSidebarModel(role)

  return (
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
  )
}
