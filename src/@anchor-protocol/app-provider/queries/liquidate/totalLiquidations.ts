import { LockedCollateral, totalCollateralsQuery } from '@anchor-protocol/app-fns/queries/liquidate/totalLiquidations';
import { createQueryFn } from '@libs/react-query-utils';
import { useQuery, UseQueryResult } from 'react-query';
import { useAnchorWebapp } from '../../contexts/context';
import { ANCHOR_QUERY_KEY } from '../../env';

const queryFn = createQueryFn((endpoint: string) => {
  return totalCollateralsQuery({ endpoint });
});

export function useTotalCollateralsQuery(): UseQueryResult<
  LockedCollateral[] | undefined
> {
  const { queryErrorReporter, indexerApiEndpoint } = useAnchorWebapp();

  return useQuery(
    [ANCHOR_QUERY_KEY.TOTAL_LOCKED_COLLATERALS, indexerApiEndpoint],
    queryFn,
    {
      refetchInterval: 1000 * 60 * 60,
      keepPreviousData: true,
      onError: queryErrorReporter,
    },
  );
}
