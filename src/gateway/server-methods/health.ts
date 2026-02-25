import { ErrorCodes, errorShape } from "../protocol/index.js";
import type { GatewayRequestHandlers } from "./types.js";

export const healthHandlers: GatewayRequestHandlers = {
  health: async ({ respond, context }) => {
    // Basic health response
    respond(true, { status: "ok", uptime: process.uptime() }, undefined);
  },
  status: async ({ respond }) => {
    // Basic status response
    respond(true, { status: "ok", version: "meshclaw-headless" }, undefined);
  },
};
