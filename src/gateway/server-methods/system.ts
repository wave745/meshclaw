import { ErrorCodes, errorShape } from "../protocol/index.js";
import type { GatewayRequestHandlers } from "./types.js";

export const systemHandlers: GatewayRequestHandlers = {
  "last-heartbeat": ({ respond }) => {
    respond(true, null, undefined);
  },
  "set-heartbeats": ({ params, respond }) => {
    respond(true, { ok: true, enabled: params.enabled }, undefined);
  },
  "system-presence": ({ respond }) => {
    respond(true, [], undefined);
  },
  "system-event": ({ params, respond }) => {
    respond(true, { ok: true }, undefined);
  },
};
