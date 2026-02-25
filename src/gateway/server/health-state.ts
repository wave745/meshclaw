export type HealthSummary = {
  status: string;
};

let presenceVersion = 1;
let healthVersion = 1;
let healthCache: HealthSummary | null = { status: "ok" };

export function buildGatewaySnapshot() {
  return {
    presence: [],
    health: healthCache,
    stateVersion: { presence: presenceVersion, health: healthVersion },
    uptimeMs: Math.round(process.uptime() * 1000),
  };
}

export function getHealthCache(): HealthSummary | null {
  return healthCache;
}

export function getHealthVersion(): number {
  return healthVersion;
}

export function incrementPresenceVersion(): number {
  presenceVersion += 1;
  return presenceVersion;
}

export function getPresenceVersion(): number {
  return presenceVersion;
}

export function setBroadcastHealthUpdate() { }

export async function refreshGatewayHealthSnapshot() {
  healthVersion += 1;
  return healthCache;
}
