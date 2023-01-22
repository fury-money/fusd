import { borrowMarketQuery } from '@anchor-protocol/app-fns';
import { createQueryFn } from '@libs/react-query-utils';
import { useQuery, UseQueryResult } from 'react-query';
import { useAnchorWebapp } from '../../contexts/context';
import { ANCHOR_QUERY_KEY } from '../../env';


import { useQueryWithTokenDisplay } from '../utils/tokenDisplay';
import { HumanAddr } from '@libs/types';
import { QueryClient, wasmFetch, WasmQuery, WasmQueryData } from '@libs/query-client';
import { lsdWrapper } from '@anchor-protocol/types/contracts/lsdWrapper';
import { WhitelistCollateral, WhitelistWrappedCollateral } from 'queries';

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

export function useWrappedTokenDetails(
  collateral: WhitelistWrappedCollateral
): UseQueryResult<UnderlyingHubState> {
  const { contractAddress, queryClient, queryErrorReporter } =
    useAnchorWebapp();

  return useQuery(
    [
      ANCHOR_QUERY_KEY.BORROW_MARKET,
      collateral.info.info.hubAddress as HumanAddr,
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
