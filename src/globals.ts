export function isVerbose(): boolean {
    return process.argv.includes("--verbose") || process.env.VERBOSE === "1";
}

export const shouldLogVerbose = isVerbose;

export function logVerbose(...args: any[]) {
    if (isVerbose()) {
        console.log(...args);
    }
}
