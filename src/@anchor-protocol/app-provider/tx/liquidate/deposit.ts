import { placeLiquidationBidTx } from "@anchor-protocol/app-fns/tx/liquidate/deposit";
import { HumanAddr, UST } from "@anchor-protocol/types";
import { EstimatedFee, useRefetchQueries } from "@libs/app-provider";
import { useStream } from "@rx-stream/react";
import { WhitelistCollateral } from "queries";
import { useCallback } from "react";
import { useAnchorWebapp } from "../../contexts/context";
import { ANCHOR_TX_KEY } from "../../env";
import { useAccount } from "contexts/account";

export interface PlaceLiquidationBidTxParams {
  depositAmount: UST;
  premium: number;
  txFee: EstimatedFee;
  onTxSucceed?: () => void;
}

export function usePlaceLiquidationBidTx(
  collateral: WhitelistCollateral | undefined
) {
  const connectedWallet = useAccount();

  const { constants, txErrorReporter, queryClient, contractAddress } =
    useAnchorWebapp();

  const refetchQueries = useRefetchQueries();

  const stream = useCallback(
    ({
      depositAmount,
      premium,
      txFee,
      onTxSucceed,
    }: PlaceLiquidationBidTxParams) => {
      if (
        !connectedWallet ||
        !connectedWallet.availablePost ||
        !collateral ||
        !queryClient
      ) {
        throw new Error("Can not post!");
      }

      return placeLiquidationBidTx({
        // fabricateMarketDepositStableCoin
        walletAddr: connectedWallet.terraWalletAddress as HumanAddr,
        liquidationQueueAddr:
          contractAddress.liquidation.liquidationQueueContract,
        collateralAddr: collateral.collateral_token,
        depositAmount,
        premium,
        stableDenom: contractAddress.native.usd,
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
          refetchQueries(ANCHOR_TX_KEY.LIQUIDATION_DEPOSIT);
        },
      });
    },
    [
      connectedWallet,
      contractAddress.liquidation.liquidationQueueContract,
      collateral,
      contractAddress.native.usd,
      constants.gasAdjustment,
      queryClient,
      txErrorReporter,
      refetchQueries,
    ]
  );

  const streamReturn = useStream(stream);

  return connectedWallet ? streamReturn : [null, null];
}
