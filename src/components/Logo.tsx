export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  // Racimo estilizado dentro de una puerta abierta: datos abiertos de La Rioja.
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <rect x="2" y="2" width="36" height="36" rx="10" className="fill-vino-700" />
      <path d="M20 7c2.5 0 3.5 1.5 4 3" stroke="#a3c47a" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <g className="fill-white">
        <circle cx="14.5" cy="15" r="3.4" />
        <circle cx="20" cy="15" r="3.4" />
        <circle cx="25.5" cy="15" r="3.4" />
        <circle cx="17.2" cy="20.5" r="3.4" />
        <circle cx="22.8" cy="20.5" r="3.4" />
        <circle cx="20" cy="26" r="3.4" />
      </g>
      <circle cx="20" cy="31.5" r="2.4" className="fill-vino-300" />
    </svg>
  );
}
