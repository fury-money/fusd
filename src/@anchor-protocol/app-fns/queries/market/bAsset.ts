import {
  bLuna,
  cw20,
  CW20Addr,
  HumanAddr,
  moneyMarket,
  NativeDenom,
} from '@anchor-protocol/types';
import {
  QueryClient,
  wasmFetch,
  WasmQuery,
  WasmQueryData,
} from '@libs/query-client';

interface MarketBAssetWasmQuery {
  bLunaBalance: WasmQuery<cw20.Balance, cw20.BalanceResponse<bLuna>>;
  oraclePrices: WasmQuery<
    moneyMarket.oracle.Prices,
    moneyMarket.oracle.PricesResponse
  >;
}

export type MarketBAsset = WasmQueryData<MarketBAssetWasmQuery>;

export async function marketBAssetQuery(
  bLunaContract: CW20Addr,
  oracleContract: HumanAddr,
  custodyContract: HumanAddr,
  nativeDenom: NativeDenom,
  queryClient: QueryClient,
): Promise<MarketBAsset> {
  return wasmFetch<MarketBAssetWasmQuery>({
    ...queryClient,
    id: `market--basset`,
    wasmQuery: {
      bLunaBalance: {
        contractAddress: bLunaContract,
        query: {
          balance: {
            address: custodyContract,
          },
        },
      },
      oraclePrices: {
        contractAddress: oracleContract,
        query: {
          prices: {},
        },
      },
    },
  });
}
