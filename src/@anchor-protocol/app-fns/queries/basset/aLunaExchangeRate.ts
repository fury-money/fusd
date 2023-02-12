import { aluna, HumanAddr } from '@anchor-protocol/types';
import {
  QueryClient,
  wasmFetch,
  WasmQuery,
  WasmQueryData,
} from '@libs/query-client';

interface BondBLunaExchangeRateWasmQuery {
  state: WasmQuery<aluna.hub.State, aluna.hub.StateResponse>;
  parameters: WasmQuery<aluna.hub.Parameters, aluna.hub.ParametersResponse>;
}

export type BondBLunaExchangeRate =
  WasmQueryData<BondBLunaExchangeRateWasmQuery>;

export async function bondBLunaExchangeRateQuery(
  queryClient: QueryClient,
  aLunaHubContract: HumanAddr,
): Promise<BondBLunaExchangeRate> {
  return wasmFetch<BondBLunaExchangeRateWasmQuery>({
    ...queryClient,
    id: `bond--aluna-exchange-rate`,
    wasmQuery: {
      state: {
        contractAddress: aLunaHubContract,
        query: {
          state: {},
        },
      },
      parameters: {
        contractAddress: aLunaHubContract,
        query: {
          parameters: {},
        },
      },
    },
  });
}
