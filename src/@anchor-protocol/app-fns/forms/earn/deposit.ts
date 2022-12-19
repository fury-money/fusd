import { UST, Luna, Rate, u } from '@anchor-protocol/types';
import { computeMaxUstBalanceForUstTransfer } from '@libs/app-fns';
import { EstimatedFee } from '@libs/app-provider';
import { microfy } from '@libs/formatter';
import { FormReturn } from '@libs/use-form';
import big, { Big } from 'big.js';

export interface EarnDepositFormInput {
  depositAmount: UST;
}

export interface EarnDepositFormDependency {
  userUUSTBalance: u<UST>;
  txFee?: EstimatedFee;
  estimatedFeeError?: string;
  taxRate: Rate;
  maxTaxUUSD: u<Luna>;
  isConnected: boolean;
  depositFeeAmount: number;
}

export interface EarnDepositFormStates extends EarnDepositFormInput {
  availablePost: boolean;
  maxAmount: u<UST>;
  receiveAmount?: u<UST>;
  cavernFee?: u<UST>;
  estimatedFee?: EstimatedFee;
  estimatedFeeError?: string;
  invalidTxFee?: string;
  invalidDepositAmount?: string;
  invalidNextTxFee?: string;
}

export interface EarnDepositFormAsyncStates {}

export const earnDepositForm =
  ({
    txFee,
    estimatedFeeError,
    taxRate,
    maxTaxUUSD,
    userUUSTBalance,
    isConnected,
    depositFeeAmount,
  }: EarnDepositFormDependency) =>
  ({
    depositAmount,
  }: EarnDepositFormInput): FormReturn<
    EarnDepositFormStates,
    EarnDepositFormAsyncStates
  > => {
    const depositAmountExists = depositAmount.length > 0;

    // actual receive Amount (we take a small fee for system operations)
    const receiveAmount = txFee
      ? (microfy(big(depositAmount).mul(1 - depositFeeAmount).toString() as UST<string>) as u<UST<Big>>)
      : undefined;

    const cavernFee = txFee
      ? (microfy(big(depositAmount).mul(depositFeeAmount).toString() as UST<string>) as u<UST<Big>>)
      : undefined;

    // maxAmount
    const maxAmount = computeMaxUstBalanceForUstTransfer(
      userUUSTBalance,
      taxRate,
      maxTaxUUSD,
      '0' as u<UST>,
    );

    // invalidTxFee
    const invalidTxFee = (() => {
      return isConnected && txFee && big(userUUSTBalance).lt(0)
        ? 'Not enough transaction fees'
        : undefined;
    })();

    // invalidDepositAmount
    const invalidDepositAmount = (() => {
      if (!isConnected || !depositAmountExists || !txFee) {
        return undefined;
      }

      return microfy(depositAmount).plus(0).gt(userUUSTBalance)
        ? `Not enough axlUSDC`
        : undefined;
    })();

    // invalidNextTxFee
    const invalidNextTxFee = (() => {
      if (
        !isConnected ||
        !!invalidDepositAmount ||
        !maxAmount ||
        !depositAmountExists
      ) {
        return undefined;
      }

      return undefined;
    })();

    return [
      {
        depositAmount,
        estimatedFee: txFee,
        estimatedFeeError,
        receiveAmount: receiveAmount?.toFixed() as u<UST>,
        cavernFee: cavernFee?.toFixed() as u<UST>,
        maxAmount: maxAmount?.toFixed() as u<UST>,
        invalidTxFee,
        invalidDepositAmount,
        invalidNextTxFee,
        availablePost:
          isConnected &&
          depositAmountExists &&
          big(depositAmount).gt(0) &&
          !invalidTxFee &&
          !invalidDepositAmount,
      },
      undefined,
    ];
  };
