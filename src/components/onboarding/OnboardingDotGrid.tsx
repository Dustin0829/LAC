/** Side dot-grid decoration on role selection / auth flows. */
export function OnboardingDotGrid() {
  const dotPattern = (className: string) => (
    <div
      aria-hidden
      className={className}
      style={{
        backgroundImage: 'radial-gradient(circle, rgba(148, 163, 184, 0.35) 1.5px, transparent 1.5px)',
        backgroundSize: '14px 14px',
      }}
    />
  )

  return (
    <>
      {dotPattern(
        'pointer-events-none absolute left-0 top-[12%] hidden h-[72%] w-24 opacity-60 lg:block xl:w-32'
      )}
      {dotPattern(
        'pointer-events-none absolute right-0 top-[12%] hidden h-[72%] w-24 opacity-60 lg:block xl:w-32'
      )}
    </>
  )
}
