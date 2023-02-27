import {
  MonitorPositionsData,
  monitorPositionsQuery,
} from "@anchor-protocol/app-fns/queries/liquidate/monitorPositions";
import { createSimpleQueryFn } from "@libs/react-query-utils";
import { useQuery, UseQueryResult } from "react-query";
import { useAnchorWebapp } from "../../contexts/context";
import { ANCHOR_QUERY_KEY } from "../../env";

const queryFn = createSimpleQueryFn((endpoint: string) => {
  return monitorPositionsQuery({ endpoint });
});

export function useAllPositionsQuery(): UseQueryResult<
  MonitorPositionsData[] | undefined
> {
  const { indexerApiEndpoint, queryErrorReporter } = useAnchorWebapp();

  const result = useQuery(
    [ANCHOR_QUERY_KEY.MONITOR_POSITIONS, indexerApiEndpoint],
    queryFn,
    {
      refetchInterval: 1000 * 60 * 5,
      keepPreviousData: true,
      onError: queryErrorReporter,
    }
  );

  return result;
}
