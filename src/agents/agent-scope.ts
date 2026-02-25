import { DEFAULT_AGENT_ID, normalizeAgentId } from "../routing/session-key.js";

export function listAgentIds() {
  return [DEFAULT_AGENT_ID];
}

export function resolveDefaultAgentId() {
  return DEFAULT_AGENT_ID;
}

export function resolveSessionAgentId() {
  return DEFAULT_AGENT_ID;
}

export function resolveAgentConfig() {
  return undefined;
}

export function resolveAgentSkillsFilter() {
  return undefined;
}

export function resolveAgentModelPrimary() {
  return undefined;
}

export function resolveAgentDir() {
  return "";
}

export function resolveAgentWorkspaceDir() {
  return "";
}
