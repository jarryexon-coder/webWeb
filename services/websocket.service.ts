export class WebSocketService {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Function[]> = new Map();

  connect() {
    this.ws = new WebSocket('wss://your-api.com/ws/analytics');
    
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const listeners = this.listeners.get(data.type) || [];
      listeners.forEach(callback => callback(data));
    };
  }

  subscribe(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  unsubscribe(event: string, callback: Function) {
    const listeners = this.listeners.get(event) || [];
    this.listeners.set(event, listeners.filter(cb => cb !== callback));
  }
}
