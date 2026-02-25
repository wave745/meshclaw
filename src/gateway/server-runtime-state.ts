import { createServer, type IncomingMessage, type ServerResponse } from "http";
import { WebSocketServer, type WebSocket } from "ws";
import type { Socket } from "net";
import type { OpenClawConfig, GatewayHttpResponsesConfig } from "../config/config.js";
import type { ResolvedGatewayAuth } from "./auth.js";
import type { AuthRateLimiter } from "./auth-rate-limit.js";
import type { SubsystemLogger } from "../logging/subsystem.js";
import { createGatewayBroadcaster } from "./server-broadcast.js";

export type GatewayRuntimeState = {
  httpServer: ReturnType<typeof createServer>;
  httpServers: ReturnType<typeof createServer>[];
  wss: WebSocketServer;
  clients: Set<import("./server/ws-types.js").GatewayWsClient>;
  broadcast: import("./server-broadcast.js").GatewayBroadcastFn;
  broadcastToConnIds: import("./server-broadcast.js").GatewayBroadcastToConnIdsFn;
};

export async function createGatewayRuntimeState(params: {
  cfg: OpenClawConfig;
  bindHost: string;
  port: number;
  openAiChatCompletionsEnabled: boolean;
  openResponsesEnabled: boolean;
  openResponsesConfig?: GatewayHttpResponsesConfig;
  resolvedAuth: ResolvedGatewayAuth;
  rateLimiter?: AuthRateLimiter;
  gatewayTls: unknown;
  hooksConfig: () => unknown;
  log: SubsystemLogger;
  logHooks: SubsystemLogger;
  logPlugins: SubsystemLogger;
}): Promise<GatewayRuntimeState> {
  const { bindHost, port } = params;

  const httpServer = createServer((req: IncomingMessage, res: ServerResponse) => {
    if (req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok" }));
      return;
    }
    res.writeHead(404);
    res.end();
  });

  const wss = new WebSocketServer({ noServer: true });
  const clients = new Set<import("./server/ws-types.js").GatewayWsClient>();
  const { broadcast, broadcastToConnIds } = createGatewayBroadcaster({ clients });

  httpServer.on("upgrade", (req: IncomingMessage, socket: Socket, head: Buffer) => {
    wss.handleUpgrade(req, socket, head, (ws: WebSocket) => {
      wss.emit("connection", ws, req);
    });
  });

  return new Promise((resolve) => {
    httpServer.listen(port, bindHost, () => {
      resolve({
        httpServer,
        httpServers: [httpServer],
        wss,
        clients,
        broadcast,
        broadcastToConnIds,
      });
    });
  });
}
