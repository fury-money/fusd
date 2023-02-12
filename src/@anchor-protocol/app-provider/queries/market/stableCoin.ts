import {
  MarketStableCoin,
  marketStableCoinQuery,
} from "@anchor-protocol/app-fns";
import { useTerraNativeBalances } from "@libs/app-provider";
import { createQueryFn } from "@libs/react-query-utils";
import { useQuery, UseQueryResult } from "react-query";
import { useAnchorWebapp } from "../../contexts/context";
import { ANCHOR_QUERY_KEY } from "../../env";
import { useMarketStateQuery } from "./state";

export function useMarketStableCoinQuery(): UseQueryResult<
  MarketStableCoin | undefined
> {
  const { queryClient, contractAddress, queryErrorReporter } =
    useAnchorWebapp();

  const { data: { marketState } = {} } = useMarketStateQuery();

  const { uUST } = useTerraNativeBalances(contractAddress.moneyMarket.market);

  const result = useQuery(
    [
      ANCHOR_QUERY_KEY.MARKET_STABLE_COIN,
      contractAddress.moneyMarket.interestModel,
      contractAddress.moneyMarket.overseer,
      uUST,
      marketState?.total_reserves,
      marketState?.total_liabilities,
    ],
    createQueryFn(marketStableCoinQuery, queryClient!),
    {
      refetchInterval: 1000 * 60 * 5,
      keepPreviousData: true,
      onError: queryErrorReporter,
      enabled: !!queryClient,
    }
  );

  return result;
}
