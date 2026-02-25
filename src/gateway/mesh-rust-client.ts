import WebSocket from "ws";
import { createSubsystemLogger } from "../logging/subsystem.js";
import { EventEmitter } from "events";

const log = createSubsystemLogger("mesh-rust");

export class MeshRustClient extends EventEmitter {
    private ws: WebSocket | null = null;
    private reconnectTimer: NodeJS.Timeout | null = null;
    private pendingRequests = new Map<string, (val: any) => void>();
    private requestIdCounter = 0;

    constructor(private url: string = "ws://127.0.0.1:3001") {
        super();
    }

    connect() {
        if (this.ws) return;

        log.info(`Connecting to Rust Mesh Bridge at ${this.url}`);
        const ws = new WebSocket(this.url);

        ws.on("open", () => {
            log.info("Connected to Rust Mesh Bridge");
            if (this.reconnectTimer) {
                clearInterval(this.reconnectTimer);
                this.reconnectTimer = null;
            }
            this.emit("connected");
        });

        ws.on("message", (data: WebSocket.Data) => {
            try {
                const text = data.toString();
                log.debug(`Received from Rust: ${text}`);

                let payload;
                try {
                    payload = JSON.parse(text);
                } catch {
                    // Fallback for non-JSON messages (like raw query results)
                    payload = text;
                }

                // If it's a response to a pending request
                if (payload && typeof payload === 'object' && payload.id && this.pendingRequests.has(payload.id)) {
                    const resolve = this.pendingRequests.get(payload.id);
                    if (resolve) {
                        resolve(payload.result ?? payload);
                        this.pendingRequests.delete(payload.id);
                    }
                    return;
                }

                // Otherwise, it's a mesh message or update
                this.emit("message", payload);
            } catch (err) {
                log.error(`Failed to process message from Rust: ${String(err)}`);
            }
        });

        ws.on("error", (err: Error) => {
            log.error(`Rust Bridge error: ${err.message}`);
        });

        ws.on("close", () => {
            log.warn("Rust Bridge connection closed. Reconnecting in 5s...");
            this.ws = null;
            this.emit("disconnected");
            if (!this.reconnectTimer) {
                this.reconnectTimer = setInterval(() => this.connect(), 5000);
            }
        });

        this.ws = ws;
    }

    async query(key: string): Promise<string | null> {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            return null;
        }

        const id = `q-${++this.requestIdCounter}`;
        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                this.pendingRequests.delete(id);
                resolve(null);
            }, 5000);

            this.pendingRequests.set(id, (val) => {
                clearTimeout(timeout);
                resolve(typeof val === 'string' ? val : JSON.stringify(val));
            });

            this.ws!.send(JSON.stringify({
                id,
                method: "query",
                params: { key }
            }));
        });
    }

    broadcast(message: any) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const data = typeof message === 'string' ? message : JSON.stringify(message);
            this.ws.send(data);
        }
    }

    async listPeers(): Promise<string[]> {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            return [];
        }

        const id = `p-${++this.requestIdCounter}`;
        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                this.pendingRequests.delete(id);
                resolve([]);
            }, 5000);

            this.pendingRequests.set(id, (val) => {
                clearTimeout(timeout);
                resolve(Array.isArray(val) ? val : []);
            });

            this.ws!.send(JSON.stringify({
                id,
                method: "peers",
                params: {}
            }));
        });
    }

    isConnected(): boolean {
        return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
    }

    stop() {
        if (this.reconnectTimer) {
            clearInterval(this.reconnectTimer);
        }
        this.ws?.close();
        this.ws = null;
    }
}

export const meshRustClient = new MeshRustClient();
