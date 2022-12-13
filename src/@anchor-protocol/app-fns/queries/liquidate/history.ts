export interface LiquidationQueryParams {
  endpoint: string;
}

export interface LiquidationData {
  date: string;
  amountLiquidated: number;
  amountPaid: number;
  currentPrice: number;
}

export async function liquidationHistoryQuery({
  endpoint,
}: LiquidationQueryParams): Promise<LiquidationData[]> {
  const liquidations: LiquidationData[] = await fetch(
    `${endpoint}/v3/liquidations`,
  ).then((res) => res.json());
  return liquidations;
}
