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
    queryClient, 
    queryErrorReporter,
    constants: { blocksPerYear },
    lastSyncedHeight,
    contractAddress: {
      moneyMarket
    }
  } = useAnchorWebapp();

     

  return useQuery(
    [ANCHOR_QUERY_KEY.BORROW_APY, blocksPerYear, lastSyncedHeight,  moneyMarket?.market, queryClient],
    queryFn,
    {
      refetchInterval: 1000 * 60 * 5,
      keepPreviousData: true,
      onError: queryErrorReporter,
      enabled: !!moneyMarket?.market && !!queryClient,
    },
  );
}
