import { useNetwork } from "@anchor-protocol/app-provider";
import { lastSyncedHeightQuery } from "@libs/app-fns";
import { QueryClient } from "@libs/query-client";
import { createQueryFn } from "@libs/react-query-utils";
import { useQuery, UseQueryResult } from "react-query";
import { useAnchorWebapp } from "../../contexts/context";
import { ANCHOR_QUERY_KEY } from "../../env";

const storageKey = (mantleEndpoint: string) =>
  `__anchor_last_synced_height__?mantle=${mantleEndpoint}`;

export function useLastSyncedHeightQuery(): UseQueryResult<number> {
  const { network } = useNetwork();
  const { queryClient, queryErrorReporter } = useAnchorWebapp();
  const result = useQuery(
    [ANCHOR_QUERY_KEY.TERRA_LAST_SYNCED_HEIGHT, network.chainID],
    createQueryFn(
      (queryClient: QueryClient, chainID: string) =>
        lastSyncedHeightQuery(queryClient),
      queryClient!
    ),
    {
      refetchInterval: 1000 * 60,
      staleTime: 1000 * 6,
      keepPreviousData: true,
      onError: queryErrorReporter,
      enabled: !!queryClient,
    }
  );

  return result;
}
