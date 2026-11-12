/** Reglas de negocio y de presentación editables sin tocar componentes. */
export const APP = {
  locale: 'es-CO',
  currency: 'COP',
  /** Anti-Sniping: ventana (s) en que una puja destella en rojo y extiende el tiempo. */
  antiSnipingWindowSeconds: 15,
  antiSnipingExtensionSeconds: 15,
  /** Una subasta con menos de N minutos se marca "Próxima a cerrar" (ámbar). */
  endingSoonMinutes: 5,
  /** Botonera de oferta rápida (+ $5.000, + $10.000, + $50.000). */
  quickBids: [5000, 10000, 50000],
  /** Incremento mínimo sobre la puja actual. */
  minIncrement: 1000,
  /** Refresco del catálogo (ms) para ver precios cambiar. */
  catalogRefetchMs: 10000,
  /** Filtro "Termina en". */
  endsWithinOptions: [
    { label: 'Cualquier momento', value: '' },
    { label: 'Menos de 1 hora', value: '1' },
    { label: 'Menos de 6 horas', value: '6' },
    { label: 'Menos de 24 horas', value: '24' },
  ],
  fallbackCategories: ['Electrónica', 'Joyería', 'Fotografía', 'Arte', 'Hogar', 'Deportes'],
} as const;
