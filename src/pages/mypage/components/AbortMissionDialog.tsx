import { aUST, Luna, Token, u, UST } from '@anchor-protocol/types';
import { LSDContracts, useAnchorWebapp, useEarnDepositForm } from '@anchor-protocol/app-provider';
import { ActionButton } from '@libs/neumorphism-ui/components/ActionButton';
import { useConfirm } from '@libs/neumorphism-ui/components/useConfirm';
import { ViewAddressWarning } from 'components/ViewAddressWarning';
import { ReactNode, useEffect } from 'react';
import React, { useCallback } from 'react';
import { useAccount } from 'contexts/account';
import { DialogProps, OpenDialog, useDialog } from '@libs/use-dialog';
import { EstimatedFee, useFeeEstimationFor } from '@libs/app-provider';
import {
  formatLuna,
  formatUSTWithPostfixUnits,
} from '@anchor-protocol/notation';
import { Dialog } from '@libs/neumorphism-ui/components/Dialog';
import { IconSpan } from '@libs/neumorphism-ui/components/IconSpan';
import { Box, Modal } from '@mui/material';
import { StreamDone, StreamInProgress, StreamStatus } from '@rx-stream/react';
import { TxFeeList, TxFeeListItem } from 'components/TxFeeList';
import { TxResultRenderer } from 'components/tx/TxResultRenderer';
import { useMemo } from 'react';
import styled, { useTheme } from 'styled-components';
import { UIElementProps } from '@libs/ui';
import { TxResultRendering } from '@libs/app-fns';
import { useFormatters } from '@anchor-protocol/formatter/useFormatters';
import big, { Big } from 'big.js';
import { CircleSpinner } from 'react-spinners-kit';
import { useBalances } from 'contexts/balances';
import { LSDLiquidationBidsResponse } from '@anchor-protocol/app-provider/queries/liquidate/allBIdsByUser';
import { useAbortMissionTx } from '@anchor-protocol/app-provider/tx/abortMission/abortMission';
import { CollateralInfo } from "pages/borrow/components/useCollaterals";
import { TokenIcon } from '@anchor-protocol/token-icons';
import { getAbortMissionMessages } from '@anchor-protocol/app-fns';
import { DeepPartial } from '@terra-money/terra.proto/cosmwasm/wasm/v1/types';


export type BroadcastTxStreamResult<T = unknown> =
  | StreamInProgress<TxResultRendering<T>>
  | StreamDone<TxResultRendering<T>>;

export interface AbortMissionParams {
  totalDeposit: u<UST<Big>>,
  totalAUST: u<aUST>, 
  allLiquidationBids: LSDLiquidationBidsResponse,
  liquidationQueueValue: u<UST<Big>>,
  borrowedValue: u<UST<Big>>,
  allWithdrawableDefaultedCollaterals:{
    collateral: CollateralInfo,
    withdrawable_number: u<Luna<Big>>
  }[],
  collateralsWithdrawAmount: {
    collateral: CollateralInfo,
    amount: u<Token<Big>>
  }[]
}

interface DepositDialogParams extends UIElementProps, AbortMissionParams {}

type DepositDialogReturn = void;
type DepositDialogProps = DialogProps<
  DepositDialogParams,
  DepositDialogReturn
> & {
  renderBroadcastTxResult?: JSX.Element;
};

function DepositDialogBase(props: DepositDialogProps) {
  const {
    className,
    children,
    closeDialog,
    totalDeposit,
    totalAUST,
    allLiquidationBids,
    liquidationQueueValue,
    borrowedValue,
    allWithdrawableDefaultedCollaterals,
    collateralsWithdrawAmount,
    renderBroadcastTxResult,
  } = props;


  const {
    axlUSDC: { formatOutput, demicrofy, symbol },
  } = useFormatters();

  const theme = useTheme();

   const account = useAccount();

  const {contractAddress} = useAnchorWebapp();

  const [openConfirm, confirmElement] = useConfirm();

  const state = useEarnDepositForm();

  const [abortMission, abortMissionTxResult] = useAbortMissionTx();

  const proceed = useCallback(
    async (
      txFee: EstimatedFee | undefined,
      confirm: ReactNode,
    ) => {
      if (!account.connected || !abortMission || !txFee) {
        return;
      }
      if (confirm) {
        const userConfirm = await openConfirm({
          description: confirm,
          agree: 'Proceed',
          disagree: 'Cancel',
        });

        if (!userConfirm) {
          return;
        }
      }

      abortMission({
        totalAUST: totalAUST,
        allLiquidationBids: allLiquidationBids,
        allWithdrawableDefaultedCollaterals,
        collateralsWithdrawAmount,
        borrowedValue: borrowedValue,
        uaUST: uaUST,
        txFee,
      });
    },
    [account.connected, abortMission, openConfirm],
  );


  // ---------------------------------------------
  //  Transaction preparation --> Queries and queries
  // ---------------------------------------------
  
  const { uaUST } = useBalances();

  // ---------------------------------------------
  //  Fee estimation and transaction execution
  // ---------------------------------------------

  const [estimatedFee, estimatedFeeError, estimateFee] =
    useFeeEstimationFor(account?.terraWalletAddress);

  // We compute the transaction Fee for this operation




  useEffect(() => {
    if(!estimateFee || !account?.terraWalletAddress){
      return
    }

    const messages = getAbortMissionMessages({
      walletAddr: account.terraWalletAddress,
      totalAUST: totalAUST,
      contractAddress: contractAddress,
      allLiquidationBids: allLiquidationBids,
      allWithdrawableDefaultedCollaterals,
      collateralsWithdrawAmount,
      borrowedValue: borrowedValue,
      uaUST: uaUST
    })

    estimateFee(messages)
  }, [estimateFee])

  const renderBroadcastTx = useMemo(() => {
    if (renderBroadcastTxResult) {
      return renderBroadcastTxResult;
    }

    return (
      <TxResultRenderer
        resultRendering={(abortMissionTxResult as BroadcastTxStreamResult).value}
        onExit={closeDialog}
      />
    );
  }, [renderBroadcastTxResult, closeDialog, abortMissionTxResult]);
  if (
    abortMissionTxResult?.status === StreamStatus.IN_PROGRESS ||
    abortMissionTxResult?.status === StreamStatus.DONE
  ) {
    return (
      <Modal open disableEnforceFocus>
        <Dialog className={className}>{renderBroadcastTx}</Dialog>
      </Modal>
    );
  }

  return (
    <Modal open onClose={() => closeDialog()}>
      <Dialog className={className} onClose={() => closeDialog()}>
        <h1>Abort Mission</h1>

        This action will in order : 

        <ol>
          <li> Withdraw all the funds you deposited in the <strong>Earn Tab</strong></li>
          <li> Withdraw all funds you put in the <strong>Liquidation Tab</strong></li>
          <li> Withdraw all the collaterals you earned depositing in the <strong>Liquidation Tab</strong></li>
          <li> Repay all the debts you incurred in the borrow Tab</li>
          <li> Withdraw all collaterals you deposited on the borrow Tab <br/>this will not unwrap aLuna collaterals</li>
        </ol>
        {(
          <TxFeeList className="receipt">
            <TxFeeListItem label={<IconSpan>Tx Fee</IconSpan>}>
              {estimatedFee &&
                big(estimatedFee.txFee).gt(0) &&
                `${formatLuna(demicrofy(estimatedFee.txFee))} Luna`}
              {!estimatedFeeError && !estimatedFee && (
                <span className="spinner">
                  <CircleSpinner size={14} color={theme.colors.positive} />
                </span>
              )}
              {estimatedFeeError}
            </TxFeeListItem>
            <TxFeeListItem label="Amount to Withdraw">
              {`${formatUSTWithPostfixUnits(demicrofy(totalDeposit.add(liquidationQueueValue ?? 0).toString() as u<UST>))} ${symbol}`}
            </TxFeeListItem>
            
            <TxFeeListItem label="Collateral to withdraw">
              <Box sx={{display: "flex", flexDirection:"column", alignItems: "end"}} >
              {
                collateralsWithdrawAmount.map((el, i) => 
                  <Box key={i}>
                    <TokenIcon token={el.collateral.collateral?.symbol} /> {`${formatOutput(demicrofy(el.amount))} ${el.collateral.collateral.symbol}`}
                  </Box>
                )
              }
              </Box>


            </TxFeeListItem>
            
            <TxFeeListItem label="Amount to repay">
              {`${formatOutput(demicrofy(borrowedValue))} ${symbol}`}
            </TxFeeListItem>
            
          </TxFeeList>
        )}
      
        <ViewAddressWarning>
          <ActionButton
            className="button"
            style={
              estimatedFeeError
                ? {
                    backgroundColor: '#c12535',
                  }
                : undefined
            }
            disabled={
              !account.connected ||
              !account.availablePost ||
              !abortMission ||
              !estimatedFee
            }
            onClick={() =>
              proceed(estimatedFee, estimatedFeeError)
            }
          >
            Proceed
          </ActionButton>
        </ViewAddressWarning>
        {confirmElement}
      </Dialog>
    </Modal>
  );
}

export const AbortMissionDialog = styled(DepositDialogBase)`
  width: 720px;
  touch-action: none;

  h1 {
    font-size: 27px;
    text-align: center;
    font-weight: 300;

    margin-bottom: 50px;
  }

  .amount {
    width: 100%;
    margin-bottom: 5px;

    .MuiTypography-colorTextSecondary {
      color: currentColor;
    }
  }

  .wallet {
    display: flex;
    justify-content: space-between;

    font-size: 12px;
    color: ${({ theme }) => theme.dimTextColor};

    &[aria-invalid='true'] {
      color: ${({ theme }) => theme.colors.negative};
    }
  }

  .graph {
    margin-top: 80px;
    margin-bottom: 40px;
  }

  .receipt {
    margin-top: 30px;
  }

  .button {
    margin-top: 45px;

    width: 100%;
    height: 60px;
    border-radius: 30px;
  }
`;

export function useAbortMissionDialog(): [
  OpenDialog<AbortMissionParams, void>,
  ReactNode,
] {
  return useDialog<AbortMissionParams,void>(AbortMissionDialog);
}

