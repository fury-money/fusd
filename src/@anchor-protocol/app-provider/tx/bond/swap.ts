import { bondSwapTx } from '@anchor-protocol/app-fns';
import { aLuna, Gas, Rate, u, UST } from '@anchor-protocol/types';
import { useRefetchQueries } from '@libs/app-provider';
import { useStream } from '@rx-stream/react';
import { useConnectedWallet } from '@terra-money/wallet-provider';
import { useCallback } from 'react';
import { useAccount } from 'contexts/account';
import { useAnchorWebapp } from '../../contexts/context';
import { ANCHOR_TX_KEY } from '../../env';

export interface BondSwapTxParams {
  burnAmount: aLuna;
  gasWanted: Gas;
  txFee: u<UST>;
  beliefPrice: Rate;
  maxSpread: number;
  onTxSucceed?: () => void;
}

export function useBondSwapTx() {
  const { availablePost, connected, terraWalletAddress } = useAccount();

  const connectedWallet = useConnectedWallet();

  const { queryClient, txErrorReporter, contractAddress, constants } =
    useAnchorWebapp();

  const refetchQueries = useRefetchQueries();

  const stream = useCallback(
    ({
      burnAmount,
      beliefPrice,
      maxSpread,
      onTxSucceed,
      txFee,
      gasWanted,
    }: BondSwapTxParams) => {
      if (
        !availablePost ||
        !connected ||
        !connectedWallet ||
        !terraWalletAddress
      ) {
        throw new Error('Can not post!');
      }

      return bondSwapTx({
        // fabricateTerraswapSwapaLuna
        burnAmount,
        beliefPrice,
        maxSpread: maxSpread.toString() as Rate,
        walletAddr: terraWalletAddress,
        bAssetTokenAddr: contractAddress.cw20.aLuna,
        bAssetPairAddr: contractAddress.terraswap.alunaLunaPair,
        // post
        network: connectedWallet.network,
        post: connectedWallet.post,
        fixedGas: txFee,
        gasFee: gasWanted,
        gasAdjustment: constants.gasAdjustment,
        // query
        queryClient,
        // error
        txErrorReporter,
        // side effect
        onTxSucceed: () => {
          onTxSucceed?.();
          refetchQueries(ANCHOR_TX_KEY.BOND_SWAP);
        },
      });
    },
    [
      availablePost,
      connected,
      connectedWallet,
      contractAddress.cw20.aLuna,
      contractAddress.terraswap.alunaLunaPair,
      terraWalletAddress,
      constants.gasAdjustment,
      queryClient,
      txErrorReporter,
      refetchQueries,
    ],
  );

  const streamReturn = useStream(stream);

  return connectedWallet ? streamReturn : [null, null];
}
