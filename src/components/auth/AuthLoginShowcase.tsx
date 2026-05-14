import { BadgeCheck } from 'lucide-react'

const CREATOR_AVATAR_URLS = [
  'https://images.unsplash.com/photo-1585790641228-36685639c56e?auto=format&fit=crop&w=176&h=176&q=80',
  'https://images.unsplash.com/photo-1607489547216-87343d7b50be?auto=format&fit=crop&w=176&h=176&q=80',
  'https://images.unsplash.com/photo-1607489547363-f922776bbd32?auto=format&fit=crop&w=176&h=176&q=80',
  'https://images.unsplash.com/photo-1585280987252-c81b44c5a954?auto=format&fit=crop&w=176&h=176&q=80',
  'https://images.unsplash.com/photo-1608363579622-397e3ebcf60f?auto=format&fit=crop&w=176&h=176&q=80',
] as const

export function AuthMarketingColumn({ className }: { className?: string }) {
  return (
    <div className={className}>
      <div className="inline-flex items-center gap-2 text-[13px] font-medium text-slate-700">
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-white shadow-sm shadow-blue-500/25">
          <BadgeCheck className="h-3 w-3" aria-hidden />
        </span>
        Verified Marketplace
      </div>
      <h2 className="mt-5 font-display text-[32px] font-extrabold leading-[1.18] tracking-[-0.035em] text-slate-950 xl:text-[34px]">
        Publish Content.
        <br />
        Get Paid <span className="text-[#0ea5e9]">Faster.</span>
      </h2>
      <p className="mt-5 max-w-[270px] text-[15px] leading-7 text-slate-600">
        Join verified creators earning from branded campaigns.
      </p>
    </div>
  )
}

export function AuthLoginSocialProof() {
  return (
    <div className="relative z-20 mt-0 w-full shrink-0 text-center">
      <div className="mx-auto flex w-fit max-w-[min(100%,20rem)] flex-col items-center gap-2">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:max-w-none">
          <div className="flex shrink-0 justify-center -space-x-2">
            {CREATOR_AVATAR_URLS.map((src, i) => (
              <img
                key={src}
                src={src}
                alt=""
                width={28}
                height={28}
                loading="lazy"
                referrerPolicy="no-referrer"
                className="relative size-7 shrink-0 rounded-full bg-white object-cover shadow-sm ring-2 ring-white sm:size-8"
                style={{ zIndex: CREATOR_AVATAR_URLS.length - i }}
              />
            ))}
          </div>
          <p className="max-w-56 text-center text-[11px] font-medium leading-snug text-slate-600 sm:max-w-none sm:text-left sm:text-xs">
            <span className="font-semibold tracking-tight text-slate-700">
              Joined by 247 brands & 3,800+ creators
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}

/** Bottom-of-screen, centered copyright (login shell). */
export function AuthLoginCopyright() {
  return (
    <p className="w-full text-center text-[10px] text-slate-500">
      © {new Date().getFullYear()} VidU. All rights reserved.
    </p>
  )
}

export function AuthLoginFooter() {
  return (
    <footer className="relative z-20 mt-0 shrink-0 text-center">
      <AuthLoginSocialProof />
      <div className="mt-3">
        <AuthLoginCopyright />
      </div>
    </footer>
  )
}
