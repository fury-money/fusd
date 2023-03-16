import {
  ANCHOR_DANGER_RATIO,
  ANCHOR_SAFE_RATIO,
  computeBorrowAPR,
} from "@anchor-protocol/app-fns";
import { CollateralAmount, moneyMarket, Rate } from "@anchor-protocol/types";
import { EstimatedFee } from "@libs/app-provider";
import { formatRate, microfy } from "@libs/formatter";
import { Luna, u } from "@libs/types";
import { FormReturn } from "@libs/use-form";
import big, { Big } from "big.js";
import { WhitelistWrappedCollateral } from "queries";

export const MAX_LOOPS = 10;

export interface BorrowLoopFormInput {
  collateral: WhitelistWrappedCollateral | undefined;
  collateralAmount?: CollateralAmount;
  maxCollateralAmount?: CollateralAmount;
  targetLeverage: Rate;
  minimumLeverage: number;
  maximumLeverage: number;
  maximumLTV: Rate;
  estimatedFee: EstimatedFee | undefined;
}

export interface BorrowLoopFormDependency {
  userLunaBalance: u<Luna>;
  oraclePrices: moneyMarket.oracle.PricesResponse | undefined;
  connected: boolean;

  borrowRate: moneyMarket.interestModel.BorrowRateResponse | undefined;
  blocksPerYear: number;
}

export interface BorrowLoopFormStates extends BorrowLoopFormInput {
  numberOfLoops: number;
  estimatedLiquidationPrice: number | null;

  userMaxLtv: number;
  actualMaximumLTV: number;
  apr: Rate<Big>;

  invalidTxFee: string | undefined;
  invalidLTV: string | undefined;
  invalidLeverage: string | undefined;
  invalidCollateralAmount: string | undefined;
  invalidLoopNumber: string | undefined;
  warningOverSafeLtv: string | undefined;

  txFee: u<Luna<Big>> | undefined;

  availablePost: boolean;
}

export interface BorrowLoopFormAsyncStates {}

export const borrowLoopForm = ({
  userLunaBalance,
  oraclePrices,
  connected,
  borrowRate,
  blocksPerYear,
}: BorrowLoopFormDependency) => {
  const apr = computeBorrowAPR(borrowRate, blocksPerYear);

  return ({
    collateral,
    collateralAmount,
    maxCollateralAmount,
    targetLeverage,
    maximumLTV,
    estimatedFee,
  }: BorrowLoopFormInput): FormReturn<
    BorrowLoopFormStates,
    BorrowLoopFormAsyncStates
  > => {
    // txFee
    const txFee = (() => {
      if (!connected) {
        return undefined;
      }
      return big(estimatedFee?.txFee ?? "0") as u<Luna<Big>>;
    })();

    const invalidTxFee = (() => {
      return connected && txFee && big(userLunaBalance).lt(txFee)
        ? "Not enough transaction fees"
        : undefined;
    })();

    // We suppose here that the user has no coins in Anchor Protocol and that they want to enter with
    // collateralAmount collateral and loop up to a leverage of targetLeverage

    // First we compute the maximum leverage they can get (by looping MAX_LOOPS) times
    const parsedMaximumLTV = parseFloat(maximumLTV);
    const invalidLTV =
      parsedMaximumLTV >= ANCHOR_DANGER_RATIO || parsedMaximumLTV <= 0
        ? `LTV should between 0 and ${formatRate(ANCHOR_DANGER_RATIO)}%.`
        : undefined;
    const warningOverSafeLtv =
      parsedMaximumLTV >= ANCHOR_SAFE_RATIO
        ? "WARNING: Are you sure you want to borrow above the recommended borrow usage? Crypto markets can be very volatile and you may be subject to liquidation in events of downward price swings of the aAsset."
        : undefined;

    let minimumLeverage = 1;
    let maximumLeverage = 1;
    const actualMaximumLTV =
      parsedMaximumLTV * parseFloat(collateral?.max_ltv ?? "0");
    console.log(actualMaximumLTV, collateral?.max_ltv);
    if (!invalidLTV) {
      maximumLeverage =
        (1 - Math.pow(actualMaximumLTV, MAX_LOOPS)) / (1 - actualMaximumLTV);
    }

    // We must also check that the last borrow amount is not < 1 in decimal units (assuming 6 decimals here)
    const ratioToOne = big(10)
      .pow(-6)
      .div(
        !collateralAmount ||
          collateralAmount.length === 0 ||
          big(collateralAmount).eq(0)
          ? big(10).pow(-6)
          : collateralAmount
      );
    const maxLeverageRelativeToAmount =
      Math.log(ratioToOne.toNumber()) / Math.log(actualMaximumLTV);
    console.log("new leverage loop number", maxLeverageRelativeToAmount);

    // Then we check the target Leverage, it should be between 1 and maximumLeverage
    const parsedTargetLeverage = parseFloat(targetLeverage);
    const invalidLeverage =
      parsedTargetLeverage >= maximumLeverage || parsedTargetLeverage <= 1
        ? "Leverage should be between 1 and the maximum leverage"
        : undefined;
    let numberOfLoops = 0;
    if (!invalidLeverage && !invalidLTV) {
      numberOfLoops = Math.floor(
        Math.log(1 - (1 - actualMaximumLTV) * parsedTargetLeverage) /
          Math.log(actualMaximumLTV)
      );
    }

    const invalidLoopNumber =
      numberOfLoops > MAX_LOOPS
        ? `You can't loop more than ${MAX_LOOPS} times`
        : undefined;

    // Now we validate the collateral amount
    const collateralBalance = maxCollateralAmount ?? "0";

    let invalidCollateralAmount = undefined;
    if (!collateralAmount || collateralAmount.length === 0) {
    } else if (microfy(collateralAmount).gt(collateralBalance)) {
      invalidCollateralAmount = `Not enough assets`;
    }

    const currentCollateralPrice =
      collateral && oraclePrices
        ? parseFloat(
            oraclePrices.prices.find(
              (price) => price.asset == collateral.collateral_token
            )?.price ?? "0"
          )
        : undefined;

    const estimatedLiquidationPrice =
      actualMaximumLTV && currentCollateralPrice
        ? currentCollateralPrice / actualMaximumLTV
        : null;

    const availablePost =
      connected &&
      collateralAmount != undefined &&
      collateralAmount.length > 0 &&
      !invalidTxFee &&
      !invalidLTV &&
      !invalidLeverage &&
      !invalidCollateralAmount;

    return [
      {
        numberOfLoops,
        estimatedLiquidationPrice,
        userMaxLtv: ANCHOR_DANGER_RATIO,

        invalidTxFee,
        invalidLTV,
        invalidLeverage,
        invalidCollateralAmount,
        invalidLoopNumber,
        warningOverSafeLtv,

        txFee,

        collateral,
        collateralAmount,
        maxCollateralAmount,
        targetLeverage,
        minimumLeverage,
        maximumLeverage,
        maximumLTV,
        actualMaximumLTV,
        estimatedFee,

        apr,

        availablePost,
      },
      undefined,
    ];
  };
};
