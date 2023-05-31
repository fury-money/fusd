import { AnchorContractAddress } from "@anchor-protocol/app-provider";
import { bAsset, CollateralAmount } from "@anchor-protocol/types";
import { HumanAddr, Rate, Token, u, UST } from "@libs/types";
import { Coin, MsgExecuteContract } from "@terra-money/terra.js";
import { WhitelistWrappedCollateral } from "queries";
import big, { Big } from "big.js";
import { getWrappedCollateralMessages } from "./provideWrappedCollateral";
import { demicrofy, microfy } from "@libs/formatter";
import { SwapSimulationAndSwapResponse } from "pages/swap/queries/tfmQueries";
import { getTFMSwapMsg } from "../swap/tfm";
import _ from "lodash";

import { MIN_SWAP_AMOUNT } from "@anchor-protocol/app-fns";
export const SLIPPAGE = 0.03;

const decimalFactor = big(10).pow(6);

export function getLoopAmountsAndMessages(
  walletAddr: HumanAddr,
  contracts: AnchorContractAddress,

  collateral: WhitelistWrappedCollateral,
  collateralAmount: CollateralAmount,
  wrappedCollateralPrice: number, // The price of the collateral so that swap transactions can be done smoothly
  collateralExchangeRate: number, // The price of the collateral so that swap transactions can be done smoothly

  ltv: number,
  loopNumber: number,
  targetLeverage: Rate<string>,

  swapQuote: SwapSimulationAndSwapResponse
): Partial<{
  allLoopData: {
    provideAmount: u<Token>;
    stableAmount: u<UST>;
  }[];
  finalLoopData: u<Token>;
  executeMsgs: MsgExecuteContract[];
  error: string | undefined;
}> {
  console.log("getting loop amounts and messages");
  let thisDepositAmount = microfy(collateralAmount); //The actual number of tokens the user wants to deposit

  const axlUSDCNeeded = [];
  const collateralTotal = [thisDepositAmount.toString()];
  const collateralPrice = wrappedCollateralPrice * collateralExchangeRate;
  console.log("collateral price", collateralPrice);

  const expectedAmount =
    swapQuote.swap.value.execute_msg.execute_swap_operations.expect_amount;
  const offerAmount =
    swapQuote.swap.value.execute_msg.execute_swap_operations.offer_amount;
  const priceImpact = swapQuote.quote.price_impact;
  console.log(priceImpact);

  if (big(priceImpact).lte(0)) {
    return {
      error:
        "Initial collateral deposit is too low (TFM slippage is not positive)",
    };
  }

  let swapPoolY = big(expectedAmount).div(priceImpact);
  let swapPoolX = big(offerAmount).mul(
    big(1)
      .div(
        big(priceImpact) // Account for a negative price impact
      )
      .minus(1)
  );

  let messages: MsgExecuteContract[] = [];
  // First we start by looping and getting a general quote for the total amount of axlUSDC needed
  for (let i = 0; i < loopNumber; i++) {
    // 1. Provide the collaterals that we have in the wallet to Cavern
    const provideMsgs = getWrappedCollateralMessages(
      walletAddr,
      demicrofy(
        big(thisDepositAmount).round() as u<Token<Big>>
      ).toString() as bAsset,
      big(thisDepositAmount)
        .mul(collateralExchangeRate)
        .round()
        .minus(1)
        .toString() as u<bAsset>,
      collateral.info,
      collateral.collateral_token,
      collateral.custody_contract,
      contracts.moneyMarket.overseer,
      collateral.decimals
    );

    // 2. Borrow some stablecoin
    //  If we deposit 10 Luna at 2USD/Luna, we can borrow 10 * 2 * 0.6 = 12 USD
    const borrowAmount = thisDepositAmount
      .mul(collateralPrice)
      .mul(ltv) as Token<Big>;

    // We see how much we need to borrow
    // If it's not the last loop, we borrow as much as possible
    let borrowRatio = big(1);
    // If it's the last loop, we borrow only what we need to achieve the target leverage
    if (i + 1 == loopNumber) {
      const loopValue = big(1)
        .minus(big(ltv).pow(loopNumber))
        .div(big(1).minus(ltv));
      borrowRatio = big(targetLeverage)
        .minus(loopValue)
        .div(big(ltv).pow(loopNumber));
      // We have to make sure we swap at least MIN_SWAP_AMOUNT USDC
      if (
        borrowAmount
          .mul(borrowRatio)
          .lt(big(MIN_SWAP_AMOUNT).mul(decimalFactor))
      ) {
        borrowRatio = big(MIN_SWAP_AMOUNT).mul(decimalFactor).div(borrowAmount);
      }
    }
    const axlUSDCBorrowed = borrowAmount.mul(borrowRatio);

    const borrowMsg = [
      new MsgExecuteContract(walletAddr, contracts.moneyMarket.market, {
        // @see https://github.com/Anchor-Protocol/money-market-contracts/blob/master/contracts/market/src/msg.rs#L68
        borrow_stable: {
          borrow_amount: axlUSDCBorrowed.round().toString(),
        },
      }),
    ];
    axlUSDCNeeded.push(axlUSDCBorrowed.round().toString());

    // 3. Swap back to the collateral token
    // For that we use the swap quote result
    const toSwap = big(axlUSDCBorrowed);
    const expectedAmount = toSwap.mul(swapPoolY).div(swapPoolX.plus(toSwap));
    const minimumAmount = expectedAmount.mul(1 - SLIPPAGE);

    swapPoolY = swapPoolY.minus(expectedAmount);
    swapPoolX = swapPoolX.plus(toSwap);

    // b1 is the collateral that is left in the wallet at this stage
    collateralTotal.push(minimumAmount.round().toString());
    thisDepositAmount = minimumAmount as u<CollateralAmount<Big>>;
    // We modify the original swapQuote to fit the amounts
    const thisSwapMessage = _.cloneDeep(swapQuote.swap);
    thisSwapMessage.value.coins[0] = new Coin(
      thisSwapMessage.value.coins[0].denom,
      axlUSDCBorrowed.round().toString()
    );
    thisSwapMessage.value.execute_msg.execute_swap_operations.expect_amount =
      expectedAmount.round().toString();
    thisSwapMessage.value.execute_msg.execute_swap_operations.minimum_receive =
      minimumAmount.round().toString();
    thisSwapMessage.value.execute_msg.execute_swap_operations.offer_amount =
      axlUSDCBorrowed.round().toString();
    thisSwapMessage.value.execute_msg.execute_swap_operations.routes[0].offer_amount =
      thisSwapMessage.value.execute_msg.execute_swap_operations.offer_amount;
    const swapMsg = getTFMSwapMsg(thisSwapMessage, walletAddr);

    messages = messages.concat([...provideMsgs, ...borrowMsg, swapMsg]);
  }

  return {
    allLoopData: axlUSDCNeeded.map((usd, i) => ({
      provideAmount: collateralTotal[i] as u<Token>,
      stableAmount: usd as u<UST>,
    })),
    finalLoopData: collateralTotal[collateralTotal.length - 1] as u<Token>,
    executeMsgs: messages,
    error: undefined,
  };
}
