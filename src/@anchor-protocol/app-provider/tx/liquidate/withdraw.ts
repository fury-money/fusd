import { withdrawLiquidationBidTx } from '@anchor-protocol/app-fns/tx/liquidate/withdraw';
import { EstimatedFee, useRefetchQueries } from '@libs/app-provider';
import { useStream } from '@rx-stream/react';
import { useConnectedWallet } from '@terra-money/wallet-provider';
import { useCallback } from 'react';
import { useAnchorWebapp } from '../../contexts/context';
import { ANCHOR_TX_KEY } from '../../env';

export interface WithdrawLiquidationBidTxParams {
  bid_idx: string;
  estimatedFee: EstimatedFee;
  onTxSucceed?: () => void;
}

export function useWithdrawLiquidationBidTx() {
  const connectedWallet = useConnectedWallet();

  const { constants, txErrorReporter, queryClient, contractAddress } =
    useAnchorWebapp();

  const refetchQueries = useRefetchQueries();

  const stream = useCallback(
    ({
      bid_idx,
      onTxSucceed,
      estimatedFee,
    }: WithdrawLiquidationBidTxParams) => {
      if (!connectedWallet || !connectedWallet.availablePost || !queryClient) {
        throw new Error('Can not post!');
      }

      return withdrawLiquidationBidTx({
        // fabricateMarketDepositStableCoin
        walletAddr: connectedWallet.walletAddress,
        liquidationQueueAddr:
          contractAddress.liquidation.liquidationQueueContract,
        aLunaAddr: contractAddress.cw20.aLuna,
        bid_idx,
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
          refetchQueries(ANCHOR_TX_KEY.LIQUIDATION_WITHDRAW);
        },
      });
    },
    [
      connectedWallet,
      contractAddress.liquidation.liquidationQueueContract,
      contractAddress.cw20.aLuna,
      constants.gasAdjustment,
      queryClient,
      txErrorReporter,
      refetchQueries,
    ],
  );

  const streamReturn = useStream(stream);

  return connectedWallet ? streamReturn : [null, null];
}
