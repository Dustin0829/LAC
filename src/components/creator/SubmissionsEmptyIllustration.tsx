/** Illustration for creator submissions empty state (scissors + document). */
export function SubmissionsEmptyIllustration() {
  return (
    <svg
      viewBox="0 0 200 160"
      className="mx-auto h-[140px] w-[200px] max-w-full"
      aria-hidden
    >
      <ellipse cx="100" cy="86" rx="74" ry="58" fill="#E0F2FE" />
      <rect x="56" y="48" width="88" height="92" rx="10" fill="#fff" stroke="#E2E8F0" strokeWidth="1.5" />
      <rect x="68" y="62" width="50" height="5" rx="2.5" fill="#CBD5E1" />
      <rect x="68" y="74" width="42" height="4" rx="2" fill="#E2E8F0" />
      <rect x="68" y="84" width="46" height="4" rx="2" fill="#E2E8F0" />
      <rect x="68" y="94" width="38" height="4" rx="2" fill="#E2E8F0" />
      <rect x="68" y="104" width="44" height="4" rx="2" fill="#E2E8F0" />
      <rect x="68" y="114" width="32" height="4" rx="2" fill="#E2E8F0" />
      {/* Scissors */}
      <circle cx="118" cy="78" r="10" fill="#0EA5E9" stroke="#0284C7" strokeWidth="2" />
      <circle cx="134" cy="94" r="10" fill="#0EA5E9" stroke="#0284C7" strokeWidth="2" />
      <path
        d="M118 78 L134 94 M118 88 L108 108 M134 104 L148 118"
        stroke="#0284C7"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M46 54 L52 48 M154 52 L160 46 M42 104 L36 110"
        stroke="#38BDF8"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M58 40 L60 34 L66 36 M150 112 L156 116 L152 122"
        stroke="#7DD3FC"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
