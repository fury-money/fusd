import {
  LiquidationData,
  liquidationHistoryQuery,
} from '@anchor-protocol/app-fns/queries/liquidate/history';
import { createQueryFn } from '@libs/react-query-utils';
import { useQuery, UseQueryResult } from 'react-query';
import { useAnchorWebapp } from '../../contexts/context';
import { ANCHOR_QUERY_KEY } from '../../env';

const queryFn = createQueryFn((endpoint: string) => {
  return liquidationHistoryQuery({ endpoint });
});

export function useLiquidationHistoryQuery(): UseQueryResult<
  LiquidationData[] | undefined
> {
  const { queryErrorReporter, indexerApiEndpoint } = useAnchorWebapp();

  return useQuery(
    [ANCHOR_QUERY_KEY.LIQUIDATION_HISTORY, indexerApiEndpoint],
    queryFn,
    {
      refetchInterval: 1000 * 60 * 60,
      keepPreviousData: true,
      onError: queryErrorReporter,
    },
  );
}
