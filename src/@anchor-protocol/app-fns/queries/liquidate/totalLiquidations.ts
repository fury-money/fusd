import { CW20Addr } from "@libs/types";

export interface LiquidationQueryParams {
  endpoint: string;
}

export interface LockedCollateral {
    token: CW20Addr,
    computed_total_collateral: number
}

export async function totalCollateralsQuery({
  endpoint,
}: LiquidationQueryParams): Promise<LockedCollateral[]> {

    const totalLiquidations = await fetch(`${endpoint}/v3/total-liquidations`).then(
        (res) => res.json(),
      );
    return totalLiquidations

} 