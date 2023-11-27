import { earnDepositTx } from "@anchor-protocol/app-fns";
import { HumanAddr, UST } from "@anchor-protocol/types";
import { EstimatedFee, useRefetchQueries } from "@libs/app-provider";
import { useStream } from "@rx-stream/react";
import { useConnectedWallet } from "@terra-money/wallet-kit";
import { useCallback } from "react";
import { useAnchorWebapp } from "../../contexts/context";
import { ANCHOR_TX_KEY } from "../../env";
import { useAccount } from "contexts/account";

export interface EarnDepositTxParams {
  depositAmount: UST;
  txFee: EstimatedFee;
  onTxSucceed?: () => void;
}

export function useEarnDepositTx() {
  const connectedWallet = useAccount();

  const { constants, txErrorReporter, queryClient, contractAddress } =
    useAnchorWebapp();

  const refetchQueries = useRefetchQueries();

  const stream = useCallback(
    ({ depositAmount, txFee, onTxSucceed }: EarnDepositTxParams) => {
      if (!connectedWallet || !connectedWallet.availablePost || !queryClient) {
        throw new Error("Can not post!");
      }

      return earnDepositTx({
        // fabricateMarketDepositStableCoin
        walletAddr: connectedWallet.terraWalletAddress as HumanAddr,
        marketAddr: contractAddress.moneyMarket.market,
        depositAmount,
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
          refetchQueries(ANCHOR_TX_KEY.EARN_DEPOSIT);
        },
      });
    },
    [
      connectedWallet,
      contractAddress.moneyMarket.market,
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
