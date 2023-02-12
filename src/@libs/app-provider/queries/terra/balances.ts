import { TerraBalances, terraBalancesQuery } from "@libs/app-fns";
import { createQueryFn } from "@libs/react-query-utils";
import { HumanAddr, terraswap } from "@libs/types";
import { useQuery, UseQueryResult } from "react-query";
import { useAccount } from "contexts/account";
import { useApp } from "../../contexts/app";
import { TERRA_QUERY_KEY } from "../../env";

export function useTerraBalancesQuery(
  assets: terraswap.AssetInfo[],
  walletAddress?: HumanAddr
): UseQueryResult<TerraBalances | undefined> {
  const { queryClient, queryErrorReporter } = useApp();

  const { connected, terraWalletAddress } = useAccount();

  const result = useQuery(
    [
      TERRA_QUERY_KEY.TERRA_BALANCES,
      walletAddress ?? terraWalletAddress,
      assets,
    ],
    createQueryFn(terraBalancesQuery, queryClient!),
    {
      refetchInterval: connected && 1000 * 60 * 5,
      keepPreviousData: true,
      onError: queryErrorReporter,
      enabled: !!queryClient,
    }
  );

  return result;
}
