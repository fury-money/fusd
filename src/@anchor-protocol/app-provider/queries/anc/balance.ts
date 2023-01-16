import { HumanAddr } from '@anchor-protocol/types';
import { AncBalance, ancBalanceQuery } from '@anchor-protocol/app-fns';
import { EMPTY_QUERY_RESULT } from '@libs/app-provider';
import { createQueryFn } from '@libs/react-query-utils';
import { useQuery, UseQueryResult } from 'react-query';
import { useAnchorWebapp } from '../../contexts/context';
import { ANCHOR_QUERY_KEY } from '../../env';


export function useAncBalanceQuery(
  walletAddress: HumanAddr | undefined | null,
): UseQueryResult<AncBalance | undefined> {
  const { queryClient, contractAddress, queryErrorReporter } =
    useAnchorWebapp();

  const result = useQuery(
    [
      ANCHOR_QUERY_KEY.ANC_BALANCE,
      walletAddress ?? undefined,
      contractAddress.cw20.ANC,
    ],
    createQueryFn(ancBalanceQuery, queryClient),
    {
      refetchInterval: !!walletAddress && 1000 * 60 * 2,
      keepPreviousData: true,
      onError: queryErrorReporter,
      enabled: !! walletAddress && !!queryClient,
    },
  );

  return walletAddress ? result : EMPTY_QUERY_RESULT;
}
