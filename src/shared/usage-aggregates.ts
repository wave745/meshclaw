export function buildUsageAggregateTail(params: {
    byChannelMap: Map<string, any>;
    latencyTotals: { count: number; sum: number; min: number; max: number; p95Max: number };
    dailyLatencyMap: Map<string, any>;
    modelDailyMap: Map<string, any>;
    dailyMap: Map<string, any>;
}) {
    const byChannel = Array.from(params.byChannelMap.entries())
        .map(([channel, totals]) => ({ channel, totals }))
        .toSorted((a, b) => b.totals.totalCost - a.totals.totalCost);

    const latency = params.latencyTotals.count > 0 ? {
        count: params.latencyTotals.count,
        avgMs: params.latencyTotals.sum / params.latencyTotals.count,
        minMs: params.latencyTotals.min,
        maxMs: params.latencyTotals.max,
        p95Ms: params.latencyTotals.p95Max,
    } : undefined;

    const dailyLatency = Array.from(params.dailyLatencyMap.values()).toSorted((a, b) =>
        a.date.localeCompare(b.date),
    );

    const modelDaily = Array.from(params.modelDailyMap.values()).toSorted((a, b) =>
        a.date.localeCompare(b.date) || b.cost - a.cost,
    );

    const daily = Array.from(params.dailyMap.values()).toSorted((a, b) =>
        a.date.localeCompare(b.date),
    );

    return {
        byChannel,
        latency,
        dailyLatency,
        modelDaily,
        daily,
    };
}
