import React from 'react';
import { useBorrowProvideCollateralTx } from '@anchor-protocol/app-provider';
import { bAsset, CW20Addr, Rate, u } from '@anchor-protocol/types';
import { EstimatedFee, useCW20Balance } from '@libs/app-provider';
import type { DialogProps } from '@libs/use-dialog';
import { useAccount } from 'contexts/account';
import { useCallback } from 'react';
import { ProvideCollateralDialog } from '../ProvideCollateralDialog';
import { ProvideCollateralFormParams } from '../types';
import { normalize } from '@anchor-protocol/formatter';
import { ProvideWrappedCollateralDialog } from '../ProvideWrappedCollateralDialog';
import { useBorrowProvideWrappedCollateralTx } from '@anchor-protocol/app-provider/tx/borrow/provideWrappedCollateral';

export const TerraProvideCollateralDialog = (
  props: DialogProps<ProvideCollateralFormParams>,
) => {
  const { collateral } = props;

  const { connected, terraWalletAddress } = useAccount();


  // In the normal collateral case
  if(!collateral.info){
     const cw20Balance = useCW20Balance<bAsset>(
      collateral.collateral_token,
      terraWalletAddress,
    );
    const uTokenBalance = normalize(cw20Balance, 6, collateral.decimals);
    
    const [postTx, txResult] = useBorrowProvideCollateralTx(collateral);

    const proceed = useCallback(
      (depositAmount: bAsset, txFee: EstimatedFee) => {
        if (connected && postTx) {
          postTx({
            depositAmount,
            txFee
          });
        }
      },
      [connected, postTx],
    );

    return (<ProvideCollateralDialog
      {...props}
      txResult={txResult}
      uTokenBalance={uTokenBalance}
      collateral={collateral}
      proceedable={postTx !== undefined}
      onProceed={proceed}
    />)

  }else{
    const cw20Balance = useCW20Balance<bAsset>(
      collateral.info.info.tokenAddress as CW20Addr,
      terraWalletAddress,
    );   
    const uTokenBalance = normalize(cw20Balance, 6, collateral.decimals);

    const [postTx, txResult] = useBorrowProvideWrappedCollateralTx(collateral);

    const proceed = useCallback(
      (depositAmount: bAsset, txFee: EstimatedFee, lunaAmount : u<bAsset>) => {
        if (connected && postTx) {
          postTx({
            depositAmount,
            txFee,
            lunaAmount
          });
        }
      },
      [connected, postTx],
    );

    return (
      <ProvideWrappedCollateralDialog
      {...props}
      txResult={txResult}
      uTokenBalance={uTokenBalance}
      collateral={collateral}
      proceedable={postTx !== undefined}
      onProceed={proceed}
    />)
  }

};
