import { rewardsAncUstLpClaimTx } from "@anchor-protocol/app-fns";
import { useFixedFee, useRefetchQueries } from "@libs/app-provider";
import { useStream } from "@rx-stream/react";
import { useConnectedWallet } from "@terra-money/wallet-kit";
import { useCallback } from "react";
import { useAccount } from "contexts/account";
import { useAnchorWebapp } from "../../contexts/context";
import { ANCHOR_TX_KEY } from "../../env";
import { HumanAddr } from "@libs/types";

export interface RewardsAncUstLpClaimTxParams {
  onTxSucceed?: () => void;
}

export function useRewardsAncUstLpClaimTx() {
  const { availablePost, connected } = useAccount();

  const connectedWallet = useAccount();

  const { queryClient, txErrorReporter, contractAddress, constants } =
    useAnchorWebapp();

  const refetchQueries = useRefetchQueries();

  const fixedFee = useFixedFee();

  const stream = useCallback(
    ({ onTxSucceed }: RewardsAncUstLpClaimTxParams) => {
      if (!availablePost || !connected || !connectedWallet || !queryClient) {
        throw new Error("Can not post!");
      }

      return rewardsAncUstLpClaimTx({
        walletAddr: connectedWallet.terraWalletAddress as HumanAddr,
        lpTokenAddr: contractAddress.cw20.AncUstLP,
        generatorAddr: contractAddress.astroport.generator,
        // post
        network: connectedWallet.network,
        post: connectedWallet.post,
        fixedGas: fixedFee,
        gasFee: constants.gasWanted,
        gasAdjustment: constants.gasAdjustment,
        // query
        queryClient,
        // error
        txErrorReporter,
        // side effect
        onTxSucceed: () => {
          onTxSucceed?.();
          refetchQueries(ANCHOR_TX_KEY.REWARDS_ANC_UST_LP_CLAIM);
        },
      });
    },
    [
      availablePost,
      connected,
      connectedWallet,
      contractAddress.cw20.AncUstLP,
      contractAddress.astroport.generator,
      fixedFee,
      constants.gasWanted,
      constants.gasAdjustment,
      queryClient,
      txErrorReporter,
      refetchQueries,
    ]
  );

  const streamReturn = useStream(stream);

  return connectedWallet ? streamReturn : [null, null];
}
