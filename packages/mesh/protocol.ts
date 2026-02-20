import { z } from "zod";

export const MeshPeerSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  capabilities: z.array(z.string()),
  lastSeen: z.number(),
  addresses: z.array(z.string()),
});

export const MeshDiscoverySchema = z.object({
  type: z.literal("discovery"),
  node: MeshPeerSchema,
});

export const MeshBroadcastSchema = z.object({
  type: z.literal("broadcast"),
  channel: z.string(),
  sender: z.string(),
  content: z.string(),
  timestamp: z.number(),
  signature: z.string().optional(),
});

export const MeshDelegateSchema = z.object({
  type: z.literal("delegate"),
  taskId: z.string().uuid(),
  taskDesc: z.string(),
  requesterId: z.string(),
  assigneeId: z.string(),
  payload: z.any(),
  timestamp: z.number(),
});

export const MeshMemorySyncSchema = z.object({
  type: z.literal("memory-sync"),
  docId: z.string(),
  delta: z.any(), // CRDT delta (Yjs/Automerge)
  version: z.number(),
});

export const MeshMessageSchema = z.union([
  MeshDiscoverySchema,
  MeshBroadcastSchema,
  MeshDelegateSchema,
  MeshMemorySyncSchema,
]);

export type MeshPeer = z.infer<typeof MeshPeerSchema>;
export type MeshDiscovery = z.infer<typeof MeshDiscoverySchema>;
export type MeshBroadcast = z.infer<typeof MeshBroadcastSchema>;
export type MeshDelegate = z.infer<typeof MeshDelegateSchema>;
export type MeshMemorySync = z.infer<typeof MeshMemorySyncSchema>;
export type MeshMessage = z.infer<typeof MeshMessageSchema>;
