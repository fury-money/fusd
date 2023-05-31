import { createQueryFn } from "@libs/react-query-utils";
import { useQuery, UseQueryResult } from "react-query";
import { useAnchorWebapp } from "../../contexts/context";
import { ANCHOR_QUERY_KEY } from "../../env";

import { cw20, CW20Addr, HumanAddr, NativeDenom, Rate, Token, u, UST } from "@libs/types";
import {
  QueryClient,
  wasmFetch,
  WasmQuery,
  WasmQueryData,
} from "@libs/query-client";
import { LSDContracts } from "@anchor-protocol/app-provider";
import { moneyMarket } from "@anchor-protocol/types";
import { getSteakExchangeRate, UnderlyingHubStateWasmQuery } from "./collateralExchangeRate/steak";
import { getCoinExchangeRate } from "./collateralExchangeRate/coin";
import { getSpectrumExchangeRate } from "./collateralExchangeRate/spectrum_lp";
import { getAmpLPExchangeRate } from "./collateralExchangeRate/amp_lp";


export type UnderlyingHubState = WasmQueryData<UnderlyingHubStateWasmQuery>;

export async function underlyingHubStateQuery(
  queryClient: QueryClient,
  lsd: LSDContracts,
  oracle: HumanAddr,
): Promise<UnderlyingHubState> {
  console.log(lsd.info)
  // If the token is of cw20 type, we query the hubstate
  if(lsd.info.cw20?.hubAddress){
    return getSteakExchangeRate(queryClient, lsd, oracle);
  }else if (lsd.info.coin){ // Else if the token is of CW20 type, we query the exchange rate from the oracle (that's denom vs underyling denom)
    return getCoinExchangeRate(queryClient, lsd, oracle);
  }else if(lsd.info.spectrum_lp){
    return getSpectrumExchangeRate(queryClient, lsd, oracle);
  }else if(lsd.info.amp_lp){
    return getAmpLPExchangeRate(queryClient, lsd, oracle);
  }else{
    return {
      hubState: {
        exchange_rate: "1" as  Rate<string>
      }
    }
  }  
}

export function useWrappedTokenDetails(
  collateral: LSDContracts | undefined
): UseQueryResult<UnderlyingHubState> {
  const { queryClient, queryErrorReporter } = useAnchorWebapp();

  const {contractAddress} = useAnchorWebapp();

  return useQuery(
    [
      ANCHOR_QUERY_KEY.WRAPPED_TOKEN_HUB,
      collateral!,
      contractAddress.moneyMarket.oracle,
    ],
    createQueryFn(underlyingHubStateQuery, queryClient!),
    {
      refetchInterval: 1000 * 60 * 5,
      keepPreviousData: false,
      onError: queryErrorReporter,
      enabled: !!queryClient && !!collateral,
    }
  );
}