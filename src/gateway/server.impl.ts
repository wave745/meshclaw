import { loadConfig } from "../config/config.js";
import { createSubsystemLogger } from "../logging/subsystem.js";
import { createAuthRateLimiter, type AuthRateLimiter } from "./auth-rate-limit.js";
import { meshRustClient } from "./mesh-rust-client.js";
import { meshHandlers } from "./server-methods/mesh.js";
import { resolveGatewayRuntimeConfig } from "./server-runtime-config.js";
import { createGatewayRuntimeState } from "./server-runtime-state.js";
import { GATEWAY_EVENTS, listGatewayMethods } from "./server-methods-list.js";
import { attachGatewayWsHandlers } from "./server-ws-runtime.js";
import { NodeRegistry } from "./node-registry.js";
import { loadGatewayTlsRuntime } from "./server/tls.js";
import { ensureGatewayStartupAuth } from "./startup-auth.js";
import { getHealthVersion, incrementPresenceVersion } from "./server/health-state.js";

const log = createSubsystemLogger("gateway");

export type GatewayServer = {
  close: (opts?: { reason?: string }) => Promise<void>;
};

export type GatewayServerOptions = {
  bind?: import("../config/config.js").GatewayBindMode;
  host?: string;
  auth?: import("../config/config.js").GatewayAuthConfig;
};

export async function startGatewayServer(
  port = 18789,
  opts: GatewayServerOptions = {},
): Promise<GatewayServer> {
  const cfgAtStart = loadConfig();

  const authBootstrap = await ensureGatewayStartupAuth({
    cfg: cfgAtStart,
    env: process.env,
    authOverride: opts.auth,
    persist: true,
  });

  const runtimeConfig = await resolveGatewayRuntimeConfig({
    cfg: authBootstrap.cfg,
    port,
    bind: opts.bind,
    host: opts.host,
    auth: opts.auth,
  });

  const {
    bindHost,
    resolvedAuth,
    openAiChatCompletionsEnabled,
    openResponsesEnabled,
    openResponsesConfig,
  } = runtimeConfig;

  const rateLimitConfig = authBootstrap.cfg.gateway?.auth?.rateLimit;
  const authRateLimiter: AuthRateLimiter | undefined = rateLimitConfig
    ? createAuthRateLimiter(rateLimitConfig)
    : undefined;

  const gatewayTls = await loadGatewayTlsRuntime(authBootstrap.cfg.gateway?.tls, log.child("tls"));

  const {
    httpServer,
    httpServers,
    wss,
    clients,
    broadcast,
    broadcastToConnIds,
  } = await createGatewayRuntimeState({
    cfg: authBootstrap.cfg,
    bindHost,
    port,
    openAiChatCompletionsEnabled,
    openResponsesEnabled,
    openResponsesConfig,
    resolvedAuth,
    rateLimiter: authRateLimiter,
    gatewayTls,
    hooksConfig: () => null, // Hooks disabled for now
    log,
    logHooks: log.child("hooks"),
    logPlugins: log.child("plugins"),
  });

  const nodeRegistry = new NodeRegistry();

  if (authBootstrap.cfg.mesh?.enabled) {
    meshRustClient.connect();
    meshRustClient.on("message", (payload) => {
      broadcast("mesh:event", payload);
    });
  }

  attachGatewayWsHandlers({
    wss,
    clients,
    port,
    gatewayHost: bindHost ?? undefined,
    resolvedAuth,
    rateLimiter: authRateLimiter,
    gatewayMethods: listGatewayMethods(),
    events: GATEWAY_EVENTS,
    logGateway: log,
    logHealth: log.child("health"),
    logWsControl: log.child("ws"),
    extraHandlers: meshHandlers,
    broadcast,
    context: {
      logGateway: log,
      broadcast,
      broadcastToConnIds,
      nodeRegistry,
      nodeSendToSession: () => { }, // Minimal stub
      nodeSendToAllSubscribed: () => { },
      nodeSubscribe: () => { },
      nodeUnsubscribe: () => { },
      nodeUnsubscribeAll: () => { },
    },
  });

  log.info(`Gateway started on ${bindHost}:${port}`);

  return {
    close: async () => {
      meshRustClient.stop();
      for (const s of httpServers) {
        s.close();
      }
      wss.close();
      authRateLimiter?.dispose();
    },
  };
}
