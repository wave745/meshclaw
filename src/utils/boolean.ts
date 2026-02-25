export function parseBoolean(value: unknown): boolean {
    if (typeof value === "boolean") {
        return value;
    }
    if (typeof value === "string") {
        const lowered = value.toLowerCase().trim();
        if (lowered === "true" || lowered === "1" || lowered === "yes" || lowered === "on") {
            return true;
        }
    }
    if (typeof value === "number") {
        return value !== 0;
    }
    return false;
}

export const parseBooleanValue = parseBoolean;
