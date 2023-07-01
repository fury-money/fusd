import {
  LiquidationData,
  liquidationHistoryQuery,
} from "@anchor-protocol/app-fns/queries/liquidate/history";
import { createSimpleQueryFn } from "@libs/react-query-utils";
import { WhitelistCollateral } from "queries";
import { useQuery, UseQueryResult } from "react-query";
import { useAnchorWebapp } from "../../contexts/context";
import { ANCHOR_QUERY_KEY } from "../../env";

const queryFn = createSimpleQueryFn((endpoint: string, collateral: WhitelistCollateral | undefined) => {
  return liquidationHistoryQuery({ endpoint, collateral });
});

export function useLiquidationHistoryQuery( collateral: WhitelistCollateral | undefined): UseQueryResult<
  LiquidationData[] | undefined
> {
  const { queryErrorReporter, indexerApiEndpoint } = useAnchorWebapp();

  return useQuery(
    [ANCHOR_QUERY_KEY.LIQUIDATION_HISTORY, indexerApiEndpoint, collateral],
    queryFn,
    {
      refetchInterval: 1000 * 60 * 60,
      keepPreviousData: true,
      onError: queryErrorReporter,
      enabled: !!collateral
    }
  );
}
