import { configHandlers } from "./server-methods/config.js";
import { connectHandlers } from "./server-methods/connect.js";
import { healthHandlers } from "./server-methods/health.js";
import { systemHandlers } from "./server-methods/system.js";
import { nodeHandlers } from "./server-methods/nodes.js";
import { ErrorCodes, errorShape } from "./protocol/index.js";
import type { GatewayRequestHandlers, GatewayRequestOptions } from "./server-methods/types.js";

export const coreGatewayHandlers: GatewayRequestHandlers = {
  ...connectHandlers,
  ...healthHandlers,
  ...configHandlers,
  ...systemHandlers,
  ...nodeHandlers,
};

export async function handleGatewayRequest(
  opts: GatewayRequestOptions & { extraHandlers?: GatewayRequestHandlers },
): Promise<void> {
  const { req, respond, client, context } = opts;

  const handler = opts.extraHandlers?.[req.method] ?? coreGatewayHandlers[req.method];
  if (!handler) {
    respond(
      false,
      undefined,
      errorShape(ErrorCodes.INVALID_REQUEST, `unknown method: ${req.method}`),
    );
    return;
  }

  try {
    await handler({
      req,
      params: (req.params ?? {}) as Record<string, unknown>,
      client,
      respond,
      context,
    });
  } catch (err) {
    console.error(`Error handling gateway request ${req.method}:`, err);
    respond(false, undefined, errorShape(ErrorCodes.SERVER_ERROR, "Internal server error"));
  }
}
