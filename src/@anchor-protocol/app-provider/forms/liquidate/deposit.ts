import {
  liquidationDepositForm,
  LiquidationDepositFormStates,
} from '@anchor-protocol/app-fns/forms/liquidate/deposit';
import { useAnchorBank } from '@anchor-protocol/app-provider/hooks/useAnchorBank';
import { UST } from '@anchor-protocol/types';
import { defaultFee, EstimatedFee } from '@libs/app-provider';
import { useForm } from '@libs/use-form';
import { useAccount } from 'contexts/account';
import { useCallback } from 'react';

export interface LiquidationDepositFormReturn
  extends LiquidationDepositFormStates {
  updateDepositAmount: (depositAmount: UST) => void;
  updatePremiumValue: (premium: number | undefined) => void;
  updateEstimatedFee: (estimatedFee: EstimatedFee | undefined) => void;
}

export function useLiquidationDepositForm(): LiquidationDepositFormReturn {
  const { connected } = useAccount();

  const {
    tokenBalances: { uUST, uLuna },
  } = useAnchorBank();

  const [input, states] = useForm(
    liquidationDepositForm,
    {
      isConnected: connected,
      userUUSTBalance: uUST,
      userULunaBalance: uLuna,
    },
    () => ({
      depositAmount: '' as UST,
      premium: 0,
      estimatedFee: defaultFee(),
    }),
  );

  const updateDepositAmount = useCallback(
    (depositAmount: UST) => {
      input({
        depositAmount,
      });
    },
    [input],
  );

  const updatePremiumValue = useCallback(
    (premium: number | undefined) => {
      input({
        premium,
      });
    },
    [input],
  );

  const updateEstimatedFee = useCallback(
    (estimatedFee: EstimatedFee | undefined) => {
      input({
        estimatedFee,
      });
    },
    [input],
  );

  return {
    ...states,
    updateDepositAmount,
    updatePremiumValue,
    updateEstimatedFee,
  };
}
