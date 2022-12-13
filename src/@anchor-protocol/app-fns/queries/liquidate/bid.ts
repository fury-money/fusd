import { HumanAddr, liquidation } from '@anchor-protocol/types';
import {
  QueryClient,
  wasmFetch,
  WasmQuery,
  WasmQueryData,
} from '@libs/query-client';

interface BidWasmQuery {
  bid: WasmQuery<
    liquidation.liquidationQueueContract.Bid,
    liquidation.liquidationQueueContract.BidResponse
  >;
}

export type Bid = WasmQueryData<BidWasmQuery>;

export async function bidQuery(
  queryClient: QueryClient,
  liquidationContract: HumanAddr,
  bidIdx: number,
): Promise<Bid> {
  return wasmFetch<BidWasmQuery>({
    ...queryClient,
    id: `liquidation-queue--bid`,
    wasmQuery: {
      bid: {
        contractAddress: liquidationContract,
        query: {
          bid: {
            bid_idx: bidIdx,
          },
        },
      },
    },
  });
}
