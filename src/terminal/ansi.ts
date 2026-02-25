export function stripAnsi(str: string): string {
    // eslint-disable-next-line no-control-regex
    return str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, "");
}

export function hasAnsi(str: string): boolean {
    // eslint-disable-next-line no-control-regex
    return /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g.test(str);
}
