import { QueryClient, wasmFetch, WasmQuery } from "@libs/query-client";
import { lsdWrapper } from "@anchor-protocol/types/contracts/lsdWrapper";
import { LSDContracts } from "@anchor-protocol/app-provider";
import { HumanAddr } from "@libs/types";

export interface UnderlyingHubStateWasmQuery {
  hubState: WasmQuery<
    lsdWrapper.underlyingHub.State,
    lsdWrapper.underlyingHub.StateResponse
  >;
}
export async function getSteakExchangeRate(
  queryClient: QueryClient,
  lsd: LSDContracts,
  oracle: HumanAddr
) {
  if (!lsd.info.cw20) {
    throw "Expected a cw20 like collateral token here";
  }
  return wasmFetch<UnderlyingHubStateWasmQuery>({
    ...queryClient,
    id: `basset--claimable-rewards`,
    wasmQuery: {
      hubState: {
        contractAddress: lsd.info.cw20?.hubAddress,
        query: {
          state: {},
        },
      },
    },
  });
}
