/**
 * Page shell aligned with vid-u-marketing-site landing: soft page fill + top hero radial.
 */
export function MarketingAuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh w-full flex-col overflow-x-hidden bg-page text-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[35rem] bg-hero-page-radial md:h-[38.75rem]"
      />
      <div className="relative z-10 flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  )
}
