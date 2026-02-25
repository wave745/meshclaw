import { EventEmitter } from "node:events";

const transcriptEmitter = new EventEmitter();

/**
 * Emits an event when a session transcript file has been updated.
 */
export function emitSessionTranscriptUpdate(sessionFile: string) {
    transcriptEmitter.emit("update", sessionFile);
}

/**
 * Registers a listener for session transcript updates.
 */
export function onSessionTranscriptUpdate(handler: (sessionFile: string) => void) {
    transcriptEmitter.on("update", handler);
}

/**
 * Removes a listener for session transcript updates.
 */
export function offSessionTranscriptUpdate(handler: (sessionFile: string) => void) {
    transcriptEmitter.off("update", handler);
}
