import {
  computeBorrowedAmount,
  computeCollateralsTotalUST,
} from '@anchor-protocol/app-fns';
import {
  useBorrowBorrowerQuery,
  useBorrowMarketQuery,
  useDeploymentTarget,
} from '@anchor-protocol/app-provider';
import { u, UST } from '@anchor-protocol/types';
import { ActionButton } from '@libs/neumorphism-ui/components/ActionButton';
import big from 'big.js';
import React, { useMemo } from 'react';
import { useAccount } from 'contexts/account';
import { useLoopDialog } from './loop/useLoopDialog';

export function LoopButtons() {
  const {
    target: { isNative },
  } = useDeploymentTarget();

  const { data: borrowMarket } = useBorrowMarketQuery();

  const { data: borrowBorrower } = useBorrowBorrowerQuery();

  const { connected } = useAccount();

  const [openLoopDialog, loopDialogElement] = useLoopDialog();

  const [openUnloopDialog, unloopDialogElement] = useLoopDialog();

  const collateralsValue = useMemo(() => {
    if (!borrowBorrower || !borrowMarket) {
      return '0' as u<UST>;
    }
    return computeCollateralsTotalUST(
      borrowBorrower.overseerCollaterals,
      borrowMarket.oraclePrices,
    );
  }, [borrowBorrower, borrowMarket]);

  const borrowed = useMemo(() => {
    return computeBorrowedAmount(borrowBorrower?.marketBorrowerInfo);
  }, [borrowBorrower?.marketBorrowerInfo]);

  return (
    <>
      <ActionButton
        disabled={
          !connected || !borrowMarket
        }
        //disabled={enableBorrowing !== true}
        onClick={() =>
          borrowMarket &&
          borrowBorrower &&
          openLoopDialog({
            closeDialog: () => null
          })
        }
      >
        Loop
      </ActionButton>
      <ActionButton
        disabled={
          true
        }
        onClick={() =>
          borrowMarket &&
          borrowBorrower &&
          openLoopDialog({
            closeDialog: () => null
          })
        }
      >
        Unloop
      </ActionButton>

      {loopDialogElement}
      {unloopDialogElement}
    </>
  );
}
