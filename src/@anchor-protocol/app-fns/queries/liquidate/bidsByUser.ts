import { CW20Addr, HumanAddr, liquidation } from '@anchor-protocol/types';
import {
  QueryClient,
  wasmFetch,
  WasmQuery,
  WasmQueryData,
} from '@libs/query-client';

interface BidByUserWasmQuery {
  bidByUser: WasmQuery<
    liquidation.liquidationQueueContract.BidsByUser,
    liquidation.liquidationQueueContract.BidsByUserResponse
  >;
}

export type BidByUser = WasmQueryData<BidByUserWasmQuery>;

export async function bidsByUserQuery(
  queryClient: QueryClient,
  liquidationContract: HumanAddr,
  collateralToken: CW20Addr,
  userAddress?: HumanAddr,
  startAfter?: HumanAddr,
  limit?: number,
): Promise<BidByUser> {
  return wasmFetch<BidByUserWasmQuery>({
    ...queryClient,
    id: `liquidation-queue--bid-by-user`,
    wasmQuery: {
      bidByUser: {
        contractAddress: liquidationContract,
        query: {
          bids_by_user: {
            collateral_token: collateralToken,
            bidder: userAddress,
            start_after: startAfter,
            limit,
          },
        },
      },
    },
  });
}
