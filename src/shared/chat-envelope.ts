export function stripEnvelope(text: string): string {
    if (!text) {
        return text;
    }
    const match = /^<([\w-]+)>(.*)<\/\1>$/s.exec(text.trim());
    if (match) {
        return match[2].trim();
    }
    return text;
}
