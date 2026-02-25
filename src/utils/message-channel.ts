export type ClientInfo = {
    id: string;
    name?: string;
    platform?: string;
    version?: string;
    displayName?: string;
    deviceFamily?: string;
    modelIdentifier?: string;
};

export function isWebchatClient(client: ClientInfo): boolean {
    return client?.platform === "webchat";
}
