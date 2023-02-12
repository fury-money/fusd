import { borrowRedeemWrappedCollateralTx } from "@anchor-protocol/app-fns";
import { bAsset, Rate, u } from "@anchor-protocol/types";
import { EstimatedFee, useRefetchQueries } from "@libs/app-provider";
import { useStream } from "@rx-stream/react";
import { useConnectedWallet } from "@terra-money/wallet-provider";
import { useCallback } from "react";
import { useAccount } from "contexts/account";
import { useAnchorWebapp } from "../../contexts/context";
import { ANCHOR_TX_KEY } from "../../env";
import { useBorrowBorrowerQuery } from "../../queries/borrow/borrower";
import { useBorrowMarketQuery } from "../../queries/borrow/market";
import { WhitelistWrappedCollateral } from "queries";

export interface BorrowRedeemWrappedCollateralTxParams {
  redeemWrappedAmount: u<bAsset>;
  exchangeRate: Rate;
  txFee: EstimatedFee;
  onTxSucceed?: () => void;
}

export function useBorrowRedeemWrappedCollateralTx(
  collateral: WhitelistWrappedCollateral
) {
  const { availablePost, connected, terraWalletAddress } = useAccount();

  const connectedWallet = useConnectedWallet();

  const { queryClient, txErrorReporter, contractAddress, constants } =
    useAnchorWebapp();

  const { refetch: borrowMarketQuery } = useBorrowMarketQuery();
  const { refetch: borrowBorrowerQuery } = useBorrowBorrowerQuery();

  const refetchQueries = useRefetchQueries();

  const stream = useCallback(
    ({
      redeemWrappedAmount,
      txFee,
      exchangeRate,
      onTxSucceed,
    }: BorrowRedeemWrappedCollateralTxParams) => {
      if (
        !connectedWallet ||
        !connected ||
        !availablePost ||
        !terraWalletAddress ||
        !collateral ||
        !queryClient
      ) {
        throw new Error("Can not post!");
      }

      return borrowRedeemWrappedCollateralTx({
        collateral,
        exchangeRate,
        walletAddr: terraWalletAddress,
        redeemWrappedAmount,
        overseerAddr: contractAddress.moneyMarket.overseer,
        // post
        network: connectedWallet.network,
        post: connectedWallet.post,
        fixedGas: txFee.txFee,
        gasFee: txFee.gasWanted,
        gasAdjustment: constants.gasAdjustment,
        // query
        queryClient,
        borrowMarketQuery,
        borrowBorrowerQuery,
        // error
        txErrorReporter,
        // side effect
        onTxSucceed: () => {
          onTxSucceed?.();
          refetchQueries(ANCHOR_TX_KEY.BORROW_REDEEM_COLLATERAL);
        },
      });
    },
    [
      collateral,
      borrowBorrowerQuery,
      borrowMarketQuery,
      availablePost,
      connected,
      connectedWallet,
      constants.gasAdjustment,
      contractAddress.moneyMarket.overseer,
      queryClient,
      refetchQueries,
      terraWalletAddress,
      txErrorReporter,
    ]
  );

  const streamReturn = useStream(stream);

  return connectedWallet ? streamReturn : [null, null];
}
