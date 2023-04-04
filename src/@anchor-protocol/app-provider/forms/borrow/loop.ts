import { borrowLoopForm } from "@anchor-protocol/app-fns";
import { SLIPPAGE } from "@anchor-protocol/app-fns/tx/borrow/loop";
import {
  useAnchorBank,
  useAnchorWebapp,
  useLSDCollateralQuery,
} from "@anchor-protocol/app-provider";
import { CollateralAmount } from "@anchor-protocol/types";
import { Rate } from "@libs/types";
import { useForm } from "@libs/use-form";
import { useAccount } from "contexts/account";
import { WhitelistWrappedCollateral } from "queries";
import { useBorrowMarketQuery } from "../../queries/borrow/market";

export function useBorrowLoopForm() {

  const { connected, terraWalletAddress } = useAccount();

  const {
    constants: { blocksPerYear }, contractAddress
  } = useAnchorWebapp();

  const { data: { borrowRate, oraclePrices } = { data: undefined } } =
    useBorrowMarketQuery();

  const lsdHubStates = useLSDCollateralQuery();

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
