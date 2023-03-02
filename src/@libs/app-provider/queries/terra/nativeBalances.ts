import {
  EMPTY_NATIVE_BALANCES,
  NativeBalances,
  oneTerraNativeBalanceQuery,
  pickNativeBalance,
  terraNativeBalancesQuery,
} from "@libs/app-fns";
import { createQueryFn } from "@libs/react-query-utils";
import { HumanAddr, NativeDenom, Token, u, UST } from "@libs/types";
import { useMemo } from "react";
import { useAccount } from "contexts/account";
import { useQuery, UseQueryResult } from "react-query";
import { useApp } from "../../contexts/app";
import { TERRA_QUERY_KEY } from "../../env";

export function useTerraNativeBalancesQuery(
  walletAddr?: HumanAddr
): UseQueryResult<NativeBalances | undefined> {
  const { queryClient, queryErrorReporter } = useApp();

  const { connected, terraWalletAddress } = useAccount();

  const result = useQuery(
    [TERRA_QUERY_KEY.TERRA_NATIVE_BALANCES, walletAddr ?? terraWalletAddress],
    createQueryFn(terraNativeBalancesQuery, queryClient!),
    {
      refetchInterval: connected && 1000 * 60 * 5,
      keepPreviousData: true,
      onError: queryErrorReporter,
      enabled: !!queryClient,
      placeholderData: () => EMPTY_NATIVE_BALANCES,
    }
  );

  return result;
}

export function useTerraNativeBalances(walletAddr?: HumanAddr): NativeBalances {
  const { data: nativeBalances = EMPTY_NATIVE_BALANCES } =
    useTerraNativeBalancesQuery(walletAddr);

  return nativeBalances;
}


export function useNativeBalanceQuery(denom: string | undefined){
  const { queryClient, queryErrorReporter } = useApp();

  const { connected, terraWalletAddress } = useAccount();

  const result = useQuery(
    [TERRA_QUERY_KEY.TERRA_NATIVE_BALANCES, terraWalletAddress, denom],
    createQueryFn( oneTerraNativeBalanceQuery, queryClient!),
    {
      refetchInterval: connected && 1000 * 60 * 5,
      keepPreviousData: true,
      onError: queryErrorReporter,
      enabled: !!queryClient,
      placeholderData: () => ({
        denom: denom ?? "",
        amount: "0"
      })
    }
  );

  return result;
}


export function useTerraNativeBalanceQuery<T extends Token>(
  denom: NativeDenom,
  walletAddr?: HumanAddr
): u<T> {
  const { data: nativeBalances = EMPTY_NATIVE_BALANCES } =
    useTerraNativeBalancesQuery(walletAddr);

  return useMemo<u<T>>(() => {
    return pickNativeBalance(denom, nativeBalances);
  }, [denom, nativeBalances]);
}

export function useUstBalance(walletAddr?: HumanAddr | undefined): u<UST> {
  return useTerraNativeBalanceQuery<UST>("uusd", walletAddr);
}
