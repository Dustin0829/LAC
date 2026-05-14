import { cn } from '@/lib/utils'

/**
 * Wizard shell: VidU gradient + card body + footer (no stepper UI).
 */
export function OnboardingWizardShell({
  eyebrow,
  headline,
  children,
  footer,
  pageWatermark,
}: {
  eyebrow: string
  headline: React.ReactNode
  children: React.ReactNode
  footer: React.ReactNode
  /** Full-viewport background decoration (e.g. large watermark). */
  pageWatermark?: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'relative min-h-dvh w-full overflow-x-hidden',
        'bg-gradient-to-br from-page via-white to-sky-50/50 text-foreground',
        'dark:from-gray-950 dark:via-gray-950 dark:to-gray-950'
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[28rem] bg-hero-page-radial md:h-[32rem]"
      />

      {pageWatermark ? (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 bottom-0 z-[1] flex w-full max-w-full items-start justify-start pt-4 pl-5 pr-5 sm:pt-6 sm:pl-8 sm:pr-8 md:pt-8 md:pl-12 md:pr-12 lg:pl-16 lg:pr-16"
          aria-hidden
        >
          {pageWatermark}
        </div>
      ) : null}

      <div className="relative z-10 flex min-h-dvh flex-col">
        <div className="relative flex min-h-0 flex-1 flex-col justify-center px-6 py-10 sm:px-10 sm:py-12 md:px-14 lg:px-16">
          <div className="mx-auto w-full max-w-3xl">
            <header className="text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground sm:text-base md:text-lg">
                {eyebrow}
              </p>
              <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl md:mt-4 md:text-5xl lg:text-6xl">
                {headline}
              </h1>
            </header>

            <div className="mt-8 rounded-3xl border border-border bg-card/95 p-6 shadow-sm backdrop-blur-sm md:mt-10 md:p-8">
              {children}
            </div>

            <div className="mt-8">{footer}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
