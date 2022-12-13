import {
  earnDepositForm,
  EarnDepositFormStates,
} from '@anchor-protocol/app-fns';
import { useAnchorWebapp } from '@anchor-protocol/app-provider/contexts/context';
import { UST } from '@anchor-protocol/types';
import { useFeeEstimationFor, useUstTax } from '@libs/app-provider';
import { formatTokenInput } from '@libs/formatter';
import { useForm } from '@libs/use-form';
import { Coin, Coins, MsgExecuteContract } from '@terra-money/terra.js';
import { useAccount } from 'contexts/account';
import { useBalances } from 'contexts/balances';
import { useCallback } from 'react';

export interface EarnDepositFormReturn extends EarnDepositFormStates {
  updateDepositAmount: (depositAmount: UST) => void;
}

export function useEarnDepositForm(): EarnDepositFormReturn {
  const { connected, terraWalletAddress } = useAccount();
  const { contractAddress } = useAnchorWebapp();

  const [estimatedFee, estimatedFeeError, estimateFee] =
    useFeeEstimationFor(terraWalletAddress);

  const { uUST } = useBalances();

  const { taxRate, maxTax } = useUstTax();

  const [input, states] = useForm(
    earnDepositForm,
    {
      isConnected: connected,
      txFee: estimatedFee,
      estimatedFeeError,
      taxRate: taxRate,
      maxTaxUUSD: maxTax,
      userUUSTBalance: uUST,
    },
    () => ({ depositAmount: '' as UST }),
  );

  const updateDepositAmount = useCallback(
    (depositAmount: UST) => {
      input({
        depositAmount,
      });
      if (terraWalletAddress) {
        estimateFee([
          new MsgExecuteContract(
            terraWalletAddress,
            contractAddress.moneyMarket.market,
            {
              // @see https://github.com/Anchor-Protocol/money-market-contracts/blob/master/contracts/market/src/msg.rs#L65
              deposit_stable: {},
            },

            // coins
            new Coins([
              new Coin(
                contractAddress.native.usd,

                formatTokenInput(depositAmount),
              ),
            ]),
          ),
        ]);
      }
    },
    [
      input,
      estimateFee,
      terraWalletAddress,
      contractAddress.moneyMarket.market,
      contractAddress.native.usd,
    ],
  );

  return {
    ...states,
    updateDepositAmount,
  };
}
