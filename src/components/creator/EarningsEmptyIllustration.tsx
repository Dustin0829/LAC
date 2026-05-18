/** Illustration for creator dashboard earnings chart empty state (bars + peso coin). */
export function EarningsEmptyIllustration() {
  return (
    <svg
      viewBox="0 0 200 160"
      className="mx-auto h-[140px] w-[200px] max-w-full"
      aria-hidden
    >
      <ellipse cx="100" cy="90" rx="76" ry="58" fill="#E0F2FE" />
      <rect x="44" y="118" width="112" height="4" rx="2" fill="#CBD5E1" />
      <rect x="52" y="92" width="18" height="26" rx="4" fill="#93C5FD" />
      <rect x="78" y="72" width="18" height="46" rx="4" fill="#3B82F6" />
      <rect x="104" y="82" width="18" height="36" rx="4" fill="#60A5FA" />
      <rect x="130" y="64" width="18" height="54" rx="4" fill="#2563EB" />
      <circle cx="148" cy="52" r="22" fill="#FEF08A" stroke="#EAB308" strokeWidth="2" />
      <text
        x="148"
        y="58"
        textAnchor="middle"
        fontSize="18"
        fontWeight="700"
        fill="#A16207"
        fontFamily="system-ui, sans-serif"
      >
        ₱
      </text>
      <path
        d="M42 48 L48 42 M158 44 L164 38 M38 100 L32 106"
        stroke="#38BDF8"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M54 36 L56 30 L62 32 M152 108 L158 112 L154 118"
        stroke="#7DD3FC"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
