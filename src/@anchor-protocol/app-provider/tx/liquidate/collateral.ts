import { liquidationWithdrawCollateralTx } from "@anchor-protocol/app-fns/tx/liquidate/collateral";
import { EstimatedFee, useRefetchQueries } from "@libs/app-provider";
import { useStream } from "@rx-stream/react";
import { useConnectedWallet } from "@terra-money/wallet-kit";
import { CollateralInfo } from "pages/borrow/components/useCollaterals";
import { useWithdrawDefaultedCollateral } from "pages/liquidation/components/useWithdrawDefaultedCollateral";
import { useCallback } from "react";
import { useAnchorWebapp } from "../../contexts/context";
import { ANCHOR_TX_KEY } from "../../env";
import { useAccount } from "contexts/account";
import { HumanAddr } from "@libs/types";

export interface LiquidationWithdrawCollateralTxParams {
  txFee: EstimatedFee;
  withdrawLpAssets: boolean; // Wether the user wants to also withdraw the tokens from the LP
  onTxSucceed?: () => void;
}

export function useLiquidationWithdrawCollateralTx(
  collateral: CollateralInfo | undefined
) {
  const connectedWallet = useAccount();

  const { constants, txErrorReporter, queryClient, contractAddress } =
    useAnchorWebapp();

  const refetchQueries = useRefetchQueries();

  const { withdrawableLSD, withdrawableUnderlying } =
    useWithdrawDefaultedCollateral(collateral);

  const stream = useCallback(
    ({
      txFee,
      withdrawLpAssets,
      onTxSucceed,
    }: LiquidationWithdrawCollateralTxParams) => {
      if (
        !connectedWallet ||
        !connectedWallet.availablePost ||
        !collateral ||
        !queryClient ||
        !collateral.collateral.type
      ) {
        throw new Error("Can not post!");
      }

      return liquidationWithdrawCollateralTx({
        // fabricateMarketDepositStableCoin
        walletAddr: connectedWallet.terraWalletAddress as HumanAddr,
        liquidationQueueAddr:
          contractAddress.liquidation.liquidationQueueContract,
        collateral: collateral,
        withdrawableLSD,
        withdrawableUnderlying,

        withdrawLpAssets,
        // post
        network: connectedWallet.network,
        post: connectedWallet.post,
        txFee: txFee.txFee,
        gasFee: txFee.gasWanted,
        gasAdjustment: constants.gasAdjustment,
        // query
        queryClient,
        // error
        txErrorReporter,
        // side effect
        onTxSucceed: () => {
          onTxSucceed?.();
          refetchQueries(ANCHOR_TX_KEY.LIQUIDATION_WITHDRAW_COLLATERAL);
        },
      });
    },
    [
      connectedWallet,
      contractAddress.liquidation.liquidationQueueContract,
      collateral,
      constants.gasAdjustment,
      queryClient,
      txErrorReporter,
      refetchQueries,
      withdrawableLSD,
      withdrawableUnderlying,
    ]
  );

  const streamReturn = useStream(stream);

  return connectedWallet ? streamReturn : [null, null];
}
