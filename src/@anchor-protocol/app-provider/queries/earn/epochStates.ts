import {
  EarnEpochStates,
  earnEpochStatesQuery,
} from '@anchor-protocol/app-fns';
import { createQueryFn } from '@libs/react-query-utils';
import { useQuery, UseQueryResult } from 'react-query';
import { useAnchorWebapp } from '../../contexts/context';
import { ANCHOR_QUERY_KEY } from '../../env';
import { useLastSyncedHeightQuery } from '../terra/lastSyncedHeight';


export function useEarnEpochStatesQuery(): UseQueryResult<
  EarnEpochStates | undefined
> {
  const { queryClient, contractAddress, queryErrorReporter } =
    useAnchorWebapp();

  const {data: lastSyncedHeight} = useLastSyncedHeightQuery();
  const result = useQuery(
    [
      ANCHOR_QUERY_KEY.EARN_EPOCH_STATES,
      contractAddress.moneyMarket.market,
      contractAddress.moneyMarket.overseer,
      lastSyncedHeight!,
    ],
    createQueryFn(earnEpochStatesQuery, queryClient),
    {
      refetchInterval: 1000 * 60,
      keepPreviousData: true,
      onError: queryErrorReporter,
      enabled: !!queryClient && !!lastSyncedHeight,
    },
  );

  return result;
}
