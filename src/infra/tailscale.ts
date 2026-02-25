export async function findTailscaleBinary() { return null; }
export async function getTailnetHostname() { throw new Error("Tailscale not available"); }
export async function getTailscaleBinary() { return "tailscale"; }
export async function readTailscaleStatusJson() { return {}; }
export async function readTailscaleWhoisIdentity() { return null; }
export async function ensureFunnel() { }
export async function enableTailscaleServe() { }
export async function disableTailscaleServe() { }
export async function enableTailscaleFunnel() { }
export async function disableTailscaleFunnel() { }
