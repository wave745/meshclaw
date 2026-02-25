import type { WebSocket } from "ws";
import type { IncomingMessage } from "node:http";
import { rawDataToString } from "../../../infra/ws.js";
import { handleGatewayRequest } from "../../server-methods.js";
import { ErrorCodes, errorShape, validateRequestFrame, validateConnectParams } from "../../protocol/index.js";
import type { GatewayWsClient } from "../ws-types.js";
import { logWs } from "../../ws-log.js";

export function attachGatewayWsMessageHandler(params: {
  socket: WebSocket;
  upgradeReq: IncomingMessage;
  connId: string;
  remoteAddr?: string;
  connectNonce: string;
  resolvedAuth: any;
  rateLimiter?: any;
  gatewayMethods: string[];
  events: string[];
  extraHandlers: any;
  buildRequestContext: () => any;
  send: (obj: unknown) => void;
  close: (code?: number, reason?: string) => void;
  isClosed: () => boolean;
  clearHandshakeTimer: () => void;
  getClient: () => GatewayWsClient | null;
  setClient: (next: GatewayWsClient) => void;
  setHandshakeState: (state: "pending" | "connected" | "failed") => void;
  setCloseCause: (cause: string, meta?: Record<string, unknown>) => void;
  setLastFrameMeta: (meta: { type?: string; method?: string; id?: string }) => void;
  logGateway: any;
  logHealth: any;
  logWsControl: any;
}) {
  const {
    socket,
    connId,
    send,
    close,
    isClosed,
    clearHandshakeTimer,
    getClient,
    setClient,
    setHandshakeState,
    setLastFrameMeta,
    buildRequestContext,
    extraHandlers
  } = params;

  socket.on("message", async (data) => {
    if (isClosed()) return;
    const text = rawDataToString(data);
    try {
      const parsed = JSON.parse(text);
      setLastFrameMeta({ type: parsed.type, method: parsed.method, id: parsed.id });

      let client = getClient();
      if (!client) {
        if (parsed.method !== "connect" || !validateConnectParams(parsed.params)) {
          send({
            type: "res",
            id: parsed.id,
            ok: false,
            error: errorShape(ErrorCodes.INVALID_REQUEST, "First request must be connect"),
          });
          close(1008, "Invalid handshake");
          return;
        }

        clearHandshakeTimer();
        setHandshakeState("connected");
        const connectParams = parsed.params;
        client = {
          connId,
          socket,
          connect: connectParams,
        } as GatewayWsClient;
        setClient(client);

        send({
          type: "res",
          id: parsed.id,
          ok: true,
          payload: {
            connId,
            sessionKey: "default",
          },
        });
        return;
      }

      if (parsed.type === "req") {
        const context = buildRequestContext();
        await handleGatewayRequest({
          req: parsed,
          context,
          extraHandlers,
          respond: (ok, payload, error) => {
            send({
              type: "res",
              id: parsed.id,
              ok,
              payload,
              error,
            });
          },
        });
      }
    } catch (err) {
      console.error("WS Message handling error:", err);
    }
  });
}
