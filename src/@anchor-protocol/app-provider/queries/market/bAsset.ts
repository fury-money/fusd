import { MarketBAsset, marketBAssetQuery } from '@anchor-protocol/app-fns';
import { createQueryFn } from '@libs/react-query-utils';
import { useQuery, UseQueryResult } from 'react-query';
import { useAnchorWebapp } from '../../contexts/context';
import { ANCHOR_QUERY_KEY } from '../../env';


export function useMarketBAssetQuery(): UseQueryResult<
  MarketBAsset | undefined
> {
  const { queryClient, contractAddress, queryErrorReporter } =
    useAnchorWebapp();

  const result = useQuery(
    [
      ANCHOR_QUERY_KEY.MARKET_BASSET,
      contractAddress.cw20.aLuna,
      contractAddress.moneyMarket.oracle,
      contractAddress.aluna.custody,
      contractAddress.native.usd,
    ],
    createQueryFn(marketBAssetQuery, queryClient),
    {
      refetchInterval: 1000 * 60 * 5,
      keepPreviousData: true,
      onError: queryErrorReporter,
      enabled: !!queryClient,
    },
  );
  return result;
}
