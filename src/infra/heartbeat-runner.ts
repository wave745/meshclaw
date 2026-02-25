export async function runHeartbeatOnce() {
  return { status: "skipped", reason: "disabled" };
}

export function setHeartbeatsEnabled() { }
export function isHeartbeatEnabledForAgent() { return false; }
export function resolveHeartbeatIntervalMs() { return null; }
export function resolveHeartbeatPrompt() { return ""; }
export function isCronSystemEvent() { return false; }

export function setHeartbeatWakeHandler() { }

export function triggerHeartbeatForSession() { }

export function createHeartbeatRunner() {
  return {
    stop: () => { },
    updateConfig: () => { },
  };
}
