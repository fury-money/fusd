import { placeLiquidationBidTx } from '@anchor-protocol/app-fns/tx/liquidate/deposit';
import { UST } from '@anchor-protocol/types';
import { EstimatedFee, useRefetchQueries } from '@libs/app-provider';
import { useStream } from '@rx-stream/react';
import { useConnectedWallet } from '@terra-money/wallet-provider';
import { useCallback } from 'react';
import { useAnchorWebapp } from '../../contexts/context';
import { ANCHOR_TX_KEY } from '../../env';

export interface PlaceLiquidationBidTxParams {
  depositAmount: UST;
  premium: number;
  txFee: EstimatedFee;
  onTxSucceed?: () => void;
}

export function usePlaceLiquidationBidTx() {
  const connectedWallet = useConnectedWallet();

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
      if (!connectedWallet || !connectedWallet.availablePost) {
        throw new Error('Can not post!');
      }

      return placeLiquidationBidTx({
        // fabricateMarketDepositStableCoin
        walletAddr: connectedWallet.walletAddress,
        liquidationQueueAddr:
          contractAddress.liquidation.liquidationQueueContract,
        bLunaAddr: contractAddress.cw20.bLuna,
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
          refetchQueries(ANCHOR_TX_KEY.EARN_DEPOSIT);
        },
      });
    },
    [
      connectedWallet,
      contractAddress.liquidation.liquidationQueueContract,
      contractAddress.cw20.bLuna,
      contractAddress.native.usd,
      constants.gasAdjustment,
      queryClient,
      txErrorReporter,
      refetchQueries,
    ],
  );

  const streamReturn = useStream(stream);

  return connectedWallet ? streamReturn : [null, null];
}
