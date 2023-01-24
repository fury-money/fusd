import { BidByUser, bidsByUserQuery } from '@anchor-protocol/app-fns';
import { LSDContracts } from '@anchor-protocol/app-provider';
import { createQueryFn } from '@libs/react-query-utils';
import { CW20Addr, HumanAddr } from '@libs/types';
import { useAccount } from 'contexts/account';
import { RegisteredLSDs } from 'env';
import { useQuery, UseQueryResult } from 'react-query';
import { useAnchorWebapp } from '../../contexts/context';
import { ANCHOR_QUERY_KEY } from '../../env';
import { useBidByUserByCollateralQuery } from './bidByUser';

const queryFn = createQueryFn(bidsByUserQuery);

export type LSDLiquidationBidsResponse = {
  name: RegisteredLSDs | "aLuna"
  info: Partial<LSDContracts>,
  bids: BidByUser | undefined,
}[]

export function useAllBidByUserByCollateralQuery(): LSDLiquidationBidsResponse {
  const { queryClient, queryErrorReporter, contractAddress } =
    useAnchorWebapp();

  let { data: bLunaLiquidationBids} = useBidByUserByCollateralQuery(contractAddress.cw20.bLuna);

  let allLiquidationBids = Object.entries(contractAddress.lsds).map(([key, contracts] ) => {
        const {data: bids} = useBidByUserByCollateralQuery(contracts.token as CW20Addr);
        return {
          name: key as RegisteredLSDs,
          bids,
          info: contracts
        }
    })
  return [...allLiquidationBids, {
    name: "aLuna",
    bids: bLunaLiquidationBids,
    info: {
      token: contractAddress.cw20.bLuna
    }
  }];
}
