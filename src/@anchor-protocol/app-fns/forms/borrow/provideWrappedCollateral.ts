import {
  computeBorrowedAmount,
  computeBorrowLimit,
} from "@anchor-protocol/app-fns";
import {
  UST,
  bAsset,
  Luna,
  moneyMarket,
  Rate,
  u,
} from "@anchor-protocol/types";
import { FormReturn } from "@libs/use-form";
import big, { Big } from "big.js";
import { computeLtv } from "../../logics/borrow/computeLtv";
import { computeDepositAmountToBorrowLimit } from "../../logics/borrow/computeDepositAmountToBorrowLimit";
import { computeDepositAmountToLtv } from "../../logics/borrow/computeDepositAmountToLtv";
import { computeLtvToDepositAmount } from "../../logics/borrow/computeLtvToDepositAmount";
import { computeProvideCollateralBorrowLimit } from "../../logics/borrow/computeProvideCollateralBorrowLimit";
import { computeProvideCollateralNextLtv } from "../../logics/borrow/computeProvideCollateralNextLtv";
import { validateDepositAmount } from "../../logics/borrow/validateDepositAmount";
import { validateTxFee } from "../../logics/common/validateTxFee";
import { BAssetLtvs } from "../../queries/borrow/market";
import { computebAssetLtvsAvg } from "@anchor-protocol/app-fns/logics/borrow/computebAssetLtvsAvg";
import { microfy } from "@anchor-protocol/formatter";
import { WhitelistWrappedCollateral } from "queries";

export interface BorrowProvideWrappedCollateralFormInput {
  depositAmount: bAsset;
}

export interface BorrowProvideWrappedCollateralFormDependency {
  collateral: WhitelistWrappedCollateral;
  fixedFee: u<Luna>;
  userUSTBalance: u<UST>;
  userLunaBalance: u<Luna>;
  userBAssetBalance: u<bAsset>;
  oraclePrices: moneyMarket.oracle.PricesResponse;
  bAssetLtvs: BAssetLtvs;
  marketBorrowerInfo: moneyMarket.market.BorrowerInfoResponse;
  overseerCollaterals: moneyMarket.overseer.CollateralsResponse;
  connected: boolean;
  exchangeRate: Rate;
}

export interface BorrowProvideWrappedCollateralFormStates
  extends BorrowProvideWrappedCollateralFormInput {
  lunaAmount: u<bAsset>;
  exchangeRate: Rate;
  amountToLtv: (depositAmount: u<bAsset>) => Rate<Big>;
  ltvToAmount: (ltv: Rate<Big>) => u<bAsset<Big>>;
  ltvStepFunction: (draftLtv: Rate<Big>) => Rate<Big>;
  dangerLtv: Rate<Big>;
  collateral: WhitelistWrappedCollateral;
  txFee: u<Luna>;
  currentLtv: Rate<Big> | undefined;
  nextLtv: Rate<Big> | undefined;
  borrowLimit: u<UST<Big>>;
  invalidTxFee: string | undefined;
  invalidDepositAmount: string | undefined;
  userBAssetBalance: u<bAsset>;
  availablePost: boolean;
}

export interface BorrowProvideWrappedCollateralFormAsyncStates {}

export const borrowProvideWrappedCollateralForm = ({
  collateral,
  fixedFee,
  userUSTBalance,
  userLunaBalance,
  userBAssetBalance,
  bAssetLtvs,
  overseerCollaterals,
  oraclePrices,
  marketBorrowerInfo,
  connected,
  exchangeRate,
}: BorrowProvideWrappedCollateralFormDependency) => {
  const amountToLtv = computeDepositAmountToLtv(
    collateral.collateral_token,
    marketBorrowerInfo,
    overseerCollaterals,
    oraclePrices,
    bAssetLtvs
  );

  const ltvToAmount = computeLtvToDepositAmount(
    collateral.collateral_token,
    marketBorrowerInfo,
    overseerCollaterals,
    oraclePrices,
    bAssetLtvs
  );

  const amountToBorrowLimit = computeDepositAmountToBorrowLimit(
    collateral.collateral_token,
    overseerCollaterals,
    oraclePrices,
    bAssetLtvs
  );

  const borrowedAmount = computeBorrowedAmount(marketBorrowerInfo);

  const borrowLimit = computeBorrowLimit(
    overseerCollaterals,
    oraclePrices,
    bAssetLtvs
  );

  const currentLtv = computeLtv(borrowLimit, borrowedAmount);

  const bAssetLtvsAvg = computebAssetLtvsAvg(bAssetLtvs);

  const dangerLtv = big(bAssetLtvsAvg.max).minus(0.1) as Rate<Big>;

  const invalidTxFee = connected
    ? validateTxFee(userLunaBalance, fixedFee)
    : undefined;

  const ltvStepFunction = (draftLtv: Rate<Big>): Rate<Big> => {
    try {
      return amountToLtv(ltvToAmount(draftLtv));
    } catch {
      return draftLtv;
    }
  };

  return ({
    depositAmount,
  }: BorrowProvideWrappedCollateralFormInput): FormReturn<
    BorrowProvideWrappedCollateralFormStates,
    BorrowProvideWrappedCollateralFormAsyncStates
  > => {
    const lunaAmount = (
      depositAmount.length > 0
        ? big(
            microfy(
              big(depositAmount).mul(exchangeRate).toString() as bAsset,
              collateral.decimals
            )
          )
            .round()
            .minus(1)
            .toString()
        : "0"
    ) as u<bAsset>;

    const underlyingAmount =
      depositAmount.length > 0
        ? microfy(depositAmount, collateral.decimals)
        : ("0" as u<bAsset>);

    const nextLtv = computeProvideCollateralNextLtv(
      lunaAmount,
      currentLtv,
      amountToLtv
    );

    const borrowLimit = computeProvideCollateralBorrowLimit(
      lunaAmount,
      amountToBorrowLimit
    );

    const invalidDepositAmount =
      validateDepositAmount(underlyingAmount, userBAssetBalance) ||
      (exchangeRate == "0" ? "Exchange Rate null, can't deposit" : undefined);

    const availablePost =
      connected &&
      depositAmount.length > 0 &&
      big(underlyingAmount).gt(0) &&
      !invalidTxFee &&
      !invalidDepositAmount;

    return [
      {
        depositAmount,
        lunaAmount,
        exchangeRate,
        collateral,
        borrowLimit,
        currentLtv,
        amountToLtv,
        ltvStepFunction,
        dangerLtv,
        invalidDepositAmount,
        invalidTxFee,
        nextLtv,
        ltvToAmount,
        userBAssetBalance,
        availablePost,
        txFee: fixedFee,
      },
      undefined,
    ];
  };
};
