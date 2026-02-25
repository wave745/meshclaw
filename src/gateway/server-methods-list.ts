export const BASE_METHODS = [
  "health",
  "status",
  "config.get",
  "config.set",
  "config.apply",
  "config.patch",
  "config.schema",
  "node.pair.request",
  "node.pair.list",
  "node.pair.approve",
  "node.pair.reject",
  "node.pair.verify",
  "device.pair.list",
  "device.pair.approve",
  "device.pair.reject",
  "device.pair.remove",
  "device.token.rotate",
  "device.token.revoke",
  "node.list",
  "node.describe",
  "node.invoke",
  "node.invoke.result",
  "node.event",
  "system-presence",
  "system-event",
  "mesh:join",
  "mesh:broadcast",
  "mesh:status",
];

export function listGatewayMethods(): string[] {
  return [...BASE_METHODS];
}

export const GATEWAY_EVENTS = [
  "connect.challenge",
  "presence",
  "tick",
  "shutdown",
  "health",
  "node.pair.requested",
  "node.pair.resolved",
  "node.invoke.request",
  "device.pair.requested",
  "device.pair.resolved",
  "mesh:broadcast",
];
