/** The Canopychain mark: three canopy tiers over a trunk, one tier per
 * milestone tranche. Drawn with currentColor so it inherits from whatever
 * it sits in rather than needing a second file for dark mode. */
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true" focusable="false">
      <rect x="14" y="8" width="20" height="6" rx="3" fill="currentColor" />
      <rect x="9" y="17" width="30" height="6" rx="3" fill="currentColor" />
      <rect x="4" y="26" width="40" height="6" rx="3" fill="currentColor" />
      <rect x="22" y="32" width="4" height="9" rx="2" fill="currentColor" />
    </svg>
  );
}
