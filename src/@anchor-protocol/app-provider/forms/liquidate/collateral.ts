import {
  liquidationWithdrawCollateralForm,
  LiquidationWithdrawCollateralFormStates,
} from "@anchor-protocol/app-fns/forms/liquidate/collateral";
import { useAnchorBank } from "@anchor-protocol/app-provider/hooks/useAnchorBank";
import { defaultFee } from "@libs/app-provider";
import { useForm } from "@libs/use-form";
import { useAccount } from "contexts/account";
import { useCallback } from "react";
import { WhitelistCollateral } from "queries";

export interface LiquidationWithdrawCollateralFormReturn
  extends LiquidationWithdrawCollateralFormStates {
  updateWithdrawLpAssets: (a: boolean) => void;
}

export function useLiquidationWithdrawCollateralForm(): LiquidationWithdrawCollateralFormReturn {
  const { connected } = useAccount();

  const {
    tokenBalances: { uLuna },
  } = useAnchorBank();

  const [input, states] = useForm(
    liquidationWithdrawCollateralForm,
    {
      isConnected: connected,
      userULunaBalance: uLuna,
    },
    () => ({
      withdrawLpAssets: true,
      estimatedFee: defaultFee(),
    })
  );

  const updateWithdrawLpAssets = useCallback(
    (withdrawLpAssets: boolean) => {
      input({
        withdrawLpAssets,
      });
    },
    [input]
  );

  return {
    ...states,
    updateWithdrawLpAssets,
  };
}
