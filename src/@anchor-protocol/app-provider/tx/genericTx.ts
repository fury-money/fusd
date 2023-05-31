import {
  EstimatedFee,
  useFixedFee,
  useRefetchQueries,
} from "@libs/app-provider";
import { useStream } from "@rx-stream/react";
import { useConnectedWallet } from "@terra-money/wallet-provider";
import { useCallback } from "react";
import { useAccount } from "contexts/account";
import { useAnchorWebapp } from "../contexts/context";
import { ANCHOR_TX_KEY } from "../env";
import { MsgExecuteContract } from "@terra-money/terra.js";
import { genericTx } from "@anchor-protocol/app-fns/tx/genericTx";

export interface GenericTxParams {
  msgs: MsgExecuteContract[];
  txFee: EstimatedFee;
}

export function useGenericTx() {
  const { availablePost, connected, terraWalletAddress } = useAccount();

  const connectedWallet = useConnectedWallet();

  const { txErrorReporter, constants, queryClient } = useAnchorWebapp();

  const refetchQueries = useRefetchQueries();

  const fixedFee = useFixedFee();

  const stream = useCallback(
    ({ msgs, txFee }: GenericTxParams) => {
      if (
        !availablePost ||
        !connected ||
        !connectedWallet ||
        !terraWalletAddress
      ) {
        throw new Error("Can not post!");
      }

      return genericTx({
        msgs,
        // post
        network: connectedWallet.network,
        post: connectedWallet.post,
        queryClient: queryClient!,
        txFee: txFee.txFee,
        gasFee: txFee.gasWanted,
        gasAdjustment: constants.gasAdjustment,
        // error
        txErrorReporter,
        // side effect
        onTxSucceed: () => {
          refetchQueries(ANCHOR_TX_KEY.BORROW_BORROW);
        },
      });
    },
    [
      availablePost,
      connected,
      connectedWallet,
      fixedFee,
      refetchQueries,
      terraWalletAddress,
      constants.gasAdjustment,
      txErrorReporter,
    ]
  );

  const streamReturn = useStream(stream);

  return connectedWallet ? streamReturn : [null, null];
}
