import {
  computeBorrowedAmount,
  computeBorrowLimit,
  computeLtv,
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
import big, { Big, BigSource } from "big.js";
import { computeLtvToRedeemAmount } from "../../logics/borrow/computeLtvToRedeemAmount";
import { computeRedeemAmountToLtv } from "../../logics/borrow/computeRedeemAmountToLtv";
import { computeRedeemCollateralBorrowLimit } from "../../logics/borrow/computeRedeemCollateralBorrowLimit";
import { computeRedeemCollateralNextLtv } from "../../logics/borrow/computeRedeemCollateralNextLtv";
import { validateRedeemAmount } from "../../logics/borrow/validateRedeemAmount";
import { validateTxFee } from "../../logics/common/validateTxFee";
import { BAssetLtvs } from "../../queries/borrow/market";
import { computebAssetLtvsAvg } from "@anchor-protocol/app-fns/logics/borrow/computebAssetLtvsAvg";
import { microfy } from "@anchor-protocol/formatter";
import { WhitelistCollateral, WhitelistWrappedCollateral } from "queries";

export interface BorrowRedeemWrappedCollateralFormInput {
  redeemAmount: bAsset;
}

export interface BorrowRedeemWrappedCollateralFormDependency {
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

export interface BorrowRedeemWrappedCollateralFormStates
  extends BorrowRedeemWrappedCollateralFormInput {
  redeemWrappedAmount: u<bAsset>;
  exchangeRate: Rate;
  amountToLtv: (redeemAmount: u<bAsset>) => Rate<Big>;
  ltvToAmount: (ltv: Rate<Big>) => u<bAsset<Big>>;
  ltvStepFunction: (draftLtv: Rate<Big>) => Rate<Big>;
  collateral: WhitelistWrappedCollateral;
  userMaxLtv: Rate<Big>;
  txFee: u<Luna>;
  currentLtv: Rate<Big> | undefined;
  nextLtv: Rate<Big> | undefined;
  withdrawableAmount: u<bAsset<Big>>;
  withdrawableMaxAmount: u<bAsset<Big>>;
  borrowLimit: u<UST<Big>>;
  invalidTxFee: string | undefined;
  invalidRedeemAmount: string | undefined;
  userBAssetBalance: u<bAsset>;
  availablePost: boolean;
}

export interface BorrowRedeemWrappedCollateralFormAsyncStates {}

export const borrowRedeemWrappedCollateralForm = ({
  collateral,
  fixedFee,
  userUSTBalance,
  userLunaBalance,
  userBAssetBalance,
  oraclePrices,
  bAssetLtvs,
  marketBorrowerInfo,
  overseerCollaterals,
  connected,
  exchangeRate,
}: BorrowRedeemWrappedCollateralFormDependency) => {
  const amountToLtv = computeRedeemAmountToLtv(
    collateral.collateral_token,
    marketBorrowerInfo,
    overseerCollaterals,
    oraclePrices,
    bAssetLtvs
  );

  const ltvToAmount = computeLtvToRedeemAmount(
    collateral.collateral_token,
    marketBorrowerInfo,
    overseerCollaterals,
    oraclePrices,
    bAssetLtvs
  );

  const bAssetLtvsAvg = computebAssetLtvsAvg(bAssetLtvs);

  const userMaxLtv = big(bAssetLtvsAvg.max).minus(0.1) as Rate<Big>;

  const currentLtv = computeLtv(
    computeBorrowLimit(overseerCollaterals, oraclePrices, bAssetLtvs),
    computeBorrowedAmount(marketBorrowerInfo)
  );

  const ltvStepFunction = (draftLtv: Rate<Big>): Rate<Big> => {
    try {
      return amountToLtv(ltvToAmount(draftLtv));
    } catch {
      return draftLtv;
    }
  };

  return ({
    redeemAmount,
  }: BorrowRedeemWrappedCollateralFormInput): FormReturn<
    BorrowRedeemWrappedCollateralFormStates,
    BorrowRedeemWrappedCollateralFormAsyncStates
  > => {
    const redeemWrappedAmount = (
      redeemAmount.length > 0
        ? big(
            microfy(
              big(redeemAmount).mul(exchangeRate).toString() as bAsset,
              collateral.decimals
            )
          )
            .round()
            .minus(1)
            .toString()
        : "0"
    ) as u<bAsset>;

    const nextLtv = computeRedeemCollateralNextLtv(
      redeemWrappedAmount,
      currentLtv,
      amountToLtv
    );

    const withdrawableUnderlyingAmount = (
      exchangeRate != "0"
        ? big(ltvToAmount(0.75 as Rate<BigSource>).div(exchangeRate)).round()
        : 0
    ) as u<bAsset<Big>>;

    const withdrawableMaxUnderlyingAmount = (
      exchangeRate != "0"
        ? big(ltvToAmount(1 as Rate<BigSource>).div(exchangeRate)).round()
        : 0
    ) as u<bAsset<Big>>;

    const withdrawableMaxAmount = ltvToAmount(1 as Rate<BigSource>);

    const borrowLimit = computeRedeemCollateralBorrowLimit(
      collateral.collateral_token,
      redeemWrappedAmount,
      overseerCollaterals,
      oraclePrices,
      bAssetLtvs
    );

    const invalidTxFee = connected
      ? validateTxFee(userLunaBalance, fixedFee)
      : undefined;

    const invalidRedeemAmount = validateRedeemAmount(
      redeemWrappedAmount,
      withdrawableMaxAmount
    );

    const availablePost =
      connected &&
      redeemAmount.length > 0 &&
      big(redeemAmount).gt(0) &&
      !invalidTxFee &&
      !invalidRedeemAmount;

    return [
      {
        amountToLtv,
        borrowLimit,
        currentLtv,
        collateral,
        invalidRedeemAmount,
        availablePost,
        redeemAmount,
        redeemWrappedAmount,
        exchangeRate,
        ltvToAmount,
        ltvStepFunction,
        invalidTxFee,
        nextLtv,
        txFee: fixedFee,
        userMaxLtv,
        withdrawableAmount: withdrawableUnderlyingAmount,
        withdrawableMaxAmount: withdrawableMaxUnderlyingAmount,
        userBAssetBalance,
      },
      undefined,
    ];
  };
};
