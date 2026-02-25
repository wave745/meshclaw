import { meshRustClient } from "../mesh-rust-client.js";
import type { GatewayRequestHandlers, GatewayRequestHandlerOptions } from "./types.js";

export const meshHandlers: GatewayRequestHandlers = {
    "mesh:join": async (opts: GatewayRequestHandlerOptions) => {
        // In a headless setup, this could trigger the Rust client to connect to a specific bootstrap peer
        opts.respond(true, { status: "joining" });
    },
    "mesh:broadcast": async (opts: GatewayRequestHandlerOptions) => {
        // Proxy directly to Rust bridge using the JSON protocol
        meshRustClient.broadcast({
            method: "broadcast",
            params: opts.params
        });
        opts.respond(true);
    },
    "mesh:query": async (opts: GatewayRequestHandlerOptions) => {
        const key = (opts.params as any).key;
        if (!key) {
            opts.respond(false, { error: "Missing key" });
            return;
        }
        const result = await meshRustClient.query(key);
        opts.respond(true, { key, result });
    },
    "mesh:peers": async (opts: GatewayRequestHandlerOptions) => {
        const peers = await meshRustClient.listPeers();
        opts.respond(true, { peers });
    },
    "mesh:status": async (opts: GatewayRequestHandlerOptions) => {
        opts.respond(true, {
            bridgeConnected: meshRustClient.isConnected(),
        });
    },
};
