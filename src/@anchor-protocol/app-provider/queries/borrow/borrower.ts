import { BorrowBorrower, borrowBorrowerQuery } from '@anchor-protocol/app-fns';
import { EMPTY_QUERY_RESULT } from '@libs/app-provider';
import { createQueryFn } from '@libs/react-query-utils';
import { useQuery, UseQueryResult } from 'react-query';
import { useAccount } from 'contexts/account';
import { useAnchorWebapp } from '../../contexts/context';
import { ANCHOR_QUERY_KEY } from '../../env';

export function useBorrowBorrowerQuery(): UseQueryResult<
  BorrowBorrower | undefined
> {
  const { connected, terraWalletAddress } = useAccount();

  const { queryClient, lastSyncedHeight, queryErrorReporter } =
    useAnchorWebapp();

  const {
    contractAddress: { moneyMarket },
  } = useAnchorWebapp();

  const result = useQuery(
    [
      ANCHOR_QUERY_KEY.BORROW_BORROWER,
      terraWalletAddress,
      lastSyncedHeight,
      moneyMarket.market,
      moneyMarket.overseer,
    ],
    createQueryFn(borrowBorrowerQuery, queryClient),
    {
      refetchInterval: connected && 1000 * 60 * 5,
      keepPreviousData: true,
      onError: queryErrorReporter,
      enabled: connected && !!queryClient,
    },
  );

  return connected ? result : EMPTY_QUERY_RESULT;
}
