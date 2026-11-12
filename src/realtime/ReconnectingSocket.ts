/** WebSocket nativo con reconexión exponencial. */
export type SocketStatus = 'connecting' | 'open' | 'closed';

export class ReconnectingSocket {
  private ws: WebSocket | null = null;
  private attempts = 0;
  private closedByUser = false;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private url: () => string,
    private handlers: { onMessage: (data: unknown) => void; onStatus: (s: SocketStatus) => void },
  ) {}

  connect() {
    this.closedByUser = false;
    this.handlers.onStatus('connecting');
    try { this.ws = new WebSocket(this.url()); } catch { this.scheduleReconnect(); return; }
    this.ws.onopen = () => { this.attempts = 0; this.handlers.onStatus('open'); };
    this.ws.onmessage = (ev) => {
      try { this.handlers.onMessage(JSON.parse(String(ev.data))); } catch { /* mensaje no JSON */ }
    };
    this.ws.onclose = () => { this.handlers.onStatus('closed'); if (!this.closedByUser) this.scheduleReconnect(); };
    this.ws.onerror = () => this.ws?.close();
  }

  send(obj: unknown) {
    if (this.ws?.readyState === WebSocket.OPEN) { this.ws.send(JSON.stringify(obj)); return true; }
    return false;
  }

  close() {
    this.closedByUser = true;
    if (this.timer) clearTimeout(this.timer);
    this.ws?.close();
  }

  private scheduleReconnect() {
    const delay = Math.min(15_000, 1000 * 2 ** this.attempts++);
    this.timer = setTimeout(() => this.connect(), delay);
  }
}
