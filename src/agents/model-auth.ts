export async function resolveApiKeyForProvider() {
  return { source: "stub", mode: "api-key", apiKey: "stub" };
}

export function resolveEnvApiKey() {
  return null;
}

export function resolveAwsSdkEnvVarName() {
  return undefined;
}

export function ensureAuthProfileStore() {
  return { profiles: {} };
}

export function resolveAuthProfileOrder() {
  return [];
}

export function resolveModelAuthMode() {
  return "unknown";
}
