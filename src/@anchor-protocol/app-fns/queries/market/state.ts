import { HumanAddr, moneyMarket } from '@anchor-protocol/types';
import {
  QueryClient,
  wasmFetch,
  WasmQuery,
  WasmQueryData,
} from '@libs/query-client';

interface MarketStateWasmQuery {
  marketState: WasmQuery<
    moneyMarket.market.State,
    moneyMarket.market.StateResponse
  >;
}

export interface MarketStateQueryVariables {
  marketContract: string;
}

export type MarketState = WasmQueryData<MarketStateWasmQuery>;

// language=graphql
export const MARKET_STATE_QUERY = `
  query (
    $marketContract: String!
  ) {
    marketBalances: BankBalancesAddress(Address: $marketContract) {
      Result {
        Denom
        Amount
      }
    }
  }
`;

export async function marketStateQuery(
  marketContract: HumanAddr,
  queryClient: QueryClient,
): Promise<MarketState> {
  const marketState = await wasmFetch<MarketStateWasmQuery>({
    ...queryClient,
    id: `market--state`,
    wasmQuery: {
      marketState: {
        contractAddress: marketContract,
        query: {
          state: {},
        },
      },
    },
  });

  return {
    ...marketState,
  };
}
