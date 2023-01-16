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
  oraclePrice: WasmQuery<
    moneyMarket.oracle.Price,
    moneyMarket.oracle.PriceResponse
  >;
}

export type MarketBAsset = WasmQueryData<MarketBAssetWasmQuery>;

export async function marketBAssetQuery(
  queryClient: QueryClient,
  bLunaContract: CW20Addr,
  oracleContract: HumanAddr,
  custodyContract: HumanAddr,
  nativeDenom: NativeDenom,
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
      oraclePrice: {
        contractAddress: oracleContract,
        query: {
          price: {
            base: bLunaContract,
            quote: nativeDenom,
          },
        },
      },
    },
  });
}
