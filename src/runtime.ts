export type RuntimeEnv = {
    log: (message: string) => void;
    error: (message: string) => void;
    exit: (code?: number) => void;
};

export const defaultRuntime: RuntimeEnv = {
    log: (msg) => console.log(msg),
    error: (msg) => console.error(msg),
    exit: (code) => process.exit(code),
};
