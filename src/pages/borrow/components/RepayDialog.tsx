import {
  useAnchorWebapp,
  useBorrowRepayForm,
} from '@anchor-protocol/app-provider';
import {
  formatLuna,
  formatUST,
  formatUSTInput,
  UST_INPUT_MAXIMUM_DECIMAL_POINTS,
  UST_INPUT_MAXIMUM_INTEGER_POINTS,
} from '@anchor-protocol/notation';
import { Rate, UST } from '@anchor-protocol/types';
import { TxResultRendering } from '@libs/app-fns';
import { demicrofy, formatRate, formatTokenInput } from '@libs/formatter';
import { ActionButton } from '@libs/neumorphism-ui/components/ActionButton';
import { Dialog } from '@libs/neumorphism-ui/components/Dialog';
import { IconSpan } from '@libs/neumorphism-ui/components/IconSpan';
import { InfoTooltip } from '@libs/neumorphism-ui/components/InfoTooltip';
import { NumberInput } from '@libs/neumorphism-ui/components/NumberInput';
import { UIElementProps } from '@libs/ui';
import type { DialogProps } from '@libs/use-dialog';
import { InputAdornment, Modal } from '@mui/material';
import { StreamResult, StreamStatus } from '@rx-stream/react';
import { Big } from 'big.js';
import { MessageBox } from 'components/MessageBox';
import { TxResultRenderer } from 'components/tx/TxResultRenderer';
import { TxFeeList, TxFeeListItem } from 'components/TxFeeList';
import { ViewAddressWarning } from 'components/ViewAddressWarning';
import { useAccount } from 'contexts/account';
import { BroadcastTxStreamResult } from 'pages/earn/components/types';
import React, { ChangeEvent, useCallback, useEffect, useMemo } from 'react';
import styled, { useTheme } from 'styled-components';
import { EstimatedLiquidationPrice } from './EstimatedLiquidationPrice';
import { LTVGraph } from './LTVGraph';
import { RepayFormParams } from './types';
import big from 'big.js';
import { EstimatedFee, useFeeEstimationFor } from '@libs/app-provider';
import { Coin, Coins, MsgExecuteContract } from '@terra-money/terra.js';
import { CircleSpinner } from 'react-spinners-kit';

export interface RepayDialogParams extends UIElementProps, RepayFormParams {
  txResult: StreamResult<TxResultRendering> | null;
  proceedable: boolean;
  onProceed: (repayAmount: UST, txFee: EstimatedFee) => void;
}

export type RepayDialogProps = DialogProps<RepayDialogParams> & {
  renderBroadcastTxResult?: JSX.Element;
};

function RepayDialogBase(props: RepayDialogProps) {
  const {
    className,
    closeDialog,
    fallbackBorrowMarket,
    fallbackBorrowBorrower,
    txResult,
    proceedable,
    onProceed,
    renderBroadcastTxResult,
  } = props;

  const { availablePost, connected, terraWalletAddress } = useAccount();
  const { contractAddress } = useAnchorWebapp();

  const [input, states] = useBorrowRepayForm(
    fallbackBorrowMarket,
    fallbackBorrowBorrower,
  );

  const updateRepayAmount = useCallback(
    (nextRepayAmount: string) => {
      input({ repayAmount: nextRepayAmount as UST });
    },
    [input],
  );

  const [estimatedFee, estimatedFeeError, estimateFee] =
    useFeeEstimationFor(terraWalletAddress);

  useEffect(() => {
    if (!connected || !states.repayAmount) {
      return;
    }

    estimateFee([
      new MsgExecuteContract(
        terraWalletAddress,
        contractAddress.moneyMarket.market,
        {
          // @see https://github.com/Anchor-Protocol/money-market-contracts/blob/master/contracts/market/src/msg.rs#L74
          repay_stable: {},
        },
        // sending stablecoin
        new Coins([
          new Coin(
            contractAddress.native.usd,
            formatTokenInput(states.repayAmount),
          ),
        ]),
      ),
    ]);
  }, [
    terraWalletAddress,
    contractAddress.moneyMarket.market,
    contractAddress.native.usd,
    states.repayAmount,
    estimateFee,
    connected,
  ]);

  const onLtvChange = useCallback(
    (nextLtv: Rate<Big>) => {
      const ltvToAmount = states.ltvToAmount;
      try {
        const nextAmount = ltvToAmount(nextLtv);
        input({
          repayAmount: formatUSTInput(demicrofy(nextAmount)),
        });
      } catch {}
    },
    [input, states.ltvToAmount],
  );

  ///////////////////// Presentation /////////////////

  const theme = useTheme();

  const renderBroadcastTx = useMemo(() => {
    if (renderBroadcastTxResult) {
      return renderBroadcastTxResult;
    }

    return (
      <TxResultRenderer
        resultRendering={(txResult as BroadcastTxStreamResult).value}
        onExit={closeDialog}
      />
    );
  }, [renderBroadcastTxResult, closeDialog, txResult]);

  if (
    txResult?.status === StreamStatus.IN_PROGRESS ||
    txResult?.status === StreamStatus.DONE
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
        <h1>
          Repay{' '}
          <p>
            <IconSpan>
              Borrow APR : {formatRate(states.apr)}%{' '}
              <InfoTooltip>
                Current rate of annualized borrowing interest applied for this
                stablecoin
              </InfoTooltip>
            </IconSpan>
          </p>
        </h1>

        {!!states.invalidTxFee && (
          <MessageBox>{states.invalidTxFee}</MessageBox>
        )}

        <NumberInput
          className="amount"
          value={states.repayAmount}
          maxIntegerPoinsts={UST_INPUT_MAXIMUM_INTEGER_POINTS}
          maxDecimalPoints={UST_INPUT_MAXIMUM_DECIMAL_POINTS}
          label="REPAY AMOUNT"
          error={!!states.invalidRepayAmount}
          onChange={({ target }: ChangeEvent<HTMLInputElement>) =>
            updateRepayAmount(target.value)
          }
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">axlUSDC</InputAdornment>
            ),
          }}
        />

        <div className="wallet" aria-invalid={!!states.invalidRepayAmount}>
          <span>{states.invalidRepayAmount}</span>
          <span>
            Max:{' '}
            <span
              style={{
                textDecoration: 'underline',
                cursor: 'pointer',
              }}
              onClick={() =>
                updateRepayAmount(
                  formatUSTInput(demicrofy(states.maxRepayingAmount)),
                )
              }
            >
              {formatUST(demicrofy(states.maxRepayingAmount))} axlUSDC
            </span>
          </span>
        </div>

        <figure className="graph">
          <LTVGraph
            disabled={!connected}
            borrowLimit={states.borrowLimit}
            start={0}
            end={states.currentLtv?.toNumber() ?? 0}
            value={states.nextLtv}
            onChange={onLtvChange}
            onStep={states.ltvStepFunction}
          />
        </figure>

        {states.nextLtv?.lt(states.currentLtv ?? 0) && (
          <EstimatedLiquidationPrice>
            {states.estimatedLiquidationPrice}
          </EstimatedLiquidationPrice>
        )}

        {states.totalOutstandingLoan && states.txFee && states.sendAmount && (
          <TxFeeList className="receipt">
            <TxFeeListItem label="Total Outstanding Loan">
              {states.totalOutstandingLoan.lt(0)
                ? 0
                : formatUST(demicrofy(states.totalOutstandingLoan))}{' '}
              axlUSDC
            </TxFeeListItem>
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
            <TxFeeListItem label="Send Amount">
              {states.repayAmount} axlUSDC
            </TxFeeListItem>
          </TxFeeList>
        )}

        <ViewAddressWarning>
          <ActionButton
            className="proceed"
            disabled={
              !availablePost ||
              !connected ||
              !states.availablePost ||
              !proceedable ||
              !estimatedFee
            }
            onClick={() =>
              estimatedFee && onProceed(states.repayAmount, estimatedFee)
            }
          >
            Proceed
          </ActionButton>
        </ViewAddressWarning>
      </Dialog>
    </Modal>
  );
}

export const RepayDialog = styled(RepayDialogBase)`
  width: 720px;
  touch-action: none;

  h1 {
    font-size: 27px;
    text-align: center;
    font-weight: 300;

    p {
      color: ${({ theme }) => theme.colors.positive};
      font-size: 14px;
      margin-top: 10px;
    }

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

    margin-bottom: 45px;
  }

  .limit {
    width: 100%;
    margin-bottom: 30px;
  }

  .graph {
    margin-top: 60px;
    margin-bottom: 40px;
  }

  .receipt {
    margin-bottom: 30px;
  }

  .proceed {
    width: 100%;
    height: 60px;
    border-radius: 30px;
  }
`;
