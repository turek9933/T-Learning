import { WsIncomingEvent, WsOutgoingEvent } from "@/types/chat";
import { env } from "./env";

type EventHandler = (event: WsIncomingEvent) => void;

class WsClient {
    private ws: WebSocket | null = null;
    private handlers: Set<EventHandler> = new Set();
    private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    private reconnectDelay = 1000;

    connect() {
        if (this.ws?.readyState === WebSocket.OPEN) return;

        this.ws = new WebSocket(env.wsUrl);

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data) as WsIncomingEvent;
            this.handlers.forEach((handler) => handler(data));
        };

        this.ws.onclose = () => {
            this.scheduleReconnect();
        };

        this.ws.onerror = () => {
            this.ws?.close();
        };

    }
    private scheduleReconnect() {
        if (this.reconnectTimeout) return;

        this.reconnectTimeout = setTimeout(() => {
            this.reconnectTimeout = null;
            this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
            this.connect();
        }, this.reconnectDelay);
    }

    send(event: WsOutgoingEvent) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(event));
        }
    }

    subscribe(handler: EventHandler) {
        this.handlers.add(handler);
        return () => { this.handlers.delete(handler) };
    }

    disconnect() {
        if (this.reconnectTimeout)
            clearTimeout(this.reconnectTimeout);

        this.ws?.close();
        this.ws = null;
    }
}

export const wsClient = new WsClient();