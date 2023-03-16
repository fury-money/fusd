import React from 'react';
import { UST } from '@anchor-protocol/types';
import { DialogProps, useDialog } from '@libs/use-dialog';
import { useAccount } from 'contexts/account';
import { useCallback } from 'react';
import { useBorrowBorrowTx } from '@anchor-protocol/app-provider';
import { BorrowFormParams } from '../types';
import { EstimatedFee } from '@libs/app-provider';
import { LoopDialogComponent } from './LoopDialog';


export function LoopDialog(props: DialogProps<{}>) {
  const { connected } = useAccount();

  const [postTx, txResult] = useBorrowBorrowTx();

  const proceed = useCallback(
    (borrowAmount: UST, txFee: EstimatedFee) => {
      if (connected && postTx) {
        postTx({ borrowAmount, txFee });
      }
    },
    [postTx, connected],
  );

  return (
    <LoopDialogComponent
      {...props}
      txResult={txResult}
      proceedable={postTx !== undefined}
      onProceed={proceed}
    />
  )
};


export function useLoopDialog() {
  return useDialog(LoopDialog);
}
