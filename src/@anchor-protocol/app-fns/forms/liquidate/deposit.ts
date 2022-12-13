import { UST, Luna, u } from '@anchor-protocol/types';
import { EstimatedFee } from '@libs/app-provider';
import { max, min } from '@libs/big-math';
import { microfy } from '@libs/formatter';
import { FormReturn } from '@libs/use-form';
import big, { Big } from 'big.js';
const _ = require('lodash');

export interface LiquidationDepositFormInput {
  depositAmount: UST;
  premium: number;
  estimatedFee: EstimatedFee | undefined;
}

export interface LiquidationDepositFormDependency {
  userUUSTBalance: u<UST>;
  userULunaBalance: u<UST>;
  isConnected: boolean;
}

export interface LiquidationDepositFormStates
  extends LiquidationDepositFormInput {
  availablePost: boolean;
  maxAmount: u<UST>;
  sendAmount?: u<UST>;
  invalidTxFee?: string;
  invalidDepositAmount?: string;
  invalidPremium?: string;
  invalidNextTxFee?: string;
}

export interface LiquidationDepositFormAsyncStates {}

export const liquidationDepositForm =
  ({
    userUUSTBalance,
    userULunaBalance,
    isConnected,
  }: LiquidationDepositFormDependency) =>
  ({
    depositAmount,
    premium,
    estimatedFee,
  }: LiquidationDepositFormInput): FormReturn<
    LiquidationDepositFormStates,
    LiquidationDepositFormAsyncStates
  > => {
    const depositAmountExists = depositAmount.length > 0;

    // txFee
    const txFee = (() => {
      if (!isConnected || !depositAmountExists) {
        return undefined;
      }

      const ratioTxFee = big('0');
      const maxTax = big('0');
      return max(min(ratioTxFee, maxTax), 0).plus(
        estimatedFee?.txFee ?? '0',
      ) as u<Luna<Big>>;
    })();

    // sendAmount
    const sendAmount = txFee
      ? (microfy(depositAmount).plus(txFee) as u<UST<Big>>)
      : undefined;

    // maxAmount
    const maxAmount = big(userUUSTBalance);

    // invalidTxFee
    const invalidTxFee = (() => {
      return isConnected && txFee && big(userULunaBalance).lt(txFee)
        ? 'Not enough transaction fees'
        : undefined;
    })();

    // invalidDepositAmount
    const invalidDepositAmount = (() => {
      if (!isConnected || !depositAmountExists || !txFee) {
        return undefined;
      }

      return microfy(depositAmount).gt(userUUSTBalance)
        ? `Not enough axlUSDC`
        : undefined;
    })();

    // invalid premium
    const invalidPremium = (() => {
      if (!isConnected) {
        return undefined;
      }

      return premium < 0 || premium > 30 ? `Invalid premium` : undefined;
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

      return big(userULunaBalance).lt(big(estimatedFee?.txFee ?? '0').mul(2))
        ? `Leaving less Luna in your account may lead to insufficient transaction fees for future transactions.`
        : undefined;
    })();
    return [
      {
        depositAmount,
        premium,
        estimatedFee: _.cloneDeep(estimatedFee),
        sendAmount: sendAmount?.toFixed() as u<UST>,
        maxAmount: maxAmount?.toFixed() as u<UST>,
        invalidTxFee,
        invalidDepositAmount,
        invalidNextTxFee,
        invalidPremium,
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
