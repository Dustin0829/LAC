import { cn } from '@/lib/utils'
import { AuthPageLayout } from '@/components/layout/AuthPageLayout'

/**
 * Wizard shell: same soft background as login + card body + footer (no stepper UI).
 */
export function OnboardingWizardShell({
  eyebrow,
  headline,
  subtitle,
  children,
  footer,
  contentClassName,
}: {
  eyebrow: string
  headline: React.ReactNode
  /** Centered copy below the headline (outside the card). */
  subtitle?: string
  children: React.ReactNode
  footer: React.ReactNode
  contentClassName?: string
}) {
  return (
    <AuthPageLayout>
      <>
        <div className="relative z-10 flex min-h-dvh flex-col text-foreground">
          <div className="relative flex min-h-0 flex-1 flex-col justify-center px-5 py-10 sm:px-8 sm:py-12 md:px-10">
            <div className="mx-auto w-full max-w-2xl">
              <header className="text-center">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500 sm:text-sm">
                  {eyebrow}
                </p>
                <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl md:mt-4">
                  {headline}
                </h1>
                {subtitle ? (
                  <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-slate-500 sm:text-[15px]">
                    {subtitle}
                  </p>
                ) : null}
              </header>

              <div
                className={cn(
                  'mt-8 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-8',
                  contentClassName
                )}
              >
                {children}
              </div>

              <div className="mt-6 sm:mt-8">{footer}</div>
            </div>
          </div>
        </div>
      </>
    </AuthPageLayout>
  )
}
