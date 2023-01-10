import { useEarnEpochStatesQuery } from '@anchor-protocol/app-provider';
import { aUST, UST, moneyMarket, u } from '@anchor-protocol/types';
import big, { Big } from 'big.js';
import { useCallback } from 'react';

export function computeTotalDeposit(
  userAUSTBalance: u<aUST> | undefined,
  moneyMarketEpochState: moneyMarket.market.EpochStateResponse | undefined,
) {
  return big(userAUSTBalance ?? '0').mul(
    moneyMarketEpochState?.exchange_rate ?? '1',
  ) as u<UST<Big>>;
}

export function useConvertToAUst() {

  const { data } = useEarnEpochStatesQuery();

  return useCallback((userUSTDeposit: string | undefined,) => {
    return big(userUSTDeposit ?? '0').div(
      data?.moneyMarketEpochState?.exchange_rate ?? '1',
    ) as aUST<Big>;
  }, [data?.moneyMarketEpochState])

}
