export async function listDevicePairing() { return { pending: [], paired: [] }; }
export async function getPairedDevice() { return null; }
export async function requestDevicePairing(req: any) {
  return { status: "pending", request: { ...req, requestId: "stub", ts: Date.now() }, created: true };
}
export async function approveDevicePairing() { return null; }
export async function rejectDevicePairing() { return null; }
export async function removePairedDevice() { return null; }
export async function updatePairedDeviceMetadata() { }
export async function verifyDeviceToken() { return { ok: false, reason: "stub" }; }
export async function ensureDeviceToken() { return null; }
export async function rotateDeviceToken() { return null; }
export async function revokeDeviceToken() { return null; }
export function summarizeDeviceTokens() { return undefined; }
