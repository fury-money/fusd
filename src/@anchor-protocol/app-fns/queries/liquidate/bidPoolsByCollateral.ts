import { CW20Addr, HumanAddr, liquidation } from '@anchor-protocol/types';
import {
  QueryClient,
  wasmFetch,
  WasmQuery,
  WasmQueryData,
} from '@libs/query-client';

interface BidPoolsByCollateralWasmQuery {
  bidPoolsByCollateral: WasmQuery<
    liquidation.liquidationQueueContract.BidPoolsByCollateral,
    liquidation.liquidationQueueContract.BidsPoolsByCollateralResponse
  >;
}

export type BidPoolsByCollateral = WasmQueryData<BidPoolsByCollateralWasmQuery>;

export async function bidPoolsByCollateralQuery(
  queryClient: QueryClient,
  liquidationContract: HumanAddr,
  collateralToken: CW20Addr,
  startAfter?: HumanAddr,
  limit?: number,
): Promise<BidPoolsByCollateral> {
  return wasmFetch<BidPoolsByCollateralWasmQuery>({
    ...queryClient,
    id: `liquidation-queue--bid-pools-by-collateral`,
    wasmQuery: {
      bidPoolsByCollateral: {
        contractAddress: liquidationContract,
        query: {
          bid_pools_by_collateral: {
            collateral_token: collateralToken,
            start_after: startAfter,
            limit,
          },
        },
      },
    },
  });
}
