# BidTree — Frontend (React + TypeScript + Vite)

Implementa la *Especificación de Diseño Frontend y Guía de Estilo*: los 6 módulos (auth, catálogo + panel del vendedor,
sala de pujas en vivo, árbol de puntos, checkout, alertas/notificaciones), la paleta oficial, la tipografía
(Inter + Space Grotesk con `tabular-nums`) y el logo tipográfico.

**Stack:** React 18 · Vite · Tailwind CSS · Zustand · TanStack Query · Framer Motion · React Router · WebSocket nativo.

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # tsc + vite build
```

## Modo demo (sin backend)
Con `VITE_USE_MOCKS=true` (valor por defecto en `.env`) todo funciona en el navegador: pujas, Anti-Sniping, cierre de subastas,
órdenes, pagos, puntos y alertas. Cualquier correo y contraseña (≥ 4 caracteres) entra; si el correo contiene
**"vendedor"** entras como Vendedor. La subasta de la Hasselblad cierra ~2,5 min después de cargar: entra a su sala para ver el
reloj en rojo y el +15 s. El botón **Demo** (abajo a la izquierda) dispara eventos de tópicos (te superan, precio límite,
ganaste, reasignación de pago). `/checkout/ord-demo` abre un checkout de prueba.

Para conectar al backend real: `VITE_USE_MOCKS=false` y configura las URLs (abajo).

## Cómo cambiar tópicos y conexión con microservicios

| Quiero cambiar… | Dónde |
|---|---|
| URL de cada microservicio / usar un gateway común | `.env` → `VITE_GATEWAY_URL`, `VITE_URL_USUARIOS`, `VITE_URL_SUBASTAS`, `VITE_URL_PUJAS`, `VITE_URL_PAGOS_ALERTAS` (lógica en `src/config/services.ts`) |
| Prefijo de ruta por servicio (Eureka/Gateway: `/ms-pujas`…) | `.env` → `VITE_PREFIX_*` |
| Base WebSocket | `.env` → `VITE_WS_PUJAS`, `VITE_WS_PAGOS_ALERTAS` (por defecto http→ws) |
| Nombres de tópicos Kafka | `src/config/topics.ts` → `TOPICS`, o `.env` → `VITE_TOPIC_*` |
| Nombres de mensajes del WebSocket de la sala (`NEW_BID`, `TIME_EXTENDED`…) | `src/config/topics.ts` → `WS_EVENTS` |
| Rutas y métodos REST | `src/config/endpoints.ts` (único catálogo; cada endpoint indica su microservicio) |
| Campos del JSON del backend | `normalizeBid` / `parse` en `src/realtime/auctionChannel.ts` y `src/lib/types.ts` |
| Reglas (15 s anti-sniping, +15 s, botones +5.000/+10.000/+50.000, moneda, filtros) | `src/config/app.config.ts` |
| Colores / tipografía | `tailwind.config.js` |

Ningún componente contiene URLs ni nombres de tópicos escritos a mano: los mocks se enlazan por *identidad* del endpoint, así que
si renombras una ruta o un tópico el modo demo sigue funcionando.

### Cómo llegan los tópicos al navegador
El navegador no habla con Kafka. Se asume un canal `WS /ws/notifications` (ms-pagos-alertas) que envía sobres
`{ "topic": "<nombre>", "payload": { … } }`. `src/realtime/topicRouter.ts` decide la acción de UI para cada tópico:

| Tópico (clave) | Efecto en la UI |
|---|---|
| `auctionEnded` | Si eres el ganador: notificación + toast "Ir a pagar" → `/checkout/{orderId}`; refresca catálogo |
| `paymentRegistered` | Refresca puntos/saldo (`/rewards`) y catálogo |
| `outbid` | Banner "¡Te han superado!" (si no estás ya en esa sala) + centro de notificaciones |
| `priceLimitReached` | Alerta de precio límite alcanzado |
| `paymentReassignment` | Notificación al 2.º mejor postor con botón "Comprar ahora" |
| `userCreated` | Solo referencia (lo consumen otros microservicios) |

Campos de payload esperados: ver cada `case` en `topicRouter.ts`.

## Supuestos a alinear con tu backend
Solo vienen literalmente del documento: `DELETE /api/v1/auctions/{auction_id}/cancel`, `POST /api/v1/rewards/redeem`,
`WS /ws/auction/{subasta_id}`, los filtros `min_price` / `max_price`, `image_url` y el DTO `UserDTO`. El resto de rutas
(`/api/v1/auth/login`, `/api/v1/orders/{id}/pay`, `/api/v1/alerts/price-limit`, formato de los mensajes WS, token por `?token=`)
son propuestas razonables en `endpoints.ts` / `topics.ts`. El reloj usa la hora del navegador contra `endsAt` que envía el servidor;
si hay desfase de relojes conviene que el backend envíe también `serverTime`.

Los datos de tarjeta solo se validan en el cliente (Luhn/fecha/CVC); en producción tokeniza con el SDK de tu pasarela.

## Estructura
```
src/config/     env, services (microservicios), endpoints, topics (tópicos + eventos WS), app.config (reglas)
src/api/        http.ts (cliente único con JWT) · services.ts (casos de uso) · mock/ (backend simulado)
src/realtime/   WebSocket con reconexión, canal de sala, canal de notificaciones, topicRouter
src/store/      Zustand: auth (persistido), sala en vivo, notificaciones, toasts
src/hooks/      queries (TanStack), useAuctionRoom, useCountdown, useNotificationsChannel
src/components/ UI (Button, Modal, Switch…), Logo, CountdownClock, AnimateNumber, RewardTree, NotificationCenter…
src/pages/      Login, Register, Auctions, SellerDashboard, LiveRoom, Rewards, Checkout
```

## Notas sobre la especificación
- Se usó **Vite + React Router** en vez de Next.js (pediste React; las salas son 100 % cliente). Los componentes son portables a Next.
- Tailwind sin Shadcn: los componentes base están en `src/components/ui.tsx`.
- Logo: se implementó la Propuesta 3 (isologo tipográfico) con el isotipo del mazo-hojas de la Propuesta 1 (`src/components/Logo.tsx`).
