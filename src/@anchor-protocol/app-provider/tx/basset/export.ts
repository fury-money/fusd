import { bAssetExportTx } from "@anchor-protocol/app-fns";
import { bAsset } from "@anchor-protocol/types";
import { useFixedFee, useRefetchQueries } from "@libs/app-provider";
import { CW20Addr, HumanAddr } from "@libs/types";
import { useStream } from "@rx-stream/react";
import { useConnectedWallet, useWallet } from "@terra-money/wallet-kit";
import { useCallback } from "react";
import { useAnchorWebapp } from "../../contexts/context";
import { ANCHOR_TX_KEY } from "../../env";
import { useBAssetInfoByTokenAddrQuery } from "../../queries/basset/bAssetInfoByTokenAddr";
import { useAccount } from "contexts/account";
import { useNetwork } from "@anchor-protocol/app-provider/contexts/network";

export interface BAssetExportTxParams {
  amount: bAsset;
  onTxSucceed?: () => void;
}

export function useBAssetExportTx(tokenAddr: CW20Addr | undefined) {
  const walletOperations = useWallet();
  const account = useAccount();

  const { queryClient, txErrorReporter, constants } = useAnchorWebapp();

  const fixedFee = useFixedFee();

  const { data: bAssetInfo } = useBAssetInfoByTokenAddrQuery(tokenAddr);

  const refetchQueries = useRefetchQueries();

  const stream = useCallback(
    ({ onTxSucceed, amount }: BAssetExportTxParams) => {
      if (
        !account.connected ||
        !account.availablePost ||
        !bAssetInfo ||
        !bAssetInfo.converterConfig.anchor_token_address ||
        !queryClient
      ) {
        throw new Error("Can not post!");
      }

      return bAssetExportTx({
        walletAddr: account.terraWalletAddress as HumanAddr,
        bAssetInfo,
        // converterAddr: converterContract,
        // bAssetTokenAddr: bAssetInfo.converterConfig.anchor_token_address,
        bAssetTokenAmount: amount,
        // post
        network: account.network,
        post: walletOperations.post,
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
          refetchQueries(ANCHOR_TX_KEY.BASSET_EXPORT);
        },
      });
    },
    [
      bAssetInfo,
      fixedFee,
      constants.gasWanted,
      constants.gasAdjustment,
      queryClient,
      txErrorReporter,
      refetchQueries,
      account.availablePost,
      account.terraWalletAddress,
      account.network,
      account.connected,
      walletOperations.post,
    ]
  );

  const streamReturn = useStream(stream);

  return account.connected ? streamReturn : [null, null];
}
