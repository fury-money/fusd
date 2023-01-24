import {
  RewardsClaimableUstBorrowRewards,
  rewardsClaimableUstBorrowRewardsQuery,
} from '@anchor-protocol/app-fns';
import { EMPTY_QUERY_RESULT } from '@libs/app-provider';
import { createQueryFn } from '@libs/react-query-utils';
import { useQuery, UseQueryResult } from 'react-query';
import { useAccount } from 'contexts/account';
import { useAnchorWebapp } from '../../contexts/context';
import { ANCHOR_QUERY_KEY } from '../../env';

export function useRewardsClaimableUstBorrowRewardsQuery(): UseQueryResult<
  RewardsClaimableUstBorrowRewards | undefined
> {
  const { queryClient, contractAddress, lastSyncedHeight, queryErrorReporter } =
    useAnchorWebapp();

  const { connected, terraWalletAddress } = useAccount();

  const result = useQuery(
    [
      ANCHOR_QUERY_KEY.REWARDS_CLAIMABLE_UST_BORROW_REWARDS,
      terraWalletAddress,
      contractAddress.cw20.ANC,
      contractAddress.moneyMarket.market,
      lastSyncedHeight,
    ],
    createQueryFn(rewardsClaimableUstBorrowRewardsQuery, queryClient),
    {
      refetchInterval: 1000 * 60 * 5,
      keepPreviousData: true,
      onError: queryErrorReporter,
      enabled: connected && !!queryClient,
    },
  );

  return connected ? result : EMPTY_QUERY_RESULT;
}
