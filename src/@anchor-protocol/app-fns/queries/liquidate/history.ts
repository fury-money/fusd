import { WhitelistCollateral } from "queries";

export interface LiquidationQueryParams {
  endpoint: string;
  collateral: WhitelistCollateral | undefined;
}

export interface LiquidationData {
  date: string;
  amountLiquidated: number;
  amountPaid: number;
  currentPrice: number;
}

export async function liquidationHistoryQuery({
  endpoint,
  collateral,
}: LiquidationQueryParams): Promise<LiquidationData[]> {
  const liquidations: LiquidationData[] = await fetch(
    `${endpoint}/v3/liquidations?limit=200&sort=date,DESC&filter=currency||$eq||${collateral?.collateral_token}`
  ).then((res) => res.json());
  return liquidations;
}
