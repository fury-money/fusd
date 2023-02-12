import { BidByUser, bidsByUserQuery } from '@anchor-protocol/app-fns';
import { LSDContracts } from '@anchor-protocol/app-provider';
import { createQueryFn } from '@libs/react-query-utils';
import { CW20Addr, HumanAddr } from '@libs/types';
import { DeepPartial } from 'chart.js/types/utils';
import { useAccount } from 'contexts/account';
import { RegisteredLSDs } from 'env';
import { useQuery, UseQueryResult } from 'react-query';
import { useAnchorWebapp } from '../../contexts/context';
import { ANCHOR_QUERY_KEY } from '../../env';
import { useBidByUserByCollateralQuery } from './bidByUser';

export type LSDLiquidationBidsResponse = {
  name: RegisteredLSDs | "aLuna"
  info: DeepPartial<LSDContracts>,
  bids: BidByUser | undefined,
}[]

export function useAllBidByUserByCollateralQuery(): LSDLiquidationBidsResponse {
  const { queryClient, queryErrorReporter, contractAddress } =
    useAnchorWebapp();

  let { data: aLunaLiquidationBids} = useBidByUserByCollateralQuery(contractAddress.cw20.aLuna);

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
    bids: aLunaLiquidationBids,
    info: {
      token: contractAddress.cw20.aLuna,
      info: {
        symbol: "aluna"
      }
    }
  }];
}
