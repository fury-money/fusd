export interface LiquidationQueueQueryParams {
  endpoint: string;
}

export interface LiquidationQueueData {
  timestamp: number;
  token: string;
  amount: string;
}

export async function liquidationQueueHistoryQuery({
  endpoint,
}: LiquidationQueueQueryParams): Promise<LiquidationQueueData[]> {
  const liquidations: LiquidationQueueData[] = await fetch(
    `${endpoint}/v4/liquidationQueue/1d`
  ).then((res) => res.json());
  return liquidations;
}
