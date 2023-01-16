import { BorrowAPYData, borrowAPYQuery } from '@anchor-protocol/app-fns';
import { createQueryFn } from '@libs/react-query-utils';
import { useQuery, UseQueryResult } from 'react-query';
import { useAnchorWebapp } from '../../contexts/context';
import { ANCHOR_QUERY_KEY } from '../../env';
import { useEarnEpochStatesQuery } from '../earn/epochStates';
import { useMarketStateQuery } from '../market/state';

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
  console.log("For borrow", queryClient);

  return useQuery(
    [ANCHOR_QUERY_KEY.BORROW_APY, blocksPerYear, lastSyncedHeight,  moneyMarket?.market, ],
    createQueryFn(borrowAPYQuery, queryClient),
    {
      refetchInterval: 1000 * 60 * 5,
      keepPreviousData: true,
      onError: queryErrorReporter,
      enabled: !!moneyMarket?.market && !!queryClient,
    },
  );
}
