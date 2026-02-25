import path from "node:path";

export function isPathInside(parent: string, child: string): boolean {
    const relative = path.relative(parent, child);
    return !relative.startsWith("..") && !path.isAbsolute(relative);
}
