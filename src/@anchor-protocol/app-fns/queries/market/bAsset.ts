import {
  aLuna,
  cw20,
  CW20Addr,
  HumanAddr,
  moneyMarket,
  NativeDenom,
} from "@anchor-protocol/types";
import {
  QueryClient,
  wasmFetch,
  WasmQuery,
  WasmQueryData,
} from "@libs/query-client";

interface MarketBAssetWasmQuery {
  aLunaBalance: WasmQuery<cw20.Balance, cw20.BalanceResponse<aLuna>>;
  oraclePrices: WasmQuery<
    moneyMarket.oracle.Prices,
    moneyMarket.oracle.PricesResponse
  >;
}

export type MarketBAsset = WasmQueryData<MarketBAssetWasmQuery>;

export async function marketBAssetQuery(
  queryClient: QueryClient,
  aLunaContract: CW20Addr,
  oracleContract: HumanAddr,
  custodyContract: HumanAddr,
  nativeDenom: NativeDenom
): Promise<MarketBAsset> {
  return wasmFetch<MarketBAssetWasmQuery>({
    ...queryClient,
    id: `market--basset`,
    wasmQuery: {
      aLunaBalance: {
        contractAddress: aLunaContract,
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
