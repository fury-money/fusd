
import {
  LSDContracts,
  useAnchorWebapp,
} from '@anchor-protocol/app-provider';
import { RegisteredLSDs } from 'env';
import { UnderlyingHubState, useWrappedTokenDetails } from '../basset/wrappedLSDTokenDetails';


export type LSDCollateralResponse = {
  name: RegisteredLSDs,
  info: LSDContracts
  additionalInfo: UnderlyingHubState | undefined,
}[]


export function useLSDCollateralQuery(): LSDCollateralResponse {

  const { contractAddress } = useAnchorWebapp();

  let lsdHubStates = Object.entries(contractAddress.lsds).map(([key, contracts] ) => {
        const {data: details} = useWrappedTokenDetails(contracts as LSDContracts);
        return {
          name: key as RegisteredLSDs,
          additionalInfo: details,
          info: contracts
        }
    })
  return lsdHubStates
}
