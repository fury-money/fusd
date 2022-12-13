import {
  computeTotalDeposit,
  earnWithdrawForm,
  EarnWithdrawFormStates,
} from '@anchor-protocol/app-fns';
import { useAnchorWebapp } from '@anchor-protocol/app-provider/contexts/context';
import { UST } from '@anchor-protocol/types';
import { createHookMsg } from '@libs/app-fns/tx/internal';
import { useFeeEstimationFor } from '@libs/app-provider';
import { formatTokenInput } from '@libs/formatter';
import { useForm } from '@libs/use-form';
import { MsgExecuteContract } from '@terra-money/terra.js';
import { useAccount } from 'contexts/account';
import { useBalances } from 'contexts/balances';
import { useCallback, useMemo } from 'react';
import { useEarnEpochStatesQuery } from '../../queries/earn/epochStates';

export interface EarnWithdrawFormReturn extends EarnWithdrawFormStates {
  updateWithdrawAmount: (withdrawAmount: UST) => void;
}

export function useEarnWithdrawForm(): EarnWithdrawFormReturn {
  const { connected, terraWalletAddress } = useAccount();

  const { uUST, uaUST } = useBalances();

  const { data } = useEarnEpochStatesQuery();

  const { contractAddress } = useAnchorWebapp();

  const [estimatedFee, estimatedFeeError, estimateFee] =
    useFeeEstimationFor(terraWalletAddress);

  const { totalDeposit } = useMemo(() => {
    return {
      totalDeposit: computeTotalDeposit(uaUST, data?.moneyMarketEpochState),
    };
  }, [data?.moneyMarketEpochState, uaUST]);

  const [input, states] = useForm(
    earnWithdrawForm,
    {
      isConnected: connected,
      txFee: estimatedFee,
      estimatedFeeError,
      userUUSTBalance: uUST,
      totalDeposit: totalDeposit,
    },
    () => ({ withdrawAmount: '' as UST }),
  );

  const updateWithdrawAmount = useCallback(
    (withdrawAmount: UST) => {
      input({
        withdrawAmount,
      });
      if (terraWalletAddress) {
        estimateFee([
          new MsgExecuteContract(
            terraWalletAddress,
            contractAddress.cw20.aUST,
            {
              send: {
                contract: contractAddress.moneyMarket.market,
                amount: formatTokenInput(withdrawAmount),
                msg: createHookMsg({
                  redeem_stable: {},
                }),
              },
            },
          ),
        ]);
      }
    },
    [
      input,
      estimateFee,
      terraWalletAddress,
      contractAddress.cw20.aUST,
      contractAddress.moneyMarket.market,
    ],
  );

  return {
    ...states,
    updateWithdrawAmount,
  };
}
