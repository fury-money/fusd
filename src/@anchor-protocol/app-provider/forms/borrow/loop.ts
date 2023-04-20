import { BorrowLoopFormAsyncStates, TFM_ESTIMATION_BUFFER, borrowLoopForm } from "@anchor-protocol/app-fns";
import { SLIPPAGE, getLoopAmountsAndMessages } from "@anchor-protocol/app-fns/tx/borrow/loop";
import {
  useAnchorWebapp,
  useLSDCollateralQuery,
} from "@anchor-protocol/app-provider";
import { CollateralAmount } from "@anchor-protocol/types";
import { Rate, Token, u } from "@libs/types";
import { useForm } from "@libs/use-form";
import { useAccount } from "contexts/account";
import { WhitelistWrappedCollateral } from "queries";
import { useBorrowMarketQuery } from "../../queries/borrow/market";
import throttle from 'lodash.throttle';
import { tfmEstimation } from "pages/swap/queries/tfmQueries";
import { useMemo } from "react";
import { microfy } from "@libs/formatter";
import Big from "big.js";


export interface LoopsAndMessageQueryArgs {
  collateral: WhitelistWrappedCollateral | undefined
  collateralAmount: CollateralAmount | undefined,
  targetLeverage: Rate,
  actualMaximumLTV: number,
  numberOfLoops: number
}

export function useBorrowLoopForm() {

  const { connected, terraWalletAddress } = useAccount();

  const {
    constants: { blocksPerYear }, contractAddress
  } = useAnchorWebapp();

  const { data: { borrowRate, oraclePrices } = { data: undefined } } =
    useBorrowMarketQuery();

  const lsdHubStates = useLSDCollateralQuery();


   const emptyAsyncStates: Promise<Partial<BorrowLoopFormAsyncStates>> = useMemo(() => new Promise((resolve) => resolve({
        swapSimulation:undefined,
        allLoopData:undefined,
        finalLoopData:undefined,
        executeMsgs:undefined,
      })), []);

  const getLoopsAndMessages = useMemo(() => {
    console.log("creating debonce ?")
    return throttle(async ({
      collateral,
      collateralAmount,
      targetLeverage,
      actualMaximumLTV,
      numberOfLoops
    }: LoopsAndMessageQueryArgs) => {
      if(!collateralAmount || collateralAmount.length == 0){
        return emptyAsyncStates;
      }

      if(!oraclePrices || !collateral?.info?.info?.tokenAddress || ! lsdHubStates || !terraWalletAddress){
        return emptyAsyncStates
      }
      const rawCollateralPrice = parseFloat(oraclePrices.prices.find((price) => price.asset == collateral.collateral_token)?.price ?? "1");
      const collateralExchangeRate = parseFloat(lsdHubStates.find((state) => state.info.token == collateral.info.token)?.additionalInfo?.hubState.exchange_rate ?? "1");

      // In an async call we get an quote price approximation  
      const totalBorrowAmount = microfy(Big(collateralAmount)
        .mul(targetLeverage)
        .mul(actualMaximumLTV)
        .mul(rawCollateralPrice)
        .mul(collateralExchangeRate)
        .mul(TFM_ESTIMATION_BUFFER) as Token<Big>
      ).round();

      if(totalBorrowAmount.lte(0)){
        return emptyAsyncStates;
      }

      const estimation = await tfmEstimation({
          tokenIn: contractAddress.native.usd,
          tokenOut: collateral.info.info.tokenAddress,
          amount: totalBorrowAmount.toString() as u<Token>,
          slippage: SLIPPAGE,
          useSplit: false
      });
      // We get the loop amounts and messages
      const {
          allLoopData, finalLoopData, executeMsgs, error
      } = getLoopAmountsAndMessages(
          terraWalletAddress,
          contractAddress,

          collateral,
          collateralAmount,
          rawCollateralPrice,
          collateralExchangeRate,

          actualMaximumLTV,
          numberOfLoops,
          targetLeverage,

          estimation
      );
      return {
          swapSimulation: estimation,
          allLoopData,
          finalLoopData,
          executeMsgs,
          loopError: error
      };
    }, 1000);
  }, [emptyAsyncStates, oraclePrices, lsdHubStates, terraWalletAddress, contractAddress, contractAddress.native.usd]);

  return useForm(
    borrowLoopForm,
    {
      contractAddress,
      connected,
      terraWalletAddress,
      oraclePrices,
      lsdHubStates,

      borrowRate,
      stableDenom: contractAddress.native.usd,
      blocksPerYear,

      getLoopsAndMessages
    },
    () => ({
      collateral: undefined as WhitelistWrappedCollateral | undefined,
      collateralAmount: "" as CollateralAmount,
      maxCollateralAmount: undefined as CollateralAmount | undefined,
      targetLeverage: "1" as Rate,
      maximumLTV: "0" as Rate,
      slippage: SLIPPAGE.toString() as Rate,
      minimumLeverage: 0,
      maximumLeverage: 0,
    })
  );
}
