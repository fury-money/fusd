import { liquidationWithdrawCollateralTx } from '@anchor-protocol/app-fns/tx/liquidate/collateral';
import { EstimatedFee, useRefetchQueries } from '@libs/app-provider';
import { useStream } from '@rx-stream/react';
import { useConnectedWallet } from '@terra-money/wallet-provider';
import { WhitelistCollateral } from 'queries';
import { useCallback } from 'react';
import { useAnchorWebapp } from '../../contexts/context';
import { ANCHOR_TX_KEY } from '../../env';

export interface LiquidationWithdrawCollateralTxParams {
  txFee: EstimatedFee;
  onTxSucceed?: () => void;
}

export function useLiquidationWithdrawCollateralTx(
  collateral: WhitelistCollateral | undefined
) {
  const connectedWallet = useConnectedWallet();

  const { constants, txErrorReporter, queryClient, contractAddress } =
    useAnchorWebapp();

  const refetchQueries = useRefetchQueries();

  const stream = useCallback(
    ({ txFee, onTxSucceed }: LiquidationWithdrawCollateralTxParams) => {
      if (!connectedWallet || !connectedWallet.availablePost || !collateral) {
        throw new Error('Can not post!');
      }

      return liquidationWithdrawCollateralTx({
        // fabricateMarketDepositStableCoin
        walletAddr: connectedWallet.walletAddress,
        liquidationQueueAddr: contractAddress.liquidation.liquidationQueueContract,
        collateralAddr: collateral.collateral_token,
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
          refetchQueries(ANCHOR_TX_KEY.LIQUIDATION_WITHDRAW_COLLATERAL);
        },
      });
    },
    [
      connectedWallet,
      contractAddress.liquidation.liquidationQueueContract,
      collateral,
      constants.gasAdjustment,
      queryClient,
      txErrorReporter,
      refetchQueries,
    ],
  );

  const streamReturn = useStream(stream);

  return connectedWallet ? streamReturn : [null, null];
}
