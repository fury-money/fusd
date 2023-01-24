import React from 'react';
import { useBorrowRedeemCollateralTx } from '@anchor-protocol/app-provider';
import { bAsset, Rate, u } from '@anchor-protocol/types';
import { EstimatedFee, useCW20Balance } from '@libs/app-provider';
import type { DialogProps } from '@libs/use-dialog';
import { useAccount } from 'contexts/account';
import { useCallback } from 'react';
import { RedeemCollateralDialog } from '../RedeemCollateralDialog';
import { RedeemCollateralFormParams } from '../types';
import { normalize } from '@anchor-protocol/formatter';
import { RedeemWrappedCollateralDialog } from '../RedeemWrappedCollateralDialog';
import { useBorrowRedeemWrappedCollateralTx } from '@anchor-protocol/app-provider/tx/borrow/redeemWrappedCollateral';

export const TerraRedeemCollateralDialog = (
  props: DialogProps<RedeemCollateralFormParams>,
) => {
  const { collateral } = props;

  const { connected, terraWalletAddress } = useAccount();

  const cw20Balance = useCW20Balance<bAsset>(
    collateral.collateral_token,
    terraWalletAddress,
  );

  const uTokenBalance = normalize(cw20Balance, 6, collateral.decimals);

  if(!("info" in collateral))
  {

    const [postTx, txResult] = useBorrowRedeemCollateralTx(collateral);

    const proceed = useCallback(
      (redeemAmount: bAsset, txFee: EstimatedFee) => {
        if (connected && postTx) {
          postTx({ redeemAmount, txFee });
        }
      },
      [connected, postTx],
    );

    return  (
      <RedeemCollateralDialog
        {...props}
        txResult={txResult}
        collateral={collateral}
        uTokenBalance={uTokenBalance}
        proceedable={postTx !== undefined}
        onProceed={proceed}
      />)

  }else{

    const [postTx, txResult] = useBorrowRedeemWrappedCollateralTx(collateral);

    const proceed = useCallback(
      (redeemWrappedAmount: u<bAsset>, txFee: EstimatedFee, exchangeRate: Rate) => {
        if (connected && postTx) {
          postTx({ redeemWrappedAmount, exchangeRate, txFee });
        }
      },
      [connected, postTx],
    );
    return ( <RedeemWrappedCollateralDialog
      {...props}
      txResult={txResult}
      collateral={collateral}
      uTokenBalance={uTokenBalance}
      proceedable={postTx !== undefined}
      onProceed={proceed}
    />);
  }
};
