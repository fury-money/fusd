import {
  LiquidationQueueData,
  liquidationQueueHistoryQuery,
} from "@anchor-protocol/app-fns/queries/liquidate/liquidationQueueHistory";
import { createSimpleQueryFn } from "@libs/react-query-utils";
import { useQuery, UseQueryResult } from "react-query";
import { useAnchorWebapp } from "../../contexts/context";
import { ANCHOR_QUERY_KEY } from "../../env";

const queryFn = createSimpleQueryFn((endpoint: string) => {
  return liquidationQueueHistoryQuery({ endpoint });
});

export function useLiquidationQueueHistory(): UseQueryResult<
  LiquidationQueueData[] | undefined
> {
  const { indexerApiEndpoint, queryErrorReporter } = useAnchorWebapp();

  const result = useQuery(
    [ANCHOR_QUERY_KEY.LIQUIDATION_QUEUE_HISTORY, indexerApiEndpoint],
    queryFn,
    {
      refetchInterval: 1000 * 60 * 5,
      keepPreviousData: true,
      onError: queryErrorReporter,
    }
  );

  return result;
}
