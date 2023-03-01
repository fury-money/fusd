import {
  ANCHOR_QUERY_KEY,
  useAnchorWebapp,
} from "@anchor-protocol/app-provider";
import { useQuery, UseQueryResult } from "react-query";

export function useSimpleQuery<T>(queryUrl: string): UseQueryResult<T> {
  const { queryErrorReporter } = useAnchorWebapp();

  return useQuery(
    [ANCHOR_QUERY_KEY.TFM_AVAILABLE_TOKENS, queryUrl],
    () => fetch(queryUrl).then((res) => res.json()),
    {
      refetchInterval: 1000 * 60 * 2,
      keepPreviousData: true,
      onError: queryErrorReporter,
    }
  );
}

const TFM_API = "https://api-terra2.tfm.com/";

export interface TFMToken {
  contract_addr: string;
  decimals: number;
  id: number;
  is_token_liquid: boolean;
  name: string;
  symbol: string;
}

export function useTFMTokensQuery() {
  return useSimpleQuery<TFMToken[]>(`${TFM_API}/tokens`);
}
