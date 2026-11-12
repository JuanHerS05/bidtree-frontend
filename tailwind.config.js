/** Paleta oficial BidTree (sección 2 de la especificación) y tipografías (sección 3). */
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#0F5A47', 700: '#0B4536', 50: '#E7F3EF' }, // Verde Esmeralda (Primary)
        mint: { DEFAULT: '#10B981', 50: '#ECFDF5' },                  // Verde Menta (Accent)
        auction: { DEFAULT: '#FF6B00', 600: '#E55F00' },              // Naranja Subasta (Secondary)
        warn: '#F59E0B',                                              // Ámbar Alerta
        danger: '#EF4444',                                            // Rojo Anti-Sniping
        night: '#0F172A',                                             // Slate Dark
        paper: '#F8FAFC',                                             // Slate Light
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'Outfit', 'Inter', 'sans-serif'],
      },
      fontSize: {
        h1: ['32px', { lineHeight: '40px', fontWeight: '700' }],
        h2: ['24px', { lineHeight: '32px', fontWeight: '600' }],
        h3: ['18px', { lineHeight: '24px', fontWeight: '500' }],
      },
      keyframes: {
        flashRed: { '0%,100%': { opacity: '1' }, '50%': { opacity: '.35' } },
      },
      animation: { flashRed: 'flashRed .5s ease-in-out infinite' },
    },
  },
  plugins: [],
};
