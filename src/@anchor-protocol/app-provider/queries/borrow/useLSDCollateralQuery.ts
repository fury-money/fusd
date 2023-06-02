import { LSDContracts, useAnchorWebapp } from "@anchor-protocol/app-provider";
import { RegisteredLSDs } from "env";
import { useMemo } from "react";
import { useLSDToUnderlyingExchangeRate } from "../basset/LsdToUnderlyingExchangeRate";
import {
  UnderlyingHubState,
  useWrappedTokenDetails,
} from "../basset/wrappedLSDTokenDetails";

export interface PriceInfo {
  hubState:
    | {
        exchange_rate: string;
      }
    | undefined;
  lsdExchangeRate: string | undefined;
}

export type LSDCollateralResponse = {
  name: RegisteredLSDs;
  info: LSDContracts;
  priceInfo: PriceInfo | undefined;
}[];

export function useLSDCollateralQuery(): LSDCollateralResponse {
  const { contractAddress } = useAnchorWebapp();

  let lsdHubStates: LSDCollateralResponse = useMemo(
    () =>
      Object.entries(contractAddress.lsds).map(([key, contracts]) => {
        return {
          name: key as RegisteredLSDs,
          priceInfo: undefined,
          info: contracts,
        };
      }),
    [contractAddress.lsds]
  );

  Object.entries(contractAddress.lsds).forEach(([key, contracts], i) => {
    const { data: details } = useWrappedTokenDetails(contracts as LSDContracts);
    const { data: exchangeRate } = useLSDToUnderlyingExchangeRate(
      contracts as LSDContracts
    );
    lsdHubStates[i].priceInfo = {
      hubState: details?.hubState,
      lsdExchangeRate: exchangeRate,
    };
  });

  return lsdHubStates;
}
