import { bAssetClaimTx } from '@anchor-protocol/app-fns';
import { EstimatedFee, useFixedFee, useRefetchQueries } from '@libs/app-provider';
import { useStream } from '@rx-stream/react';
import { useConnectedWallet } from '@terra-money/wallet-provider';
import { RewardBreakdown } from 'pages/basset/hooks/useRewardsBreakdown';
import { useCallback } from 'react';
import { useAnchorWebapp } from '../../contexts/context';
import { ANCHOR_TX_KEY } from '../../env';

export interface BAssetClaimTxParams {
  rewardBreakdowns: RewardBreakdown[];
  onTxSucceed?: () => void;
  estimatedFee: EstimatedFee;
}

export function useBAssetClaimTx() {
  //const { availablePost, connected, terraWalletAddress } = useAccount();

  const connectedWallet = useConnectedWallet();

  const { queryClient, txErrorReporter, constants } = useAnchorWebapp();

  const refetchQueries = useRefetchQueries();

  const stream = useCallback(
    ({ onTxSucceed, rewardBreakdowns, estimatedFee }: BAssetClaimTxParams) => {
      if (!connectedWallet || !connectedWallet.availablePost) {
        throw new Error('Can not post!');
      }

      return bAssetClaimTx({
        // fabricatebAssetClaimRewards
        walletAddr: connectedWallet.walletAddress,
        rewardBreakdowns,
        // post
        network: connectedWallet.network,
        post: connectedWallet.post,
        fixedGas: estimatedFee.txFee,
        gasFee: estimatedFee.gasWanted,
        gasAdjustment: constants.gasAdjustment,
        // query
        queryClient,
        // error
        txErrorReporter,
        // side effect
        onTxSucceed: () => {
          onTxSucceed?.();
          refetchQueries(ANCHOR_TX_KEY.BOND_CLAIM);
        },
      });
    },
    [
      connectedWallet,
      constants.gasAdjustment,
      queryClient,
      txErrorReporter,
      refetchQueries,
    ],
  );

  const streamReturn = useStream(stream);

  return connectedWallet ? streamReturn : [null, null];
}
