import { GovPoll, govPollQuery } from "@anchor-protocol/app-fns";
import { createQueryFn } from "@libs/react-query-utils";
import { useQuery, UseQueryResult } from "react-query";
import { useAnchorWebapp } from "../../contexts/context";
import { ANCHOR_QUERY_KEY } from "../../env";

export function useGovPollQuery(
  pollId: number
): UseQueryResult<GovPoll | undefined> {
  const { queryClient, contractAddress, queryErrorReporter } =
    useAnchorWebapp();

  const result = useQuery(
    [ANCHOR_QUERY_KEY.GOV_POLL, contractAddress.anchorToken.gov, pollId],
    createQueryFn(govPollQuery, queryClient!),
    {
      refetchInterval: 1000 * 60 * 5,
      keepPreviousData: true,
      onError: queryErrorReporter,
      enabled: !!queryClient,
    }
  );

  return result;
}
