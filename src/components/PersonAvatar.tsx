import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

const GRADIENTS = [
  'bg-linear-to-br from-violet-500 to-purple-700 text-white',
  'bg-linear-to-br from-sky-500 to-blue-700 text-white',
  'bg-linear-to-br from-emerald-500 to-teal-700 text-white',
  'bg-linear-to-br from-amber-500 to-orange-700 text-white',
  'bg-linear-to-br from-fuchsia-500 to-pink-700 text-white',
  'bg-linear-to-br from-cyan-500 to-indigo-700 text-white',
  'bg-linear-to-br from-rose-500 to-red-700 text-white',
  'bg-linear-to-br from-lime-600 to-green-800 text-white',
] as const

function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = Math.imul(31, h) + s.charCodeAt(i)
  return Math.abs(h)
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase()
  if (parts.length === 1 && parts[0].length >= 2) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0]?.charAt(0) ?? '?').toUpperCase()
}

export interface PersonAvatarProps {
  name: string
  src?: string | null
  /** `xs` matches compact data tables (BugHyve-style density). */
  size?: 'xs' | 'sm' | 'md'
  className?: string
}

export function PersonAvatar({ name, src, size = 'sm', className }: PersonAvatarProps) {
  const gradient = GRADIENTS[hashString(name.trim().toLowerCase()) % GRADIENTS.length]
  const initials = initialsFromName(name)

  const sizeCls =
    size === 'md'
      ? 'h-9 w-9 text-xs font-bold'
      : size === 'xs'
        ? 'h-7 w-7 text-xs font-bold'
        : 'h-8 w-8 text-xs font-bold'

  return (
    <Avatar className={cn('rounded-full border border-border/60 shadow-none', sizeCls, className)}>
      {src ? <AvatarImage src={src} alt="" className="object-cover" /> : null}
      <AvatarFallback className={cn('rounded-full font-display text-white', gradient)}>
        {initials}
      </AvatarFallback>
    </Avatar>
  )
}
