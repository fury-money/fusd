import { createSimpleQueryFn } from "@libs/react-query-utils";
import { HumanAddr } from "@libs/types";
import { useAccount } from "contexts/account";
import { useQuery, UseQueryResult } from "react-query";
import { useAnchorWebapp } from "../../contexts/context";
import { ANCHOR_QUERY_KEY } from "../../env";

export interface LenderValueData {
  lenderValue: {
    lender: string;
    stableAmount: string;
    aAmount: string;
    lastUpdated: Date;
  };
}

export async function lenderValueQuery(
  lender: HumanAddr | undefined,
  endpoint: string
): Promise<LenderValueData> {
  const emptyValue = {
    lender: "",
    stableAmount: "0",
    aAmount: "0",
    lastUpdated: new Date(Date.now()),
  };

  if (!lender) {
    return {
      lenderValue: emptyValue,
    };
  }

  return fetch(`${endpoint}/v3/lenders/${lender}`)
    .then((res) => res.json())
    .then((lenderValue) => ({
      lenderValue: lenderValue ?? emptyValue,
    }));
}

const queryFn = createSimpleQueryFn(lenderValueQuery);

export function useLenderValue(): UseQueryResult<LenderValueData | undefined> {
  const { queryErrorReporter, indexerApiEndpoint } = useAnchorWebapp();

  const { terraWalletAddress } = useAccount();

  return useQuery(
    [ANCHOR_QUERY_KEY.EARN_APY_HISTORY, terraWalletAddress, indexerApiEndpoint],
    queryFn,
    {
      refetchInterval: 1000 * 60 * 60,
      keepPreviousData: true,
      onError: queryErrorReporter,
    }
  );
}
