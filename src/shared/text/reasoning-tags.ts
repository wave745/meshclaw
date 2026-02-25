export type StripReasoningOptions = {
    mode?: "preserve" | "strip";
    trim?: "start" | "end" | "both" | "none";
};

export function stripReasoningTagsFromText(
    text: string,
    opts: StripReasoningOptions = {}
): string {
    if (!text) return text;

    const mode = opts.mode ?? "strip";
    const trim = opts.trim ?? "both";

    const regex = /<(think|reasoning|thought)\b[^>]*>([\s\S]*?)<\/\1>/gi;

    let result = text;
    if (mode === "strip" || mode === "preserve") {
        // In many OpenClaw versions, "preserve" actually strips from the main text 
        // but the thinking is processed elsewhere.
        result = text.replace(regex, "");
    }

    if (trim === "start") result = result.trimStart();
    else if (trim === "end") result = result.trimEnd();
    else if (trim === "both") result = result.trim();

    return result;
}
