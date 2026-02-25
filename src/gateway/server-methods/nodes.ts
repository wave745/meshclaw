import { ErrorCodes, errorShape } from "../protocol/index.js";
import type { GatewayRequestHandlers } from "./types.js";

export const nodeHandlers: GatewayRequestHandlers = {
  "node.pair.request": async ({ respond }) => {
    respond(true, { status: "pending", created: true }, undefined);
  },
  "node.pair.list": async ({ respond }) => {
    respond(true, { pending: [], paired: [] }, undefined);
  },
  "node.pair.approve": async ({ respond }) => {
    respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, "not implemented"));
  },
  "node.pair.reject": async ({ respond }) => {
    respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, "not implemented"));
  },
  "node.pair.verify": async ({ respond }) => {
    respond(true, { ok: false }, undefined);
  },
  "node.rename": async ({ respond }) => {
    respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, "not implemented"));
  },
  "node.list": async ({ respond }) => {
    respond(true, { ts: Date.now(), nodes: [] }, undefined);
  },
  "node.describe": async ({ respond }) => {
    respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, "unknown nodeId"));
  },
  "node.invoke": async ({ respond }) => {
    respond(false, undefined, errorShape(ErrorCodes.UNAVAILABLE, "node not connected"));
  },
  "node.invoke.result": async ({ respond }) => {
    respond(true, { ok: true }, undefined);
  },
  "node.event": async ({ respond }) => {
    respond(true, { ok: true }, undefined);
  },
};
