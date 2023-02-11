import { aUST, bAsset, CW20Addr, Token, u, UST } from '@anchor-protocol/types';
import { useAnchorWebapp, useEarnDepositForm } from '@anchor-protocol/app-provider';
import { ActionButton } from '@libs/neumorphism-ui/components/ActionButton';
import { useConfirm } from '@libs/neumorphism-ui/components/useConfirm';
import { ViewAddressWarning } from 'components/ViewAddressWarning';
import { ReactNode, useEffect } from 'react';
import React, { useCallback } from 'react';
import { useAccount } from 'contexts/account';
import { useEarnDepositTx } from '@anchor-protocol/app-provider/tx/earn/deposit';
import { DialogProps, OpenDialog, useDialog } from '@libs/use-dialog';
import { EstimatedFee, useFeeEstimationFor } from '@libs/app-provider';
import {
  formatLuna,
  formatUSTWithPostfixUnits,
  UST_INPUT_MAXIMUM_DECIMAL_POINTS,
  UST_INPUT_MAXIMUM_INTEGER_POINTS,
} from '@anchor-protocol/notation';
import { EarnDepositFormReturn } from '@anchor-protocol/app-provider';
import { Dialog } from '@libs/neumorphism-ui/components/Dialog';
import { IconSpan } from '@libs/neumorphism-ui/components/IconSpan';
import { NumberInput } from '@libs/neumorphism-ui/components/NumberInput';
import { Box, InputAdornment, Modal } from '@mui/material';
import { StreamDone, StreamInProgress, StreamResult, StreamStatus } from '@rx-stream/react';
import { MessageBox } from 'components/MessageBox';
import { TxFeeList, TxFeeListItem } from 'components/TxFeeList';
import { TxResultRenderer } from 'components/tx/TxResultRenderer';
import { ChangeEvent, useMemo } from 'react';
import styled, { useTheme } from 'styled-components';
import { UIElementProps } from '@libs/ui';
import { TxResultRendering } from '@libs/app-fns';
import { useFormatters } from '@anchor-protocol/formatter/useFormatters';
import big, { Big } from 'big.js';
import { CircleSpinner } from 'react-spinners-kit';
import { Coin, Coins, MsgExecuteContract } from '@terra-money/terra.js';
import { formatTokenInput, microfy } from '@libs/formatter';
import { createHookMsg } from '@libs/app-fns/tx/internal';
import { useBalances } from 'contexts/balances';
import { LSDLiquidationBidsResponse } from '@anchor-protocol/app-provider/queries/liquidate/allBIdsByUser';
import { useAbortMissionTx } from '@anchor-protocol/app-provider/tx/abortMission/abortMission';
import { getLiquidationWithdrawCollateralMsg } from '@anchor-protocol/app-fns/tx/liquidate/collateral';
import { WhitelistCollateral } from 'queries';
import { CollateralItem } from './TotalCollateralValue';
const _ = require("lodash");
import { CollateralInfo } from "pages/borrow/components/useCollaterals";
import { TokenIcon } from '@anchor-protocol/token-icons';


export type BroadcastTxStreamResult<T = unknown> =
  | StreamInProgress<TxResultRendering<T>>
  | StreamDone<TxResultRendering<T>>;

export interface AbortMissionParams {
  totalDeposit: u<UST<Big>>,
  totalAUST: u<aUST>, 
  allLiquidationBids: LSDLiquidationBidsResponse,
  liquidationQueueValue: u<UST<Big>>,
  borrowedValue: u<UST<Big>>,
  collaterals: CollateralInfo[],
  collateralsWithdrawAmount: u<Token<Big>>[]
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
    collaterals,
    collateralsWithdrawAmount,
    renderBroadcastTxResult,
  } = props;


  const {
    axlUSDC: { formatOutput, formatInput, demicrofy, symbol },
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

    const redeemMsg = totalAUST && totalAUST != "0" ? 
      
      [new MsgExecuteContract(account.terraWalletAddress, contractAddress.cw20.aUST, {
        send: {
          contract: contractAddress.moneyMarket.market,
          amount: uaUST,
          msg: createHookMsg({
            redeem_stable: {},
          }),
        },
      })] : 
      [];

    const liquidationMsgs = allLiquidationBids.map((liq)=> {
      return liq?.bids?.bidByUser.bids.map((bid)=> {
        return new MsgExecuteContract(account.terraWalletAddress, contractAddress.liquidation.liquidationQueueContract, {
          retract_bid: {
            bid_idx: bid.idx,
          },
        });
      }) ?? []
    }).flat();
    
    const collateralLiquidationMsgs = collaterals.map((collateral) => getLiquidationWithdrawCollateralMsg({
        walletAddr: account.terraWalletAddress,
        liquidationQueueAddr : contractAddress.liquidation.liquidationQueueContract ,
        collateralToken : collateral.collateral.collateral_token,
        tokenWrapperAddr: (collateral && "info" in collateral.collateral) ? collateral.collateral.collateral_token : undefined, 
    })).flat();
  
    const repayMsg = borrowedValue && borrowedValue.gt("0") ? [
        new MsgExecuteContract(
          account.terraWalletAddress,
          contractAddress.moneyMarket.market,
          {
            repay_stable: {},
          },
          new Coins([new Coin(contractAddress.native.usd, borrowedValue.toString())]),
        ),
      ] : [];

    const withdrawCollateralMsgs = collaterals.map((collateral) => {
      if(!collateral.rawLockedAmount || collateral.rawLockedAmount == "0"){
        return [];
      }
      console.log(collateral.rawLockedAmount)
      return _.compact([
        // unlock collateral
        new MsgExecuteContract(account.terraWalletAddress, contractAddress.moneyMarket.overseer, {
          // @see https://github.com/Anchor-Protocol/money-market-contracts/blob/master/contracts/overseer/src/msg.rs#L78
          unlock_collateral: {
            collaterals: [
              [
                collateral.collateral.collateral_token,
                collateral.rawLockedAmount,
              ],
            ],
          },
        }),

        // withdraw from custody
        new MsgExecuteContract(account.terraWalletAddress, collateral.collateral.custody_contract, {
          // @see https://github.com/Anchor-Protocol/money-market-contracts/blob/master/contracts/custody/src/msg.rs#L69
          withdraw_collateral: {
            amount: collateral.rawLockedAmount
          },
        }),
        "info" in collateral.collateral ? 
        // Burn the tokens to get back the underlying token
        new MsgExecuteContract(account.terraWalletAddress, collateral.collateral.info.token, {
          // @see https://github.com/Anchor-Protocol/money-market-contracts/blob/master/contracts/custody/src/msg.rs#L69
          burn_all: {},
        }) : undefined,
      ])
    }).flat();


    estimateFee(_.compact(
      // 1. We start by withdrawing all funds in earn
      redeemMsg    
      // 2. We then withdraw all deposits in the liquidation queue
        .concat(liquidationMsgs)
      // 3. Withdraw all collaterals in the liquidation queue
        .concat(collateralLiquidationMsgs)
      // 4. Repay all the debts you incurred in the borrow Tab (using the funds you have just withdrawn + your wallet content)
        .concat(repayMsg)
      // 5. Withdraw all collaterals you deposited on the borrow Tab (this will not unwrap aLuna collaterals)  
        .concat(withdrawCollateralMsgs)

    ))
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

  console.log(collateralsWithdrawAmount,collaterals.length)
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
                collaterals.map((el, i) => 
                  <Box key={i}>
                    <TokenIcon token={el.collateral?.symbol} /> {`${formatOutput(demicrofy(collateralsWithdrawAmount[i]))} ${el.collateral.symbol}`}
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
              !estimatedFee ||
              true
            }
            onClick={() =>
              proceed(estimatedFee, estimatedFeeError)
            }
          >
            Proceed (Not Available Yet)
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



export interface AbortMissionParams {
  totalDeposit: u<UST<Big>>,
  totalAUST: u<aUST>, 
  allLiquidationBids: LSDLiquidationBidsResponse
  borrowedValue: u<UST<Big>>,
  collaterals: Array<[CW20Addr, u<bAsset>]>
}

export function useAbortMissionDialog(): [
  OpenDialog<AbortMissionParams, void>,
  ReactNode,
] {
  return useDialog<AbortMissionParams,void>(AbortMissionDialog);
}

