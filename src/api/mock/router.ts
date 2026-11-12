/**
 * Enrutador de mocks: asocia cada ENDPOINT con un manejador en memoria.
 * Como se enlaza por identidad del endpoint, si cambias rutas en `config/endpoints.ts`
 * los mocks siguen funcionando sin tocar nada aquí.
 */
import { ENDPOINTS, type Endpoint } from '@/config/endpoints';
import { TOPICS } from '@/config/topics';
import type { CallOptions } from '../http';
import type { Auction, CreateAuctionInput, LoginResponse, Order, PayInput, UserDTO } from '@/lib/types';
import { db, MOCK_USERS, nextId } from './db';
import { placeBid, publishTopic } from './engine';

class MockError extends Error { status: number; constructor(m: string, s = 400) { super(m); this.status = s; } }
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const b64 = (o: object) => btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/=/g, '');

type Ctx = Required<Pick<CallOptions, 'params' | 'query'>> & { body: any };
const handlers = new Map<Endpoint, (c: Ctx) => unknown>();
const on = (e: Endpoint, h: (c: Ctx) => unknown) => handlers.set(e, h);

const me = () => { if (!db.me) throw new MockError('No autenticado', 401); return db.me; };
const auction = (id: string) => { const a = db.auctions.find((x) => x.id === id); if (!a) throw new MockError('Subasta no encontrada', 404); return a; };

// ── ms-usuarios ──
on(ENDPOINTS.auth.login, ({ body }) => {
  const email = String(body.email ?? body.username ?? '').toLowerCase();
  if (!email || !body.password) throw new MockError('Credenciales inválidas', 401);
  const seller = /vend|seller/.test(email);
  const base = seller ? MOCK_USERS.seller : MOCK_USERS.buyer;
  const user = { ...base, email };
  db.me = user;
  const token = `${b64({ alg: 'none' })}.${b64({ sub: user.id, name: user.name, email, role: user.role, exp: Math.floor(Date.now() / 1000) + 86400 })}.mock`;
  return { token, user } satisfies LoginResponse;
});
on(ENDPOINTS.auth.register, ({ body }: { body: UserDTO }) => {
  publishTopic(TOPICS.userCreated, { email: body.email });
  return { id: nextId('u'), ...body, password: undefined };
});
on(ENDPOINTS.auth.forgotPassword, () => ({ ok: true }));

// ── ms-subastas ──
on(ENDPOINTS.auctions.categories, () => [...new Set(db.auctions.map((a) => a.category))].sort());
on(ENDPOINTS.auctions.list, ({ query }) => {
  const q = String(query.q ?? '').toLowerCase().trim();
  const min = query.min_price ? Number(query.min_price) : 0;
  const max = query.max_price ? Number(query.max_price) : Infinity;
  const within = query.ends_within_hours ? Number(query.ends_within_hours) * 3_600_000 : Infinity;
  return db.auctions
    .filter((a) => a.status === 'ACTIVE')
    .filter((a) => !q || `${a.title} ${a.description} ${a.category}`.toLowerCase().includes(q))
    .filter((a) => !query.category || a.category === query.category)
    .filter((a) => a.currentBid >= min && a.currentBid <= max)
    .filter((a) => new Date(a.endsAt).getTime() - Date.now() <= within)
    .sort((x, y) => new Date(x.endsAt).getTime() - new Date(y.endsAt).getTime());
});
on(ENDPOINTS.auctions.detail, ({ params }) => auction(String(params.auction_id)));
on(ENDPOINTS.auctions.mine, () => db.auctions.filter((a) => a.seller.id === me().id));
on(ENDPOINTS.auctions.create, ({ body }: { body: CreateAuctionInput }) => {
  const u = me();
  const gal = [body.image_url, body.image_url, body.image_url, body.image_url];
  const a: Auction = {
    id: nextId('a'), title: body.title, description: body.description, imageUrl: body.image_url, gallery: gal,
    category: body.category, specs: {}, basePrice: body.base_price, currentBid: body.base_price, bidCount: 0,
    endsAt: body.ends_at, createdAt: new Date().toISOString(), status: 'ACTIVE', seller: { id: u.id, name: u.name }, winner: null,
  };
  db.auctions.unshift(a); db.bids[a.id] = [];
  return a;
});
on(ENDPOINTS.auctions.cancel, ({ params }) => {
  const a = auction(String(params.auction_id));
  if (a.bidCount > 0) throw new MockError('No se puede cancelar: ya existen pujas registradas', 409);
  a.status = 'CANCELLED';
  return { ok: true };
});
on(ENDPOINTS.auctions.uploadImage, async ({ body }) => {
  const file = (body as FormData).get('file') as File;
  const url = await new Promise<string>((res) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.readAsDataURL(file); });
  return { image_url: url };
});

// ── ms-pujas ──
on(ENDPOINTS.bids.history, ({ params }) => db.bids[String(params.auction_id)] ?? []);
on(ENDPOINTS.bids.place, ({ body }) => { const u = me(); return placeBid(body.auctionId, u.id, u.name, body.amount); });

// ── recompensas ──
on(ENDPOINTS.rewards.me, () => ({ points: db.rewards.points, goal: db.rewards.goal, balance: db.rewards.balance, milestones: db.rewards.milestones }));
on(ENDPOINTS.rewards.history, () => db.rewards.history);
on(ENDPOINTS.rewards.redeem, ({ body }) => {
  const amount = Math.min(Number(body.amount), db.rewards.balance);
  return { discount: amount, remaining: db.rewards.balance - amount };
});

// ── ms-pagos-alertas ──
const order = (id: string): Order => {
  let o = db.orders.find((x) => x.id === id);
  if (!o && id.startsWith('ord-reasign')) {
    const a = db.auctions[1];
    o = { id, auctionId: a.id, title: a.title, imageUrl: a.imageUrl, sellerName: a.seller.name, finalPrice: a.currentBid, availableCredit: db.rewards.balance, status: 'PENDING' };
    db.orders.push(o);
  }
  if (!o) throw new MockError('Orden no encontrada', 404);
  return { ...o, availableCredit: db.rewards.balance };
};
on(ENDPOINTS.orders.detail, ({ params }) => order(String(params.order_id)));
on(ENDPOINTS.orders.acceptReassignment, ({ params }) => order(String(params.order_id)));
on(ENDPOINTS.orders.pay, ({ params, body }: { params: any; body: PayInput }) => {
  const o = order(String(params.order_id));
  if (o.status === 'PAID') throw new MockError('La orden ya fue pagada', 409);
  const stored = db.orders.find((x) => x.id === o.id)!;
  stored.status = 'PAID';
  let discount = 0;
  if (body.applyCredit) { discount = Math.min(db.rewards.balance, o.finalPrice); db.rewards.balance -= discount; }
  const earned = Math.round((o.finalPrice - discount) / 1000);
  db.rewards.points = Math.min(db.rewards.goal, db.rewards.points + earned);
  db.rewards.history.unshift({ id: nextId('h'), date: new Date().toISOString(), action: 'Puntos por subasta ganada', points: earned, result: 'Puntos BidTree' });
  const a = db.auctions.find((x) => x.id === o.auctionId); if (a) a.status = 'SOLD';
  publishTopic(TOPICS.paymentRegistered, { orderId: o.id, userId: me().id, amount: o.finalPrice - discount, points: earned });
  return { ok: true, paid: o.finalPrice - discount, pointsEarned: earned };
});
on(ENDPOINTS.alerts.setPriceLimit, ({ body }) => {
  const u = me();
  db.alerts.push({ id: nextId('al'), auctionId: body.auctionId, threshold: Number(body.threshold), userId: u.id, triggered: false });
  return { ok: true };
});
on(ENDPOINTS.alerts.notifications, () => db.notifications);
on(ENDPOINTS.alerts.markRead, () => ({ ok: true }));

export async function mockRequest<T>(ep: Endpoint, opts: CallOptions): Promise<T> {
  await sleep(180 + Math.random() * 220);
  const h = handlers.get(ep);
  if (!h) throw new MockError(`Sin mock para ${ep.method} ${ep.path}`, 501);
  return (await h({ params: opts.params ?? {}, query: opts.query ?? {}, body: opts.body })) as T;
}
export { MockError };
