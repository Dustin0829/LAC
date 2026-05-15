import { cn } from '@/lib/utils'
import { AuthPageLayout } from '@/components/layout/AuthPageLayout'

/**
 * Wizard shell: same soft background as login + card body + footer (no stepper UI).
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
    <AuthPageLayout>
      <>
        {pageWatermark ? (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 top-0 z-[1] flex w-full max-w-full items-start justify-start pt-4 pl-5 pr-5 sm:pt-6 sm:pl-8 sm:pr-8 md:pt-8 md:pl-12 md:pr-12 lg:pl-16 lg:pr-16"
            aria-hidden
          >
            {pageWatermark}
          </div>
        ) : null}

        <div className="relative z-10 flex min-h-dvh flex-col text-foreground dark:text-foreground">
          <div className="relative flex min-h-0 flex-1 flex-col justify-center px-6 py-10 sm:px-10 sm:py-12 md:px-14 lg:px-16">
            <div className="mx-auto w-full max-w-3xl">
              <header className="text-center">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground sm:text-base md:text-lg">
                  {eyebrow}
                </p>
                <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl md:mt-4 md:text-5xl lg:text-6xl">
                  {headline}
                </h1>
              </header>

              <div
                className={cn(
                  'mt-8 rounded-3xl border border-white/80 bg-white/78 p-6 shadow-[0_28px_80px_rgba(15,23,42,0.10)] backdrop-blur-2xl md:mt-10 md:p-8',
                  'dark:border-border dark:bg-card/95 dark:shadow-sm'
                )}
              >
                {children}
              </div>

              <div className="mt-8">{footer}</div>
            </div>
          </div>
        </div>
      </>
    </AuthPageLayout>
  )
}
