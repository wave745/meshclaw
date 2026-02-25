import type {
  GatewayAuthConfig,
  GatewayBindMode,
  GatewayTailscaleConfig,
  loadConfig,
} from "../config/config.js";
import {
  assertGatewayAuthConfigured,
  type ResolvedGatewayAuth,
  resolveGatewayAuth,
} from "./auth.js";
import { resolveHooksConfig } from "./hooks.js";
import { isLoopbackHost, isValidIPv4, resolveGatewayBindHost } from "./net.js";
import { mergeGatewayTailscaleConfig } from "./startup-auth.js";

export type GatewayRuntimeConfig = {
  bindHost: string;
  openAiChatCompletionsEnabled: boolean;
  openResponsesEnabled: boolean;
  openResponsesConfig?: import("../config/types.gateway.js").GatewayHttpResponsesConfig;
  resolvedAuth: ResolvedGatewayAuth;
  authMode: ResolvedGatewayAuth["mode"];
  tailscaleConfig: GatewayTailscaleConfig;
  tailscaleMode: "off" | "serve" | "funnel";
  hooksConfig: ReturnType<typeof resolveHooksConfig>;
};

export async function resolveGatewayRuntimeConfig(params: {
  cfg: ReturnType<typeof loadConfig>;
  port: number;
  bind?: GatewayBindMode;
  host?: string;
  openAiChatCompletionsEnabled?: boolean;
  openResponsesEnabled?: boolean;
  auth?: GatewayAuthConfig;
  tailscale?: GatewayTailscaleConfig;
}): Promise<GatewayRuntimeConfig> {
  const bindMode = params.bind ?? params.cfg.gateway?.bind ?? "loopback";
  const customBindHost = params.cfg.gateway?.customBindHost;
  const bindHost = params.host ?? (await resolveGatewayBindHost(bindMode, customBindHost));
  if (bindMode === "loopback" && !isLoopbackHost(bindHost)) {
    throw new Error(
      `gateway bind=loopback resolved to non-loopback host ${bindHost}; refusing fallback to a network bind`,
    );
  }
  if (bindMode === "custom") {
    const configuredCustomBindHost = customBindHost?.trim();
    if (!configuredCustomBindHost) {
      throw new Error("gateway.bind=custom requires gateway.customBindHost");
    }
    if (!isValidIPv4(configuredCustomBindHost)) {
      throw new Error(
        `gateway.bind=custom requires a valid IPv4 customBindHost (got ${configuredCustomBindHost})`,
      );
    }
    if (bindHost !== configuredCustomBindHost) {
      throw new Error(
        `gateway bind=custom requested ${configuredCustomBindHost} but resolved ${bindHost}; refusing fallback`,
      );
    }
  }
  const openAiChatCompletionsEnabled =
    params.openAiChatCompletionsEnabled ??
    params.cfg.gateway?.http?.endpoints?.chatCompletions?.enabled ??
    false;
  const openResponsesConfig = params.cfg.gateway?.http?.endpoints?.responses;
  const openResponsesEnabled = params.openResponsesEnabled ?? openResponsesConfig?.enabled ?? false;
  const tailscaleBase = params.cfg.gateway?.tailscale ?? {};
  const tailscaleOverrides = params.tailscale ?? {};
  const tailscaleConfig = mergeGatewayTailscaleConfig(tailscaleBase, tailscaleOverrides);
  const tailscaleMode = tailscaleConfig.mode ?? "off";
  const resolvedAuth = resolveGatewayAuth({
    authConfig: params.cfg.gateway?.auth,
    authOverride: params.auth,
    env: process.env,
    tailscaleMode,
  });
  const authMode: ResolvedGatewayAuth["mode"] = resolvedAuth.mode;
  const hasToken = typeof resolvedAuth.token === "string" && resolvedAuth.token.trim().length > 0;
  const hasPassword =
    typeof resolvedAuth.password === "string" && resolvedAuth.password.trim().length > 0;
  const hasSharedSecret =
    (authMode === "token" && hasToken) || (authMode === "password" && hasPassword);
  const hooksConfig = resolveHooksConfig(params.cfg);

  const trustedProxies = params.cfg.gateway?.trustedProxies ?? [];

  assertGatewayAuthConfigured(resolvedAuth);
  if (tailscaleMode === "funnel" && authMode !== "password") {
    throw new Error(
      "tailscale funnel requires gateway auth mode=password (set gateway.auth.password or OPENCLAW_GATEWAY_PASSWORD)",
    );
  }
  if (tailscaleMode !== "off" && !isLoopbackHost(bindHost)) {
    throw new Error("tailscale serve/funnel requires gateway bind=loopback (127.0.0.1)");
  }
  if (!isLoopbackHost(bindHost) && !hasSharedSecret && authMode !== "trusted-proxy") {
    throw new Error(
      `refusing to bind gateway to ${bindHost}:${params.port} without auth (set gateway.auth.token/password, or set OPENCLAW_GATEWAY_TOKEN/OPENCLAW_GATEWAY_PASSWORD)`,
    );
  }

  if (authMode === "trusted-proxy") {
    if (isLoopbackHost(bindHost)) {
      throw new Error(
        "gateway auth mode=trusted-proxy makes no sense with bind=loopback; use bind=lan or bind=custom with gateway.trustedProxies configured",
      );
    }
    if (trustedProxies.length === 0) {
      throw new Error(
        "gateway auth mode=trusted-proxy requires gateway.trustedProxies to be configured with at least one proxy IP",
      );
    }
  }

  return {
    bindHost,
    openAiChatCompletionsEnabled,
    openResponsesEnabled,
    openResponsesConfig: openResponsesConfig
      ? { ...openResponsesConfig, enabled: openResponsesEnabled }
      : undefined,
    resolvedAuth,
    authMode,
    tailscaleConfig,
    tailscaleMode,
    hooksConfig,
  };
}
