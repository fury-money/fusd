import { UST, u } from "@anchor-protocol/types";
import { EstimatedFee } from "@libs/app-provider";
import { FormReturn } from "@libs/use-form";
import big from "big.js";

export interface LiquidationWithdrawCollateralFormInput {
  estimatedFee: EstimatedFee | undefined;
  withdrawLpAssets: boolean;
}

export interface LiquidationWithdrawCollateralFormDependency {
  userULunaBalance: u<UST>;
  isConnected: boolean;
}

export interface LiquidationWithdrawCollateralFormStates
  extends LiquidationWithdrawCollateralFormInput {
  availablePost: boolean;
  txFee?: EstimatedFee;
  invalidTxFee?: string;
  invalidNextTxFee?: string;
}

export interface LiquidationWithdrawCollateralFormAsyncStates {}

export const liquidationWithdrawCollateralForm =
  ({
    userULunaBalance,
    isConnected,
  }: LiquidationWithdrawCollateralFormDependency) =>
  ({
    estimatedFee,
    withdrawLpAssets,
  }: LiquidationWithdrawCollateralFormInput): FormReturn<
    LiquidationWithdrawCollateralFormStates,
    LiquidationWithdrawCollateralFormAsyncStates
  > => {
    // txFee
    const txFee = estimatedFee?.txFee;

    // invalidTxFee
    const invalidTxFee = (() => {
      if (isConnected && txFee && big(userULunaBalance).lt(txFee)) {
        return "Not enough transaction fees";
      } else if (isConnected) {
        return "Error when computing the tx Fee, invalid TX";
      }
      return undefined;
    })();

    // invalidDepositAmount
    const invalidDepositAmount = (() => {
      if (!isConnected || !txFee) {
        return undefined;
      }

      return undefined;
    })();

    // invalidNextTxFee
    const invalidNextTxFee = (() => {
      if (!isConnected || !!invalidDepositAmount) {
        return undefined;
      }
      return big(userULunaBalance).lt(big(estimatedFee?.txFee ?? 0).mul(2))
        ? `You don't have enough gas to pay for the transaction`
        : undefined;
    })();

    return [
      {
        txFee: estimatedFee,
        estimatedFee,
        invalidTxFee,
        invalidNextTxFee,
        availablePost: isConnected && !invalidTxFee && !invalidDepositAmount,
        withdrawLpAssets,
      },
      undefined,
    ];
  };
