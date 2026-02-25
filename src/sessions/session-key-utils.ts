export type ParsedAgentSessionKey = {
    agentId: string;
    rest: string;
};

/**
 * Parses a session key in the format "agent:<agentId>:<rest>".
 * Returns null if the format doesn't match.
 */
export function parseAgentSessionKey(key: string | undefined | null): ParsedAgentSessionKey | null {
    if (!key || typeof key !== "string") {
        return null;
    }
    const trimmed = key.trim();
    if (!trimmed.toLowerCase().startsWith("agent:")) {
        return null;
    }
    const parts = trimmed.split(":");
    // Format: agent:<id>:<rest...>
    if (parts.length < 3) {
        return null;
    }
    const agentId = parts[1];
    if (!agentId) {
        return null;
    }
    return {
        agentId,
        rest: parts.slice(2).join(":"),
    };
}

/**
 * Returns the nesting level of subagents based on the number of ":subagent:" markers.
 */
export function getSubagentDepth(key: string | undefined | null): number {
    if (!key) {
        return 0;
    }
    const matches = key.match(/:subagent:/g);
    return matches ? matches.length : 0;
}

/**
 * Checks if the session key represents a subagent session.
 */
export function isSubagentSessionKey(key: string | undefined | null): boolean {
    return typeof key === "string" && key.includes(":subagent:");
}

/**
 * Checks if the session key represents an ACP (Agent Client Protocol) session.
 */
export function isAcpSessionKey(key: string | undefined | null): boolean {
    return typeof key === "string" && key.includes(":acp:");
}

/**
 * Checks if the session key represents a cron job session.
 */
export function isCronSessionKey(key: string | undefined | null): boolean {
    if (!key) {
        return false;
    }
    // Cron sessions look like agent:main:cron:job-id or agent:main:cron:job-id:run:run-id
    return key.includes(":cron:");
}
