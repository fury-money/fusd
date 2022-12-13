import { activateLiquidationBidTx } from '@anchor-protocol/app-fns/tx/liquidate/activate';
import { EstimatedFee, useRefetchQueries } from '@libs/app-provider';
import { useStream } from '@rx-stream/react';
import { useConnectedWallet } from '@terra-money/wallet-provider';
import { useCallback } from 'react';
import { useAnchorWebapp } from '../../contexts/context';
import { ANCHOR_TX_KEY } from '../../env';

export interface ActivateLiquidationBidTxParams {
  estimatedFee: EstimatedFee;
  onTxSucceed?: () => void;
}

export function useActivateLiquidationBidTx() {
  const connectedWallet = useConnectedWallet();

  const { constants, txErrorReporter, queryClient, contractAddress } =
    useAnchorWebapp();

  const refetchQueries = useRefetchQueries();

  const stream = useCallback(
    ({ onTxSucceed, estimatedFee }: ActivateLiquidationBidTxParams) => {
      if (!connectedWallet || !connectedWallet.availablePost) {
        throw new Error('Can not post!');
      }

      return activateLiquidationBidTx({
        // fabricateMarketDepositStableCoin
        walletAddr: connectedWallet.walletAddress,
        liquidationQueueAddr:
          contractAddress.liquidation.liquidationQueueContract,
        bLunaAddr: contractAddress.cw20.bLuna,
        // post
        network: connectedWallet.network,
        post: connectedWallet.post,
        txFee: estimatedFee.txFee,
        gasFee: estimatedFee.gasWanted,
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
      contractAddress.liquidation.liquidationQueueContract,
      contractAddress.cw20.bLuna,
      constants.gasAdjustment,
      queryClient,
      txErrorReporter,
      refetchQueries,
    ],
  );

  const streamReturn = useStream(stream);

  return connectedWallet ? streamReturn : [null, null];
}
