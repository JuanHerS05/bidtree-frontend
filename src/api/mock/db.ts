import type { Auction, AppNotification, Bid, Order, RewardHistoryItem, RewardMilestone, User } from '@/lib/types';
import { gallery } from './images';

const min = (m: number) => new Date(Date.now() + m * 60_000).toISOString();
const ago = (m: number) => new Date(Date.now() - m * 60_000).toISOString();
let seq = 1000;
export const nextId = (p: string) => `${p}-${++seq}`;

export const RIVALS = [
  { id: 'r1', name: 'RareItemFan' }, { id: 'r2', name: 'CollectorA' }, { id: 'r3', name: 'VintageFocus' },
  { id: 'r4', name: 'LuisaPuja' }, { id: 'r5', name: 'MartilloVeloz' },
];

export const MOCK_USERS: Record<string, User> = {
  buyer: { id: 'u-buyer', name: 'Camila Rojas', email: 'comprador@bidtree.co', role: 'BUYER' },
  seller: { id: 'u-seller', name: 'Collectors Hub', email: 'vendedor@bidtree.co', role: 'SELLER' },
};

function mk(
  title: string, emoji: string, c1: string, c2: string, category: string, base: number,
  mins: number, seller: { id: string; name: string }, specs: Record<string, string>, desc: string,
): Auction {
  const imgs = gallery(emoji, c1, c2);
  return {
    id: nextId('a'), title, description: desc, imageUrl: imgs[0], gallery: imgs, category,
    condition: specs['Condición'], specs, basePrice: base, currentBid: base, bidCount: 0,
    endsAt: min(mins), createdAt: ago(Math.random() * 3000), status: mins > 0 ? 'ACTIVE' : 'ENDED',
    seller, winner: null, orderId: null,
  };
}

const HUB = { id: 'u-seller', name: 'Collectors Hub' };
const VIN = { id: 'u-vintage', name: 'Vintage Store' };

export const db = {
  me: null as User | null,
  auctions: [
    mk('Hasselblad 500CM Rare Gold Edition', '📷', '#1e293b', '#b45309', 'Fotografía', 2_800_000, 2.5, HUB,
      { Condición: 'Mint A+', Marca: 'Hasselblad', Formato: '6x6 medio formato', Año: '1970' },
      'Cámara de medio formato en edición dorada, con respaldo A12 y visor de pozo. Funcionamiento verificado.'),
    mk('Reloj Elegante Automatic', '⌚', '#0f172a', '#475569', 'Joyería', 980_000, 45, HUB,
      { Condición: 'Excelente', Movimiento: 'Automático', Caja: '40 mm acero', Resistencia: '100 m' },
      'Reloj automático con correa de cuero y caja de acero inoxidable. Incluye estuche y certificado.'),
    mk('Laptop Pro 13"', '💻', '#334155', '#0ea5e9', 'Electrónica', 550_000, 130, VIN,
      { Condición: 'Muy bueno', RAM: '16 GB', Almacenamiento: '512 GB SSD', Pantalla: '13 pulgadas' },
      'Portátil ultradelgado, batería al 92 %. Se entrega con cargador original.'),
    mk('Cámara DSLR 4K', '📸', '#111827', '#6366f1', 'Fotografía', 320_000, 18, VIN,
      { Condición: 'Bueno', Sensor: 'APS-C 24 MP', Video: '4K 30p', Obturaciones: '12.000' },
      'DSLR con lente kit 18-55 mm, dos baterías y tarjeta de 64 GB.'),
    mk('Anillo de Oro 18k con Esmeralda', '💍', '#064e3b', '#10b981', 'Joyería', 1_450_000, 600, HUB,
      { Condición: 'Nuevo', Material: 'Oro 18k', Piedra: 'Esmeralda 1.2 ct', Talla: '7' },
      'Anillo artesanal con esmeralda colombiana certificada.'),
    mk('Smartphone Edge 256 GB', '📱', '#1e1b4b', '#7c3aed', 'Electrónica', 420_000, 4, VIN,
      { Condición: 'Como nuevo', Almacenamiento: '256 GB', Batería: '98 %', Color: 'Negro' },
      'Smartphone liberado, con caja y accesorios originales.'),
    mk('Guitarra Eléctrica Vintage', '🎸', '#7c2d12', '#f59e0b', 'Hogar', 1_900_000, 1500, HUB,
      { Condición: 'Vintage', Año: '1978', Pastillas: 'Humbucker dobles', Cuerpo: 'Caoba' },
      'Guitarra de colección con estuche rígido original.'),
    mk('Bicicleta de Ruta Carbono', '🚲', '#14532d', '#84cc16', 'Deportes', 3_200_000, 300, VIN,
      { Condición: 'Excelente', Cuadro: 'Carbono M', Grupo: '22 velocidades', Peso: '7.9 kg' },
      'Bicicleta de ruta en carbono, lista para competir.'),
    mk('Pintura al Óleo "Páramo"', '🖼️', '#312e81', '#db2777', 'Arte', 760_000, -120, HUB,
      { Técnica: 'Óleo sobre lienzo', Medidas: '80x60 cm', Firma: 'Sí' }, 'Paisaje de páramo, firmado por el autor.'),
  ] as Auction[],
  bids: {} as Record<string, Bid[]>,
  alerts: [] as { id: string; auctionId: string; threshold: number; userId: string; triggered: boolean }[],
  notifications: [] as AppNotification[],
  orders: [] as Order[],
  rewards: {
    points: 1200, goal: 1500, balance: 35_000,
    history: [
      { id: 'h1', date: ago(60 * 24 * 14), action: 'Puntos por subasta ganada', points: 350, result: 'Puntos BidTree' },
      { id: 'h2', date: ago(60 * 24 * 19), action: 'Conversión de puntos a saldo', points: -1500, result: 'Saldo a favor', credit: 50_000 },
      { id: 'h3', date: ago(60 * 24 * 24), action: 'Bono por puja destacada', points: 200, result: 'Puntos BidTree' },
    ] as RewardHistoryItem[],
    milestones: [
      { id: 'm1', title: 'Insignia Brote Verde', points: 500, description: 'Obtén acceso anticipado a subastas.', state: 'UNLOCKED' },
      { id: 'm2', title: 'Postor Anticipado', points: 1500, description: 'Entra 1 hora antes a las subastas.', state: 'IN_PROGRESS' },
      { id: 'm3', title: 'Bono $10.000', points: 2000, description: 'Saldo a favor de $10.000.', state: 'LOCKED' },
      { id: 'm4', title: 'Subastas Premium', points: 3000, description: 'Acceso a subastas exclusivas.', state: 'LOCKED' },
      { id: 'm5', title: 'Árbol Dorado', points: 5000, description: 'Insignia de coleccionista.', state: 'LOCKED' },
    ] as RewardMilestone[],
  },
};

// Pujas iniciales para que las salas ya tengan historial.
db.auctions.forEach((a, i) => {
  db.bids[a.id] = [];
  if (a.status !== 'ACTIVE' && a.title.startsWith('Pintura')) {
    // subasta finalizada con ganador
    const w = RIVALS[1];
    const bid: Bid = { id: nextId('b'), auctionId: a.id, userId: w.id, userName: w.name, amount: a.basePrice + 40_000, at: ago(125) };
    db.bids[a.id] = [bid];
    a.currentBid = bid.amount; a.bidCount = 1; a.winner = { id: w.id, name: w.name };
    return;
  }
  const n = i % 4 === 0 ? 5 : i % 3;
  let price = a.basePrice;
  for (let k = 0; k < n; k++) {
    const r = RIVALS[(i + k) % RIVALS.length];
    price += [5000, 10000, 20000][k % 3];
    db.bids[a.id].unshift({ id: nextId('b'), auctionId: a.id, userId: r.id, userName: r.name, amount: price, at: ago((n - k) * 4) });
  }
  if (n) { a.currentBid = price; a.bidCount = n; a.winner = { id: db.bids[a.id][0].userId, name: db.bids[a.id][0].userName }; }
});

// Orden de ejemplo para probar /checkout/ord-demo
db.orders.push({
  id: 'ord-demo', auctionId: db.auctions[8].id, title: 'Pintura al Óleo "Páramo"', imageUrl: db.auctions[8].imageUrl,
  sellerName: 'Collectors Hub', finalPrice: 800_000, availableCredit: 35_000, status: 'PENDING',
});
