import { UST, Luna, u } from '@anchor-protocol/types';
import { max, min } from '@libs/big-math';
import { FormReturn } from '@libs/use-form';
import big, { Big } from 'big.js';

export interface LiquidationWithdrawFormInput {
  bid_idx: string;
}

export interface LiquidationWithdrawFormDependency {
  userUUSTBalance: u<UST>;
  userULunaBalance: u<UST>;
  isConnected: boolean;
}

export interface LiquidationWithdrawFormStates
  extends LiquidationWithdrawFormInput {
  bid_idx: string;
  availablePost: boolean;
  invalidTxFee?: string;
  invalidNextTxFee?: string;
}

export interface LiquidationWithdrawFormAsyncStates {}

export const liquidationWithdrawForm =
  ({
    userUUSTBalance,
    userULunaBalance,
    isConnected,
  }: LiquidationWithdrawFormDependency) =>
  ({
    bid_idx,
  }: LiquidationWithdrawFormInput): FormReturn<
    LiquidationWithdrawFormStates,
    LiquidationWithdrawFormAsyncStates
  > => {
    const idxExists = !!bid_idx;
    // txFee
    const txFee = (() => {
      if (!isConnected || !idxExists) {
        return undefined;
      }

      const ratioTxFee = big('0');
      const maxTax = big('0');
      return max(min(ratioTxFee, maxTax), 0) as u<Luna<Big>>;
    })();

    // invalidTxFee
    const invalidTxFee = (() => {
      return isConnected && txFee && big(userULunaBalance).lt(txFee)
        ? 'Not enough transaction fees'
        : undefined;
    })();

    // invalidDepositAmount
    const invalidDepositAmount = (() => {
      if (!isConnected || !idxExists || !txFee) {
        return undefined;
      }

      return undefined;
    })();

    // invalidNextTxFee
    const invalidNextTxFee = undefined;

    return [
      {
        bid_idx,
        invalidTxFee,
        invalidNextTxFee,
        availablePost:
          isConnected && idxExists && !invalidTxFee && !invalidDepositAmount,
      },
      undefined,
    ];
  };
