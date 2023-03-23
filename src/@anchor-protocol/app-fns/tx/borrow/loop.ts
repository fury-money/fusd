import { AnchorContractAddress } from "@anchor-protocol/app-provider";
import { bAsset, CollateralAmount } from "@anchor-protocol/types";
import { CW20Addr, HumanAddr, Token, u, UST } from "@libs/types";
import { Coin, Coins, MsgExecuteContract } from "@terra-money/terra.js";
import { WhitelistWrappedCollateral } from "queries";
import big, { Big } from "big.js";
import { getWrappedCollateralMessages } from "./provideWrappedCollateral";
import { demicrofy, formatTokenInput, microfy } from "@libs/formatter";
import { tfmEstimation } from "pages/swap/queries/tfmQueries";
import { getTFMSwapMsg } from "../swap/tfm";
import pMap from "p-map";
const SLIPPAGE = 0.02;

export function getLoopAmounts(
  collateralAmount: CollateralAmount,

  wrappedCollateralPrice: number, // The price of the collateral so that swap transactions can be done smoothly
  collateralExchangeRate: number, // The price of the collateral so that swap transactions can be done smoothly

  ltv: number,
  loopNumber: number
): {
  allLoopData: {
    provideAmount: u<Token>,
    stableAmount: u<UST>
  }[],
  finalLoopData: u<Token>
} {

  let thisDepositAmount = microfy(collateralAmount); //The actual number of tokens the user wants to deposit

  const axlUSDCNeeded = [];
  const collateralTotal = [thisDepositAmount.toString()];
  const collateralPrice = wrappedCollateralPrice * collateralExchangeRate
  // First we start by looping and getting a general quote for the total amount of axlUSDC needed
  for (let i = 0; i < loopNumber; i++) {
    // 1. Provide the collaterals that we have in the wallet to Cavern

    // 2. Borrow some stablecoin
    //  If we deposit 10 Luna at 2USD/Luna, we can borrow 10 * 2 * 0.6 = 12 USD
    const borrowAmount = thisDepositAmount
      .mul(collateralPrice)
      .mul(ltv) as Token<Big>;
    axlUSDCNeeded.push(borrowAmount.toString());

    // 3. Swap back to the collateral token
    thisDepositAmount = borrowAmount.div(collateralPrice) as u<CollateralAmount<Big>>;
    collateralTotal.push(thisDepositAmount.toString());
  }

  return {
    allLoopData: axlUSDCNeeded.map((usd, i) => ({
      provideAmount: collateralTotal[i] as u<Token>,
      stableAmount: usd as u<UST>
    })),
    finalLoopData: collateralTotal[collateralTotal.length - 1] as u<Token>
  }
}


// Now with axlUSDC amounts, we can generate the call objects at each step

export async function getLoopMessages(
  contracts: AnchorContractAddress,
  collateral: WhitelistWrappedCollateral,
  walletAddr: HumanAddr,
  collateralAmount: CollateralAmount,

  collateralExchangeRate: number, 

  allLoopData: {
    provideAmount: u<Token>,
    stableAmount: u<UST>
  }[]
): Promise<MsgExecuteContract[]>{

  const loopMessages = (await pMap(allLoopData, async ({provideAmount, stableAmount}, i)=> {
    // 1. Provide the collaterals that we have in the wallet
    const provideMsgs = getWrappedCollateralMessages(
      walletAddr,
      demicrofy(big(provideAmount).round() as u<Token<Big>>).toString() as bAsset,
      big(provideAmount).mul(collateralExchangeRate).round().minus(1).toString() as u<bAsset>,
      collateral.info.info.tokenAddress as CW20Addr,
      collateral.collateral_token,
      collateral.custody_contract,
      contracts.moneyMarket.overseer,
      collateral.decimals
    );

    // 2. Borrow some stablecoin
    const borrowMsg = [
      new MsgExecuteContract(walletAddr, contracts.moneyMarket.market, {
        // @see https://github.com/Anchor-Protocol/money-market-contracts/blob/master/contracts/market/src/msg.rs#L68
        borrow_stable: {
          borrow_amount: big(stableAmount).round().toString(),
        },
      }),
    ];

    // 3. Swap back to the collateral token
    const swapEstimation = await tfmEstimation({
      tokenIn: contracts.native.usd,
      tokenOut: collateral.info.info.tokenAddress,
      amount: big(stableAmount).round().toString() as u<Token>,
      slippage: SLIPPAGE,
    });
    const swapMsg = getTFMSwapMsg(swapEstimation.swap, walletAddr);

    return [...provideMsgs, ...borrowMsg, swapMsg]; // TODO, not tested yet fully
  })).flat();

  return loopMessages;
}
