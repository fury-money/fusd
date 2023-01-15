import { BorrowAPYData, borrowAPYQuery } from '@anchor-protocol/app-fns';
import { createQueryFn } from '@libs/react-query-utils';
import { useQuery, UseQueryResult } from 'react-query';
import { useAnchorWebapp } from '../../contexts/context';
import { ANCHOR_QUERY_KEY } from '../../env';
import { useEarnEpochStatesQuery } from '../earn/epochStates';
import { useMarketStateQuery } from '../market/state';

const queryFn = createQueryFn(borrowAPYQuery);

export function useBorrowAPYQuery(): UseQueryResult<BorrowAPYData | undefined> {
  const {
    queryErrorReporter,
    constants: { blocksPerYear },
    lastSyncedHeight,
  } = useAnchorWebapp();

  const { data: marketState } = useMarketStateQuery();

  const { data: { overseerConfig, overseerEpochState, moneyMarketEpochState } = {} } =
    useEarnEpochStatesQuery();

     

  return useQuery(
    [ANCHOR_QUERY_KEY.BORROW_APY, marketState, moneyMarketEpochState, blocksPerYear, lastSyncedHeight,  overseerConfig?.epoch_period ?? 1, overseerEpochState?.last_executed_height ?? 0],
    queryFn,
    {
      refetchInterval: 1000 * 60 * 5,
      keepPreviousData: true,
      onError: queryErrorReporter,
      enabled: !!marketState,
    },
  );
}
