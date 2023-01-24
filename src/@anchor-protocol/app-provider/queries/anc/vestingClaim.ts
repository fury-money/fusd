import { createQueryFn } from '@libs/react-query-utils';
import { useQuery, UseQueryResult } from 'react-query';
import { EMPTY_QUERY_RESULT } from '@libs/app-provider';
import { useAnchorWebapp } from '../../contexts/context';
import { ANCHOR_QUERY_KEY } from '../../env';
import {
  AncVestingAccount,
  ancVestingAccountQuery,
} from '@anchor-protocol/app-fns/queries/anc/vesting';
import { useConnectedWallet } from '@terra-money/wallet-provider';

export function useAncVestingAccountQuery(): UseQueryResult<
  AncVestingAccount | undefined
> {
  const { queryClient, contractAddress, queryErrorReporter } =
    useAnchorWebapp();

  const connectedWallet = useConnectedWallet();

  const result = useQuery(
    [
      ANCHOR_QUERY_KEY.ANC_VESTING_ACCOUNT,
      connectedWallet?.walletAddress ?? undefined,
      contractAddress.anchorToken.vesting,
    ],
    createQueryFn(ancVestingAccountQuery, queryClient),
    {
      refetchInterval: 1000 * 60 * 2,
      keepPreviousData: true,
      onError: queryErrorReporter,
      enabled: !!queryClient,
    },
  );

  return connectedWallet?.walletAddress ? result : EMPTY_QUERY_RESULT;
}
