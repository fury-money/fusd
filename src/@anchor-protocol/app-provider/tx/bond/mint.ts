import { bondMintTx } from "@anchor-protocol/app-fns";
import { Gas, Luna, Rate, u, UST } from "@anchor-protocol/types";
import { useRefetchQueries } from "@libs/app-provider";
import { useStream } from "@rx-stream/react";
import { useCallback } from "react";
import { useAccount } from "contexts/account";
import { useAnchorWebapp } from "../../contexts/context";
import { ANCHOR_TX_KEY } from "../../env";

export interface BondMintTxParams {
  bondAmount: Luna;
  gasWanted: Gas;
  txFee: u<UST>;
  exchangeRate: Rate<string>;
  onTxSucceed?: () => void;
}

export function useBondMintTx() {
  const { availablePost, connected, terraWalletAddress } = useAccount();

  const connectedWallet = useAccount();

  const { queryClient, txErrorReporter, contractAddress, constants } =
    useAnchorWebapp();

  const refetchQueries = useRefetchQueries();

  const stream = useCallback(
    ({
      bondAmount,
      gasWanted,
      txFee,
      exchangeRate,
      onTxSucceed,
    }: BondMintTxParams) => {
      if (
        !connected ||
        !availablePost ||
        !terraWalletAddress ||
        !connectedWallet ||
        !queryClient
      ) {
        throw new Error("Can not post!");
      }

      return bondMintTx({
        // fabricatebAssetBond
        bondAmount,
        walletAddr: terraWalletAddress,
        bAssetHubAddr: contractAddress.aluna.hub,
        // post
        network: connectedWallet.network,
        post: connectedWallet.post,
        fixedGas: txFee,
        exchangeRate,
        gasFee: gasWanted,
        gasAdjustment: constants.gasAdjustment,
        // query
        queryClient,
        // error
        txErrorReporter,
        // side effect
        onTxSucceed: () => {
          onTxSucceed?.();
          refetchQueries(ANCHOR_TX_KEY.BOND_MINT);
        },
      });
    },
    [
      availablePost,
      connected,
      connectedWallet,
      contractAddress.aluna.hub,
      terraWalletAddress,
      constants.gasAdjustment,
      queryClient,
      txErrorReporter,
      refetchQueries,
    ]
  );

  const streamReturn = useStream(stream);

  return connectedWallet ? streamReturn : [null, null];
}
