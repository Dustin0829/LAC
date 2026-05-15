/**
 * Shared full-page backdrop for auth, role selection, and onboarding flows.
 */
export function AuthPageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex w-full flex-col overflow-x-hidden bg-[#f4f8fd] text-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#fafcff_0%,#f4f8fd_42%,#edf5ff_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_140%_90%_at_72%_-8%,rgba(190,225,255,0.38),transparent_62%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(108deg,rgba(255,255,255,0.55)_0%,rgba(245,248,253,0.18)_48%,transparent_74%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-linear-to-t from-white/30 to-transparent"
      />
      <div className="relative z-10 flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  )
}
