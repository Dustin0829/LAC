import { cn } from '@/lib/utils'

/** Primary CTA — matches login “Continue” / “Verify and continue”. */
export const authFlowPrimaryButtonClass = cn(
  'rounded-xl border-0 bg-[linear-gradient(135deg,#25b7f6_0%,#1d63f3_100%)] px-5 text-[13px] font-semibold text-white shadow-[0_14px_28px_rgba(29,99,243,0.24)] hover:opacity-95'
)

/** Secondary / outline — matches login “Continue with Google” surface. */
export const authFlowOutlineButtonClass = cn(
  'rounded-xl border border-slate-200 bg-white/86 text-[13px] font-semibold text-slate-950 shadow-[0_12px_28px_rgba(15,23,42,0.06)] hover:bg-white'
)
