import {
  BidPoolsByCollateral,
  bidPoolsByCollateralQuery,
} from "@anchor-protocol/app-fns";
import { createQueryFn } from "@libs/react-query-utils";
import { CW20Addr, HumanAddr } from "@libs/types";
import { useQuery, UseQueryResult } from "react-query";
import { useAnchorWebapp } from "../../contexts/context";
import { ANCHOR_QUERY_KEY } from "../../env";

export function useBidPoolsByCollateralQuery(
  collateralToken: CW20Addr | undefined,
  startAfter?: HumanAddr,
  limit?: number
): UseQueryResult<BidPoolsByCollateral | undefined> {
  const { queryClient, queryErrorReporter, contractAddress } =
    useAnchorWebapp();

  const bidPoolsByCollateral = useQuery(
    [
      ANCHOR_QUERY_KEY.BID_POOLS_BY_COLLATERAL,
      contractAddress.liquidation.liquidationQueueContract,
      collateralToken!,
      startAfter,
      limit,
    ],
    createQueryFn(bidPoolsByCollateralQuery, queryClient!),
    {
      refetchInterval: 1000 * 60 * 5,
      keepPreviousData: true,
      onError: queryErrorReporter,
      enabled: !!queryClient && !!collateralToken,
    }
  );

  return bidPoolsByCollateral;
}
