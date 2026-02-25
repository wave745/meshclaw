export type DeviceAuthRole = "admin" | "user" | "guest";

export type DeviceAuthEntry = {
    token: string;
    role: string;
    scopes: string[];
    updatedAtMs: number;
};

export type DeviceAuthStore = {
    version: 1;
    deviceId: string;
    tokens: Record<string, DeviceAuthEntry>;
};

export function normalizeDeviceAuthRole(role?: string | null): string {
    if (!role) return "guest";
    const r = role.toLowerCase().trim();
    if (r === "admin" || r === "root") return "admin";
    if (r === "user") return "user";
    return "guest";
}

export function normalizeDeviceAuthScopes(scopes?: string[] | null): string[] {
    if (!Array.isArray(scopes)) return [];
    return Array.from(new Set(scopes.map(s => s.trim().toLowerCase()).filter(Boolean))).sort();
}
