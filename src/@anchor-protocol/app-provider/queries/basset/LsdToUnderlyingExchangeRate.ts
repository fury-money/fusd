import { createQueryFn } from "@libs/react-query-utils";
import { useQuery, UseQueryResult } from "react-query";
import { useAnchorWebapp } from "../../contexts/context";
import { ANCHOR_QUERY_KEY } from "../../env";

import { HumanAddr, Rate } from "@libs/types";
import { QueryClient, WasmQueryData } from "@libs/query-client";
import { LSDContracts } from "@anchor-protocol/app-provider";
import {
  getSteakExchangeRate,
  UnderlyingHubStateWasmQuery,
} from "./collateralExchangeRate/steak";
import { getCoinExchangeRate } from "./collateralExchangeRate/coin";
import { getSpectrumLSDExchangeRate } from "./collateralExchangeRate/spectrum_lp";
import { getAmpLPLSDExchangeRate } from "./collateralExchangeRate/amp_lp";

export type UnderlyingHubState = WasmQueryData<UnderlyingHubStateWasmQuery>;

/// Queries the exchange rate from the underlying Token to the LSD directly
export async function lSDToUnderlyingExchangeRateQuery(
  queryClient: QueryClient,
  lsd: LSDContracts,
  oracle: HumanAddr
): Promise<Rate> {
  // If the tokens of cw20 type, we query the hubstate
  if (lsd.info.cw20?.hubAddress) {
    const state = await getSteakExchangeRate(queryClient, lsd, oracle);
    return state.hubState.exchange_rate;
  } else if (lsd.info.coin) {
    const state = await getCoinExchangeRate(queryClient, lsd, oracle);
    return state.hubState.exchange_rate;
  } else if (lsd.info.spectrum_lp) {
    return getSpectrumLSDExchangeRate(queryClient, lsd, oracle);
  } else if (lsd.info.amp_lp) {
    return getAmpLPLSDExchangeRate(queryClient, lsd, oracle);
  } else {
    return "1" as Rate<string>;
  }
}

export function useLSDToUnderlyingExchangeRate(
  collateral: LSDContracts | undefined
): UseQueryResult<Rate> {
  const { queryClient, queryErrorReporter } = useAnchorWebapp();

  const { contractAddress } = useAnchorWebapp();

  return useQuery(
    [
      ANCHOR_QUERY_KEY.LSD_TO_UNDERLYING_EXCHANGE_RATE,
      collateral!,
      contractAddress.moneyMarket.oracle,
    ],
    createQueryFn(lSDToUnderlyingExchangeRateQuery, queryClient!),
    {
      refetchInterval: 1000 * 60 * 5,
      keepPreviousData: false,
      onError: queryErrorReporter,
      enabled: !!queryClient && !!collateral,
    }
  );
}
