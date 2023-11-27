import {
  ANCHOR_DANGER_RATIO,
  ANCHOR_SAFE_RATIO,
  computeBorrowAPR,
} from "@anchor-protocol/app-fns";
import {
  AnchorContractAddress,
  LSDCollateralResponse,
} from "@anchor-protocol/app-provider";
import { LoopsAndMessageQueryArgs } from "@anchor-protocol/app-provider/forms/borrow/loop";
import { CollateralAmount, moneyMarket, Rate } from "@anchor-protocol/types";
import { formatRate, microfy } from "@libs/formatter";
import { Denom, HumanAddr, Luna, Token, u, UST } from "@libs/types";
import { FormReturn } from "@libs/use-form";
import { MsgExecuteContract } from "@terra-money/feather.js";
import big, { Big } from "big.js";
import { SwapSimulationAndSwapResponse } from "pages/swap/queries/tfmQueries";
import { WhitelistWrappedCollateral } from "queries";

export const MAX_LOOPS = 10;
export const MIN_SWAP_AMOUNT = 0.1;
export const TFM_ESTIMATION_BUFFER = 1.1;

export interface BorrowLoopFormInput {
  collateral: WhitelistWrappedCollateral | undefined;
  collateralAmount?: CollateralAmount;
  maxCollateralAmount?: CollateralAmount;
  targetLeverage: Rate;
  minimumLeverage: number;
  maximumLeverage: number;
  maximumLTV: Rate;
  slippage: Rate;
}

export interface BorrowLoopFormDependency {
  oraclePrices: moneyMarket.oracle.PricesResponse | undefined;
  lsdHubStates: LSDCollateralResponse | undefined;
  connected: boolean;
  terraWalletAddress: HumanAddr | undefined;

  contractAddress: AnchorContractAddress;

  borrowRate: moneyMarket.interestModel.BorrowRateResponse | undefined;
  stableDenom: Denom;
  blocksPerYear: number;

  getLoopsAndMessages: (
    l: LoopsAndMessageQueryArgs
  ) => Promise<Partial<BorrowLoopFormAsyncStates>> | undefined;
}

export interface BorrowLoopFormStates extends BorrowLoopFormInput {
  numberOfLoops: number;
  estimatedLiquidationPrice: number | null;

  userMaxLtv: number;
  actualMaximumLTV: number;
  apr: Rate<Big>;

  invalidLTV: string | undefined;
  invalidLeverage: string | undefined;
  invalidCollateralAmount: string | undefined;
  invalidLoopNumber: string | undefined;
  warningOverSafeLtv: string | undefined;

  availablePost: boolean;
}

export interface BorrowLoopFormAsyncStates {
  swapSimulation: SwapSimulationAndSwapResponse | undefined;
  allLoopData: {
    provideAmount: u<Token>;
    stableAmount: u<UST>;
  }[];
  finalLoopData: u<Token>;
  executeMsgs: MsgExecuteContract[];
  loopError: string | undefined;
}

export const borrowLoopForm = ({
  oraclePrices,
  lsdHubStates,

  connected,
  terraWalletAddress,

  contractAddress,

  borrowRate,
  stableDenom,
  blocksPerYear,

  getLoopsAndMessages,
}: BorrowLoopFormDependency) => {
  const apr = computeBorrowAPR(borrowRate, blocksPerYear);

  return ({
    collateral,
    collateralAmount,
    maxCollateralAmount,
    targetLeverage,
    maximumLTV,
    slippage,
  }: BorrowLoopFormInput): FormReturn<
    BorrowLoopFormStates,
    Partial<BorrowLoopFormAsyncStates>
  > => {
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

    if (!invalidLTV) {
      maximumLeverage =
        (1 - Math.pow(actualMaximumLTV, MAX_LOOPS)) / (1 - actualMaximumLTV);
    }

    // We must also check that the last borrow amount is not < 1 in decimal units (assuming 6 decimals here)
    const ratioToOne =
      MIN_SWAP_AMOUNT /
      (!collateralAmount ||
      collateralAmount.length === 0 ||
      big(collateralAmount).eq(0)
        ? MIN_SWAP_AMOUNT
        : parseFloat(collateralAmount));
    const maxLeverageRelativeToAmount =
      (1 - actualMaximumLTV * ratioToOne) / (1 - actualMaximumLTV);
    maximumLeverage = Math.min(maximumLeverage, maxLeverageRelativeToAmount);

    // Then we check the target Leverage, it should be between 1 and maximumLeverage
    const parsedTargetLeverage = parseFloat(targetLeverage);
    const invalidLeverage =
      parsedTargetLeverage > maximumLeverage || parsedTargetLeverage <= 1
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
      !invalidLTV &&
      !invalidLeverage &&
      !invalidCollateralAmount;

    // Computing the asyncStates (swaps simulation and swapAmounts)

    const asyncStates = getLoopsAndMessages({
      collateral,
      collateralAmount,
      targetLeverage,
      actualMaximumLTV,
      numberOfLoops,
    });

    return [
      {
        numberOfLoops,
        estimatedLiquidationPrice,
        userMaxLtv: ANCHOR_DANGER_RATIO,

        invalidLTV,
        invalidLeverage,
        invalidCollateralAmount,
        invalidLoopNumber,
        warningOverSafeLtv,

        collateral,
        collateralAmount,
        maxCollateralAmount,
        targetLeverage,
        minimumLeverage,
        maximumLeverage,
        maximumLTV,
        actualMaximumLTV,
        slippage,

        apr,

        availablePost,
      },
      asyncStates,
    ];
  };
};
