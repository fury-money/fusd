import {
  AbortMissionCollaterals,
  abortMissionTx,
} from "@anchor-protocol/app-fns";
import { LSDLiquidationBidsResponse } from "@anchor-protocol/app-provider/queries/liquidate/allBIdsByUser";
import { aUST, HumanAddr, u, UST } from "@anchor-protocol/types";
import { EstimatedFee, useRefetchQueries } from "@libs/app-provider";
import { useStream } from "@rx-stream/react";
import { useCallback } from "react";
import { useAnchorWebapp } from "../../contexts/context";
import { ANCHOR_TX_KEY } from "../../env";
import { Big } from "big.js";
import { useAccount } from "contexts/account";

export type AbortMissionTxParams = {
  txFee: EstimatedFee;
  totalAUST: u<aUST>;
  allLiquidationBids: LSDLiquidationBidsResponse;
  borrowedValue: u<UST<Big>>;
  uaUST: u<aUST<string>>;

  onTxSucceed?: () => void;
} & AbortMissionCollaterals;

export function useAbortMissionTx() {
  const connectedWallet = useAccount();

  const { constants, txErrorReporter, queryClient, contractAddress } =
    useAnchorWebapp();

  const refetchQueries = useRefetchQueries();

  const stream = useCallback(
    ({
      txFee,
      totalAUST,
      allLiquidationBids,
      collateralsWithdrawAmount,
      allWithdrawableDefaultedCollaterals,
      borrowedValue,
      uaUST,
      onTxSucceed,
    }: AbortMissionTxParams) => {
      if (!connectedWallet || !connectedWallet.availablePost || !queryClient) {
        throw new Error("Can not post!");
      }

      return abortMissionTx({
        // fabricateMarketDepositStableCoin
        walletAddr: connectedWallet.terraWalletAddress as HumanAddr,
        totalAUST,
        contractAddress,
        allLiquidationBids,
        collateralsWithdrawAmount,
        allWithdrawableDefaultedCollaterals,
        borrowedValue,
        uaUST,

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
          refetchQueries(ANCHOR_TX_KEY.EARN_DEPOSIT);
        },
      });
    },
    [
      connectedWallet,
      queryClient,
      contractAddress,
      constants.gasAdjustment,
      txErrorReporter,
      refetchQueries,
    ]
  );

  const streamReturn = useStream(stream);

  return connectedWallet ? streamReturn : [null, null];
}
