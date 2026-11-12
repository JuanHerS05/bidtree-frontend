import clsx from 'clsx';

/** Isotipo: mazo de subasta cuyas hojas forman la copa de un árbol (Propuesta 1). */
export function LogoMark({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <path d="M32 4c-5 3-8 7-7 11 2 0 4-.7 5.500-1.700-.6 2.700 0 5.200 1.500 7.200 1.500-2 2.100-4.500 1.500-7.200 1.500 1 3.500 1.700 5.500 1.700 1-4-2-8-7-11z" fill="#FF6B00" />
      <path d="M16 14c-4 4-5 9-3 12 2-.5 4-2 5-3.500 0 3 1.500 5.500 3.500 7 1-3 .5-6-1-8.500 2 .3 4-.3 5.500-1.500C24 15 20 12 16 14z" fill="#FF6B00" opacity=".9" />
      <path d="M48 14c4 4 5 9 3 12-2-.5-4-2-5-3.500 0 3-1.500 5.500-3.500 7-1-3-.5-6 1-8.500-2 .3-4-.3-5.500-1.500C40 15 44 12 48 14z" fill="#FF6B00" opacity=".9" />
      <rect x="20" y="30" width="24" height="9" rx="3" fill="currentColor" />
      <rect x="28.500" y="39" width="7" height="21" rx="3.500" fill="currentColor" />
    </svg>
  );
}

/** Isologo tipográfico (Propuesta 3): "Bid" verde, "Tree" naranja con flecha ascendente. */
export function Logo({ className, light = false, compact = false }: { className?: string; light?: boolean; compact?: boolean }) {
  return (
    <span className={clsx('inline-flex items-center gap-2 font-sans text-2xl font-extrabold tracking-tight', className)} aria-label="BidTree">
      <LogoMark className={clsx('h-8 w-8', light ? 'text-white' : 'text-brand')} />
      {!compact && (
        <span className="leading-none">
          <span className={light ? 'text-white' : 'text-brand'}>Bid</span>
          <span className="text-auction">Tree</span>
        </span>
      )}
    </span>
  );
}
