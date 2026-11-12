/** Imágenes de producto generadas en SVG (los mocks funcionan sin red ni assets externos). */
const enc = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

export function productImage(emoji: string, c1: string, c2: string, variant = 0): string {
  const angle = [0, 1, 0.4, 0.8][variant % 4];
  const cx = [400, 330, 470, 400][variant % 4];
  return enc(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
<defs><linearGradient id="g" x1="0" y1="${angle}" x2="1" y2="${1 - angle}"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs>
<rect width="800" height="600" fill="url(#g)"/>
<circle cx="${cx}" cy="300" r="190" fill="rgba(255,255,255,.18)"/>
<circle cx="${cx}" cy="300" r="130" fill="rgba(255,255,255,.14)"/>
<text x="${cx}" y="360" font-size="190" text-anchor="middle" font-family="Apple Color Emoji,Segoe UI Emoji,Noto Color Emoji,sans-serif">${emoji}</text>
</svg>`);
}

export const gallery = (emoji: string, c1: string, c2: string) =>
  [0, 1, 2, 3].map((v) => productImage(emoji, c1, c2, v));
