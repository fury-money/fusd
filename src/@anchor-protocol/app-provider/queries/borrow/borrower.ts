import { BorrowBorrower, borrowBorrowerQuery } from "@anchor-protocol/app-fns";
import { EMPTY_QUERY_RESULT } from "@libs/app-provider";
import { createQueryFn } from "@libs/react-query-utils";
import { useQuery, UseQueryResult } from "react-query";
import { useAccount } from "contexts/account";
import { useAnchorWebapp } from "../../contexts/context";
import { ANCHOR_QUERY_KEY } from "../../env";
import { useLastSyncedHeightQuery } from "../terra/lastSyncedHeight";
import pMap from "p-map";
import { HumanAddr } from "@libs/types";

export function useBorrowBorrowerQuery(): UseQueryResult<
  BorrowBorrower | undefined
> {
  const { connected, terraWalletAddress } = useAccount();

  const { queryClient, queryErrorReporter } = useAnchorWebapp();

  const { data: lastSyncedHeight } = useLastSyncedHeightQuery();
  const {
    contractAddress: { moneyMarket },
  } = useAnchorWebapp();

  const result = useQuery(
    [
      ANCHOR_QUERY_KEY.BORROW_BORROWER,
      terraWalletAddress,
      lastSyncedHeight!,
      moneyMarket.market,
      moneyMarket.overseer,
    ],
    createQueryFn(borrowBorrowerQuery, queryClient!),
    {
      refetchInterval: connected && 1000 * 60 * 5,
      keepPreviousData: true,
      onError: queryErrorReporter,
      enabled: connected && !!queryClient && !!lastSyncedHeight,
    }
  );

  return connected ? result : EMPTY_QUERY_RESULT;
}

export function useMultipleBorrowerQuery(
  addresses: string[] | undefined
): UseQueryResult<(BorrowBorrower | undefined)[]> {
  const { queryClient, queryErrorReporter } = useAnchorWebapp();

  const { data: lastSyncedHeight } = useLastSyncedHeightQuery();

  const {
    contractAddress: { moneyMarket },
  } = useAnchorWebapp();

  const result = useQuery(
    [
      ANCHOR_QUERY_KEY.MULTIPLE_BORROW_BORROWER,
      addresses,
      lastSyncedHeight!,
      moneyMarket.market,
      moneyMarket.overseer,
    ],
    async (): Promise<(BorrowBorrower | undefined)[]> =>
      pMap(
        addresses ?? [],
        async (address: string): Promise<BorrowBorrower | undefined> => {
          return borrowBorrowerQuery(
            queryClient!,
            address as HumanAddr,
            lastSyncedHeight!,
            moneyMarket.market,
            moneyMarket.overseer
          );
        }
      ),
    {
      refetchInterval: 1000 * 60 * 5,
      keepPreviousData: true,
      onError: queryErrorReporter,
      enabled: !!queryClient && !!lastSyncedHeight && !!addresses,
    }
  );

  return result;
}
