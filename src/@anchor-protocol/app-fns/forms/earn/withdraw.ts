import { UST, Luna, u } from '@anchor-protocol/types';
import { EstimatedFee } from '@libs/app-provider';
import { microfy } from '@libs/formatter';
import { FormReturn } from '@libs/use-form';
import big, { Big, BigSource } from 'big.js';

export interface EarnWithdrawFormInput {
  withdrawAmount: UST;
}

export interface EarnWithdrawFormDependency {
  userUUSTBalance: u<Luna<BigSource>>;
  txFee?: EstimatedFee;
  estimatedFeeError?: string;
  totalDeposit: u<UST<BigSource>>;
  isConnected: boolean;
}

export interface EarnWithdrawFormStates extends EarnWithdrawFormInput {
  receiveAmount?: u<UST<BigSource>>;
  invalidTxFee?: string;
  estimatedFee?: EstimatedFee;
  estimatedFeeError?: string;
  invalidWithdrawAmount?: string;
  availablePost: boolean;
}

export interface EarnWithdrawFormAsyncStates {}

export const earnWithdrawForm =
  ({
    isConnected,
    totalDeposit,
    userUUSTBalance,
    txFee,
    estimatedFeeError,
  }: EarnWithdrawFormDependency) =>
  ({
    withdrawAmount,
  }: EarnWithdrawFormInput): FormReturn<
    EarnWithdrawFormStates,
    EarnWithdrawFormAsyncStates
  > => {
    if (withdrawAmount.length === 0) {
      return [
        {
          withdrawAmount: '' as UST,
          availablePost: false,
        },
        undefined,
      ];
    } else {
      // receiveAmount
      const receiveAmount = microfy(withdrawAmount) as u<UST<Big>>;

      // invalidTxFee
      const invalidTxFee = (() => {
        return isConnected && txFee && big(userUUSTBalance).lt(0)
          ? 'Not enough transaction fees'
          : undefined;
      })();

      // invalidWithdrawAmount
      const invalidWithdrawAmount = (() => {
        if (!isConnected) {
          return undefined;
        }

        return microfy(withdrawAmount).gt(totalDeposit)
          ? `Not enough aUSDC`
          : big(userUUSTBalance).lt(0)
          ? `Not enough axlUSDC`
          : undefined;
      })();

      return [
        {
          withdrawAmount: withdrawAmount,
          receiveAmount,
          estimatedFee: txFee,
          estimatedFeeError,
          invalidTxFee,
          invalidWithdrawAmount,
          availablePost:
            isConnected &&
            big(withdrawAmount).gt(0) &&
            !invalidTxFee &&
            !invalidWithdrawAmount,
        },
        undefined,
      ];
    }
  };
