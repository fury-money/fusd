import {
  DomainInfo,
  domainInfoQuery,
} from "@anchor-protocol/app-fns/queries/nameservice/domainInfo";
import { reverseRecordsQuery } from "@anchor-protocol/app-fns/queries/nameservice/reverseRecords";
import { ReverseRecordsItemResponse } from "@anchor-protocol/types/contracts/nameservice";
import { createQueryFn } from "@libs/react-query-utils";
import { useAccount } from "contexts/account";
import { useQuery, UseQueryResult } from "react-query";
import { useAnchorWebapp } from "../../contexts/context";
import { ANCHOR_QUERY_KEY } from "../../env";
import pMap from "p-map";

export function useNameServiceQuery(
  addresses: string[] | undefined
): UseQueryResult<(DomainInfo | null)[]> {
  const { queryClient, queryErrorReporter, contractAddress } =
    useAnchorWebapp();

  const { terraWalletAddress } = useAccount();

  // We get the reverse records
  const { data: reverseRecords } = useQuery(
    [
      ANCHOR_QUERY_KEY.NAME_SERVICE_REGISTERED_DOMAINS,
      contractAddress.nameservice,
      addresses ?? [],
    ],
    createQueryFn(reverseRecordsQuery, queryClient!),
    {
      refetchInterval: 1000 * 60 * 5,
      keepPreviousData: true,
      onError: queryErrorReporter,
      enabled: !!addresses && addresses.length > 0 && !!queryClient,
    }
  );

  // We get the associated domain info
  const nameServiceInfo = useQuery(
    [
      ANCHOR_QUERY_KEY.NAME_SERVICE_REGISTERED_DOMAIN_INFO,
      contractAddress.nameservice,
      addresses,
      reverseRecords,
    ],
    async (): Promise<(DomainInfo | null)[]> =>
      pMap(
        reverseRecords?.reverseRecords.records ?? [],
        async (
          record: ReverseRecordsItemResponse
        ): Promise<DomainInfo | null> => {
          return record.record?.token_id
            ? domainInfoQuery(
                queryClient!,
                contractAddress.nameservice,
                record.record?.token_id ?? ""
              )
            : null;
        }
      ),
    {
      enabled: !!reverseRecords?.reverseRecords.records.length,
      refetchInterval: 1000 * 60 * 5,
      keepPreviousData: true,
      onError: queryErrorReporter,
    }
  );

  return nameServiceInfo ?? [];
}
