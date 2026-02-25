/**
 * Supported peer kinds for chat sessions.
 * 
 * - "direct": Direct message (DM) with a single user.
 * - "group": Group chat with multiple users (e.g. WhatsApp Group, Discord Channel).
 * - "channel": Public broadcast channel or similar.
 * - "unknown": Fallback for ambiguous or newly supported peer kinds.
 */
export type ChatType = "direct" | "group" | "channel" | "unknown";
