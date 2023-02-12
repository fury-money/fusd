import {
  BLunaClaimableRewards,
  aLunaClaimableRewardsQuery,
} from "@anchor-protocol/app-fns";
import { EMPTY_QUERY_RESULT } from "@libs/app-provider";
import { createQueryFn } from "@libs/react-query-utils";
import { useQuery, UseQueryResult } from "react-query";
import { useAccount } from "contexts/account";
import { useAnchorWebapp } from "../../contexts/context";
import { ANCHOR_QUERY_KEY } from "../../env";

export function useBLunaClaimableRewards(): UseQueryResult<
  BLunaClaimableRewards | undefined
> {
  const { connected, terraWalletAddress } = useAccount();

  const { queryClient, queryErrorReporter, contractAddress } =
    useAnchorWebapp();

  const result = useQuery(
    [
      ANCHOR_QUERY_KEY.BOND_CLAIMABLE_REWARDS,
      terraWalletAddress,
      contractAddress.aluna.reward,
    ],
    createQueryFn(aLunaClaimableRewardsQuery, queryClient!),
    {
      refetchInterval: connected && 1000 * 60 * 5,
      keepPreviousData: true,
      onError: queryErrorReporter,
      enabled: connected && !!queryClient,
    }
  );

  return connected ? result : EMPTY_QUERY_RESULT;
}
