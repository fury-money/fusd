import { borrowLoopForm } from "@anchor-protocol/app-fns";
import {
  BorrowMarketWithDisplay,
  useAnchorBank,
  useAnchorWebapp,
  useDeploymentTarget,
} from "@anchor-protocol/app-provider";
import { CollateralAmount } from "@anchor-protocol/types";
import { useFixedFee } from "@libs/app-provider";
import { Rate, UST } from "@libs/types";
import { useForm } from "@libs/use-form";
import { useAccount } from "contexts/account";
import { WhitelistWrappedCollateral } from "queries";
import { useBorrowMarketQuery } from "../../queries/borrow/market";

export function useBorrowLoopForm() {
  const { target } = useDeploymentTarget();

  const { connected } = useAccount();

  const fixedFee = useFixedFee();

  const {
    constants: { blocksPerYear },
  } = useAnchorWebapp();

  const {
    tokenBalances: { uLuna },
  } = useAnchorBank();

  const { data: { borrowRate, oraclePrices } = { data: undefined } } =
    useBorrowMarketQuery();

  return useForm(
    borrowLoopForm,
    {
      userLunaBalance: uLuna,
      connected,
      oraclePrices,
      borrowRate,
      blocksPerYear,
    },
    () => ({
      collateral: undefined as WhitelistWrappedCollateral | undefined,
      collateralAmount: "" as CollateralAmount,
      maxCollateralAmount: undefined as CollateralAmount | undefined,
      targetLeverage: "1" as Rate,
      maximumLTV: "0" as Rate,
      estimatedFee: undefined,
      minimumLeverage: 0,
      maximumLeverage: 0,
    })
  );
}
