import { BorrowAPYData, borrowAPYQuery } from '@anchor-protocol/app-fns';
import { createQueryFn } from '@libs/react-query-utils';
import { useQuery, UseQueryResult } from 'react-query';
import { useAnchorWebapp } from '../../contexts/context';
import { ANCHOR_QUERY_KEY } from '../../env';
import { useMarketStateQuery } from '../market/state';

const queryFn = createQueryFn(borrowAPYQuery);

export function useBorrowAPYQuery(): UseQueryResult<BorrowAPYData | undefined> {
  const {
    queryErrorReporter,
    constants: { blocksPerYear },
    lastSyncedHeight,
  } = useAnchorWebapp();

  const { data: marketState } = useMarketStateQuery();

  return useQuery(
    [ANCHOR_QUERY_KEY.BORROW_APY, marketState, blocksPerYear, lastSyncedHeight],
    queryFn,
    {
      refetchInterval: 1000 * 60 * 5,
      keepPreviousData: true,
      onError: queryErrorReporter,
      enabled: !!marketState,
    },
  );
}
