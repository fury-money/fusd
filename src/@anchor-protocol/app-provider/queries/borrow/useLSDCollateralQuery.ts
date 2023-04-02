import { LSDContracts, useAnchorWebapp } from "@anchor-protocol/app-provider";
import { RegisteredLSDs } from "env";
import { useMemo } from "react";
import {
  UnderlyingHubState,
  useWrappedTokenDetails,
} from "../basset/wrappedLSDTokenDetails";

export type LSDCollateralResponse = {
  name: RegisteredLSDs;
  info: LSDContracts;
  additionalInfo: UnderlyingHubState | undefined;
}[];

export function useLSDCollateralQuery(): LSDCollateralResponse {
  const { contractAddress } = useAnchorWebapp();

  let lsdHubStates: {
    name: RegisteredLSDs,
    additionalInfo: UnderlyingHubState | undefined,
    info: LSDContracts
  }[] = useMemo(()=> Object.entries(contractAddress.lsds).map(([key, contracts]) => {
    return {
      name: key as RegisteredLSDs,
      additionalInfo: undefined, 
      info: contracts
    }
  }), [contractAddress.lsds]);


  Object.entries(contractAddress.lsds).forEach(
    ([key, contracts], i) => {
      const { data: details } = useWrappedTokenDetails(
        contracts as LSDContracts
      );
      lsdHubStates[i].additionalInfo = details
    }
  );

  return lsdHubStates;
}
