import { gossipsub } from "@chainsafe/libp2p-gossipsub";
import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { mdns } from "@libp2p/mdns";
import { tcp } from "@libp2p/tcp";
import { createLibp2p, Libp2p } from "libp2p";
import { MeshMessageSchema } from "../../packages/mesh/protocol.js";
import { createSubsystemLogger } from "../logging/subsystem.js";
import type {
    GatewayRequestHandlers,
    GatewayRequestHandlerOptions,
} from "./server-methods/types.js";

const log = createSubsystemLogger("mesh");

/** Shape of a peer:discovery CustomEvent detail. */
type PeerDiscoveryDetail = { id: { toString(): string } };

/** Shape of a peer:connect / peer:disconnect CustomEvent detail. */
type PeerIdDetail = { toString(): string };

/** Shape of a GossipSub message CustomEvent detail. */
type PubSubMessageDetail = {
    topic: string;
    from: { toString(): string };
    data: Uint8Array;
};

export type MeshExtension = {
    node: Libp2p;
    stop: () => Promise<void>;
};

let meshNode: Libp2p | null = null;
let currentMeshId: string = "mesh-default";

export async function initMesh(
    _gateway: unknown,
    options: { meshId: string },
): Promise<MeshExtension> {
    log.info(`Initializing MeshClaw layer with ID: ${options.meshId}`);
    currentMeshId = options.meshId;

    const node = await createLibp2p({
        addresses: {
            listen: ["/ip4/0.0.0.0/tcp/0"],
        },
        transports: [tcp()],
        connectionEncryption: [noise()],
        streamMuxers: [yamux()],
        peerDiscovery: [
            mdns({
                interval: 2000,
            }),
        ],
        services: {
            pubsub: gossipsub({
                allowPublishToZeroPeers: true,
                emitSelf: false,
            }),
        },
    });

    meshNode = node;
    await node.start();
    log.info(`Mesh node active: ${node.peerId.toString()}`);

    node.addEventListener("peer:discovery", (evt: CustomEvent<PeerDiscoveryDetail>) => {
        const peerId = evt.detail.id.toString();
        log.info(`Discovered neighbor node: ${peerId}`);
    });

    node.addEventListener("peer:connect", (evt: CustomEvent<PeerIdDetail>) => {
        log.info(`Connected to peer: ${evt.detail.toString()}`);
    });

    node.addEventListener("peer:disconnect", (evt: CustomEvent<PeerIdDetail>) => {
        log.info(`Disconnected from peer: ${evt.detail.toString()}`);
    });

    // Subscribe to core broadcast topic
    if (node.services.pubsub) {
        node.services.pubsub.subscribe("mesh:broadcast");
        node.services.pubsub.addEventListener("message", (evt: CustomEvent<PubSubMessageDetail>) => {
            if (evt.detail.topic === "mesh:broadcast") {
                try {
                    const rawData = new TextDecoder().decode(evt.detail.data);
                    const message: unknown = JSON.parse(rawData);
                    const validated = MeshMessageSchema.safeParse(message);

                    if (validated.success) {
                        log.info(
                            `Valid mesh message [${validated.data.type}] from ${evt.detail.from.toString()}`,
                        );
                        if (validated.data.type === "memory-sync") {
                            const senderId = evt.detail.from.toString();
                            void handleIncomingMemorySync(senderId, validated.data);
                        }
                    } else {
                        log.warn(`Invalid mesh message received: ${validated.error.message}`);
                    }
                } catch (err) {
                    log.error(`Failed to process mesh message: ${String(err)}`);
                }
            }
        });
    }

    return {
        node,
        stop: async () => {
            await node.stop();
            meshNode = null;
            log.info("Mesh layer stopped.");
        },
    };
}

/** Broadcasts a memory update to the mesh. */
export async function broadcastMeshMemory(params: {
    docId: string;
    content: string;
}): Promise<void> {
    if (!meshNode || !meshNode.services.pubsub) {
        return;
    }

    log.info(`Broadcasting memory sync for ${params.docId}`);
    const data = new TextEncoder().encode(
        JSON.stringify({
            type: "memory-sync",
            docId: params.docId,
            delta: params.content,
            version: Date.now(),
        }),
    );

    await meshNode.services.pubsub.publish("mesh:broadcast", data);
}

import fs from "node:fs/promises";
import path from "node:path";
import { resolveDefaultAgentId, resolveAgentWorkspaceDir } from "../agents/agent-scope.js";
import { loadConfig } from "../config/config.js";

async function handleIncomingMemorySync(
    senderId: string,
    message: { docId: string; delta: any },
) {
    try {
        const config = await loadConfig();
        const defaultAgentId = resolveDefaultAgentId(config);
        const workspaceDir = resolveAgentWorkspaceDir(config, defaultAgentId);

        // mesh memory lives in a subdirectory of the agent workspace
        const meshMemoryRoot = path.join(workspaceDir, "memory", "mesh", senderId);
        await fs.mkdir(meshMemoryRoot, { recursive: true });

        const filePath = path.join(meshMemoryRoot, message.docId);
        await fs.writeFile(filePath, String(message.delta), "utf-8");

        log.info(`Synced remote memory from [${senderId}]: ${message.docId}`);
    } catch (err) {
        log.error(`Failed to save incoming memory sync: ${String(err)}`);
    }
}

import { meshRustClient } from "./mesh-rust-client.js";

export const meshHandlers: GatewayRequestHandlers = {
    "mesh:join": async (opts: GatewayRequestHandlerOptions) => {
        log.info(`Join mesh request received: ${JSON.stringify(opts.params)}`);
        opts.respond(true, { meshId: currentMeshId });
    },
    "mesh:broadcast": async (opts: GatewayRequestHandlerOptions) => {
        const canJsNode = meshNode && meshNode.services.pubsub;

        log.info(`Broadcasting mesh message: ${JSON.stringify(opts.params)}`);

        // Broadcast in JS mesh
        if (canJsNode) {
            const data = new TextEncoder().encode(
                JSON.stringify({
                    type: "broadcast",
                    data: opts.params,
                }),
            );
            await meshNode.services.pubsub.publish("mesh:broadcast", data);
        }

        // Also proxy to Rust mesh
        meshRustClient.broadcast(JSON.stringify({
            type: "broadcast",
            data: opts.params,
        }));

        opts.respond(true);
    },
    "mesh:status": async (opts: GatewayRequestHandlerOptions) => {
        if (!meshNode) {
            return opts.respond(true, { enabled: false, peers: [] });
        }

        // Convert peers to UI format
        const peers = meshNode.getPeers().map((p) => ({
            id: p.toString(),
            addresses: meshNode?.getMultiaddrs().map((a) => a.toString()), // Placeholder: in real libp2p you query peerStore
        }));

        opts.respond(true, {
            enabled: true,
            meshId: currentMeshId,
            peers,
        });
    },
};
