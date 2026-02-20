import type { OpenClawApp } from "../app.ts";

interface MeshPeer {
  id: string;
  name?: string;
  addresses?: string[];
  capabilities?: string[];
}

interface MeshStatusResponse {
  enabled?: boolean;
  meshId?: string;
  peers?: MeshPeer[];
}

export async function loadMesh(host: OpenClawApp) {
  if (!host.client || !host.connected) {
    return;
  }

  host.meshBusy = true;
  try {
    // This is a placeholder for a real "mesh:status" call
    // Since we only implemented fetch-based responders in gateway so far,
    // we assume the gateway hello snapshot or a dedicated call will provide this.
    const res = await host.client.request<MeshStatusResponse>("mesh:status", {});
    if (res) {
      host.meshEnabled = res.enabled ?? false;
      host.meshId = res.meshId ?? null;
      host.meshPeers = res.peers ?? [];
    }
  } catch (err) {
    console.error("Failed to load mesh status:", err);
  } finally {
    host.meshBusy = false;
  }
}
