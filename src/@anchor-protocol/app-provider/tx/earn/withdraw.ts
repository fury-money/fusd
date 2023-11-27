import { earnWithdrawTx } from "@anchor-protocol/app-fns";
import { HumanAddr, aUST } from "@anchor-protocol/types";
import { EstimatedFee, useRefetchQueries } from "@libs/app-provider";
import { useStream } from "@rx-stream/react";
import { useConnectedWallet } from "@terra-money/wallet-kit";
import { useCallback } from "react";
import { useAnchorWebapp } from "../../contexts/context";
import { ANCHOR_TX_KEY } from "../../env";
import { useAccount } from "contexts/account";

export interface EarnWithdrawTxParams {
  withdrawAmount: aUST;
  txFee: EstimatedFee;
  onTxSucceed?: () => void;
}

export function useEarnWithdrawTx() {
  const connectedWallet = useAccount();

  const { constants, queryClient, txErrorReporter, contractAddress } =
    useAnchorWebapp();

  const refetchQueries = useRefetchQueries();

  const stream = useCallback(
    ({ withdrawAmount, txFee, onTxSucceed }: EarnWithdrawTxParams) => {
      if (!connectedWallet || !connectedWallet.availablePost || !queryClient) {
        throw new Error("Can not post!");
      }

      return earnWithdrawTx({
        // fabricateMarketReedeemStableCoin
        walletAddr: connectedWallet.terraWalletAddress as HumanAddr,
        withdrawAmount,
        marketAddr: contractAddress.moneyMarket.market,
        aUstTokenAddr: contractAddress.cw20.aUST,
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
          refetchQueries(ANCHOR_TX_KEY.EARN_WITHDRAW);
        },
      });
    },
    [
      connectedWallet,
      contractAddress.moneyMarket.market,
      contractAddress.cw20.aUST,
      constants.gasAdjustment,
      queryClient,
      txErrorReporter,
      refetchQueries,
    ]
  );

  const streamReturn = useStream(stream);

  return connectedWallet ? streamReturn : [null, null];
}
