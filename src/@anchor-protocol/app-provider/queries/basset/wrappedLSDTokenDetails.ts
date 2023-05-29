import { createQueryFn } from "@libs/react-query-utils";
import { useQuery, UseQueryResult } from "react-query";
import { useAnchorWebapp } from "../../contexts/context";
import { ANCHOR_QUERY_KEY } from "../../env";

import { CW20Addr, HumanAddr, NativeDenom, Rate, u, UST } from "@libs/types";
import {
  QueryClient,
  wasmFetch,
  WasmQuery,
  WasmQueryData,
} from "@libs/query-client";
import { lsdWrapper } from "@anchor-protocol/types/contracts/lsdWrapper";
import { LSDContracts } from "@anchor-protocol/app-provider";
import { moneyMarket } from "@anchor-protocol/types";

// Here we need :
// The collateral exchange rate (how much we mint when wrapping a certain amount of underlying tokens)
//   This query is located in the hub contract of the underlying token

interface UnderlyingHubStateWasmQuery {
  hubState: WasmQuery<
    lsdWrapper.underlyingHub.State,
    lsdWrapper.underlyingHub.StateResponse
  >;
}

interface OraclePriceQuery {
  oraclePrice: WasmQuery<
    moneyMarket.oracle.Price,
    moneyMarket.oracle.PriceResponse
  >;
}


export type UnderlyingHubState = WasmQueryData<UnderlyingHubStateWasmQuery>;

export async function underlyingHubStateQuery(
  queryClient: QueryClient,
  lsd: LSDContracts,
  oracle: HumanAddr,
): Promise<UnderlyingHubState> {

  // If the token is of cw20 type, we query the hubstate
  if(lsd.info.cw20?.hubAddress){
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
  }else if (lsd.info.coin){ // Else if the token is of CW20 type, we query the exchange rate from the oracle (that's denom vs underyling denom)
    const oracleExchangeRate = await wasmFetch<OraclePriceQuery>({
      ...queryClient,
      id: `basset--claimable-rewards`,
      wasmQuery: {
        oraclePrice: {
          contractAddress: oracle,
          query: {
            price: {
              base: lsd.info.coin?.denom as CW20Addr,
              quote: lsd.info.underlyingToken as NativeDenom,
            },
          },
        },
      },
    });
    console.log("Oracle price", oracleExchangeRate)

    return {
      hubState: {
        exchange_rate: oracleExchangeRate.oraclePrice.rate as string as  Rate<string>
      }
    }
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
