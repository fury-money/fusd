import React, { useCallback } from 'react';
import {
  useEarnEpochStatesQuery,
  useEarnWithdrawForm,
} from '@anchor-protocol/app-provider';
import { ActionButton } from '@libs/neumorphism-ui/components/ActionButton';
import { ViewAddressWarning } from 'components/ViewAddressWarning';
import { useAccount } from 'contexts/account';
import { WithdrawDialog } from '../WithdrawDialog';
import { useEarnWithdrawTx } from '@anchor-protocol/app-provider/tx/earn/withdraw';
import { aUST, UST } from '@anchor-protocol/types';
import { Big } from 'big.js';
import { DialogProps } from '@libs/use-dialog';
import { EstimatedFee } from '@libs/app-provider';

export function TerraWithdrawDialog(props: DialogProps<{}, void>) {
  const { connected } = useAccount();

  const { data } = useEarnEpochStatesQuery();

  const state = useEarnWithdrawForm();

  const [withdraw, withdrawTxResult] = useEarnWithdrawTx();

  const { withdrawAmount, estimatedFee, availablePost } = state;

  const proceed = useCallback(
    async (withdrawAmount: UST, txFee: EstimatedFee | undefined) => {
      if (!connected || !withdraw || !data || !txFee) {
        return;
      }

      withdraw({
        withdrawAmount: Big(withdrawAmount)
          .div(data.moneyMarketEpochState.exchange_rate)
          .toString() as aUST,
        txFee,
      });
    },
    [connected, data, withdraw],
  );

  return (
    <WithdrawDialog {...props} {...state} txResult={withdrawTxResult}>
      <ViewAddressWarning>
        <ActionButton
          className="button"
          disabled={
            !availablePost ||
            !connected ||
            !withdraw ||
            !availablePost ||
            !estimatedFee
          }
          onClick={() => proceed(withdrawAmount, estimatedFee)}
        >
          Proceed
        </ActionButton>
      </ViewAddressWarning>
    </WithdrawDialog>
  );
}
