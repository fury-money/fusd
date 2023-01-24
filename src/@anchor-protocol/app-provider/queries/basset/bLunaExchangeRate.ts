import {
  BondBLunaExchangeRate,
  bondBLunaExchangeRateQuery,
} from '@anchor-protocol/app-fns';
import { createQueryFn } from '@libs/react-query-utils';
import { useQuery, UseQueryResult } from 'react-query';
import { useAnchorWebapp } from '../../contexts/context';
import { ANCHOR_QUERY_KEY } from '../../env';

export function useBLunaExchangeRateQuery(): UseQueryResult<
  BondBLunaExchangeRate | undefined
> {
  const { queryClient, queryErrorReporter } = useAnchorWebapp();

  const { contractAddress } = useAnchorWebapp();

  return useQuery(
    [
      ANCHOR_QUERY_KEY.BOND_BLUNA_EXCHANGE_RATE,
      contractAddress.bluna.hub,
    ],
    createQueryFn(bondBLunaExchangeRateQuery, queryClient),
    {
      refetchInterval: 1000 * 60 * 5,
      keepPreviousData: true,
      onError: queryErrorReporter,
      enabled: !!queryClient,
    },
  );
}
