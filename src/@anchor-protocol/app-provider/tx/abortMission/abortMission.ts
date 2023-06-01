import { abortMissionTx } from "@anchor-protocol/app-fns";
import { LSDLiquidationBidsResponse } from "@anchor-protocol/app-provider/queries/liquidate/allBIdsByUser";
import { aUST, Luna, Token, u, UST } from "@anchor-protocol/types";
import { EstimatedFee, useRefetchQueries } from "@libs/app-provider";
import { useStream } from "@rx-stream/react";
import { useConnectedWallet } from "@terra-money/wallet-provider";
import { CollateralInfo } from "pages/borrow/components/useCollaterals";
import { useCallback } from "react";
import { useAnchorWebapp } from "../../contexts/context";
import { ANCHOR_TX_KEY } from "../../env";
import { Big } from "big.js";
import { LSDContracts } from "@anchor-protocol/app-provider";
import { DeepPartial } from "chart.js/types/utils";
export interface AbortMissionTxParams {
  txFee: EstimatedFee;
  totalAUST: u<aUST>;
  allLiquidationBids: LSDLiquidationBidsResponse;
  allWithdrawableDefaultedCollaterals:{
    collateral: CollateralInfo,
    withdrawable_number: u<Luna<Big>>
  }[],
  collateralsWithdrawAmount: {
    collateral: CollateralInfo,
    amount: u<Token<Big>>
  }[],
  borrowedValue: u<UST<Big>>;
  uaUST: u<aUST<string>>;

  onTxSucceed?: () => void;
}

export function useAbortMissionTx() {
  const connectedWallet = useConnectedWallet();

  const { constants, txErrorReporter, queryClient, contractAddress } =
    useAnchorWebapp();

  const refetchQueries = useRefetchQueries();

  const stream = useCallback(
    ({
      txFee,
      totalAUST,
      allLiquidationBids,
      collateralsWithdrawAmount,
      allWithdrawableDefaultedCollaterals,
      borrowedValue,
      uaUST,
      onTxSucceed,
    }: AbortMissionTxParams) => {
      if (!connectedWallet || !connectedWallet.availablePost || !queryClient) {
        throw new Error("Can not post!");
      }

      return abortMissionTx({
        // fabricateMarketDepositStableCoin
        walletAddr: connectedWallet.walletAddress,
        totalAUST,
        contractAddress,
        allLiquidationBids,
        collateralsWithdrawAmount,
        allWithdrawableDefaultedCollaterals,
        borrowedValue,
        uaUST,

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
      contractAddress.moneyMarket.market,
      contractAddress.native.usd,
      constants.gasAdjustment,
      queryClient,
      txErrorReporter,
      refetchQueries,
    ]
  );

  const streamReturn = useStream(stream);

  return connectedWallet ? streamReturn : [null, null];
}
