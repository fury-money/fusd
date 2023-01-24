import { createQueryFn } from '@libs/react-query-utils';
import { useQuery, UseQueryResult } from 'react-query';
import { useAnchorWebapp } from '../../contexts/context';
import { ANCHOR_QUERY_KEY } from '../../env';


import { HumanAddr } from '@libs/types';
import { QueryClient, wasmFetch, WasmQuery, WasmQueryData } from '@libs/query-client';
import { lsdWrapper } from '@anchor-protocol/types/contracts/lsdWrapper';
import { LSDContracts } from '@anchor-protocol/app-provider';

// Here we need : 
// The collateral exchange rate (how much we mint when wrapping a certain amount of underlying tokens)
//   This query is located in the hub contract of the underlying token



interface UnderlyingHubStateWasmQuery {
  hubState: WasmQuery<
    lsdWrapper.underlyingHub.State,
    lsdWrapper.underlyingHub.StateResponse
  >;
}

export type UnderlyingHubState =
  WasmQueryData<UnderlyingHubStateWasmQuery>;

export async function underlyingHubStateQuery(
  hubAddr: HumanAddr,
  queryClient: QueryClient,
): Promise<UnderlyingHubState> {
 
  return wasmFetch< UnderlyingHubStateWasmQuery>({
    ...queryClient,
    id: `basset--claimable-rewards`,
    wasmQuery: {
      hubState: {
        contractAddress: hubAddr,
        query: {
          state: {},
        },
      },
    },
  });
}


const queryFn = createQueryFn(underlyingHubStateQuery);


export function useExlicitWrappedTokenDetails(
  hubAddress: HumanAddr | undefined
): UseQueryResult<UnderlyingHubState> {
  const { queryClient, queryErrorReporter } =
    useAnchorWebapp();

  return useQuery(
    [
      ANCHOR_QUERY_KEY.WRAPPED_TOKEN_HUB,
      hubAddress!,
      queryClient,
    ],
    queryFn,
    {
      refetchInterval: 1000 * 60 * 5,
      keepPreviousData: false,
      onError: queryErrorReporter,
      enabled: !!hubAddress
    },
  );
}

export function useWrappedTokenDetails(
  collateral: LSDContracts
): UseQueryResult<UnderlyingHubState> {
  const { queryClient, queryErrorReporter } =
    useAnchorWebapp();

  return useQuery(
    [
      ANCHOR_QUERY_KEY.WRAPPED_TOKEN_HUB,
      collateral.info.hubAddress as HumanAddr,
      queryClient,
    ],
    queryFn,
    {
      refetchInterval: 1000 * 60 * 5,
      keepPreviousData: false,
      onError: queryErrorReporter,
    },
  );
}
