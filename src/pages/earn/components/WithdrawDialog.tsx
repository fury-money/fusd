import { computeTotalDeposit } from '@anchor-protocol/app-fns';
import {
  useEarnEpochStatesQuery,
  EarnWithdrawFormReturn,
} from '@anchor-protocol/app-provider';
import {
  formatLuna,
  UST_INPUT_MAXIMUM_DECIMAL_POINTS,
  UST_INPUT_MAXIMUM_INTEGER_POINTS,
} from '@anchor-protocol/notation';
import { UST } from '@anchor-protocol/types';
import { Dialog } from '@libs/neumorphism-ui/components/Dialog';
import { IconSpan } from '@libs/neumorphism-ui/components/IconSpan';
import { NumberInput } from '@libs/neumorphism-ui/components/NumberInput';
import type { DialogProps } from '@libs/use-dialog';
import { InputAdornment, Modal } from '@mui/material';
import { StreamResult, StreamStatus } from '@rx-stream/react';
import { MessageBox } from 'components/MessageBox';
import { TxFeeList, TxFeeListItem } from 'components/TxFeeList';
import { TxResultRenderer } from 'components/tx/TxResultRenderer';
import { useAccount } from 'contexts/account';
import React, { ChangeEvent, useMemo } from 'react';
import styled, { useTheme } from 'styled-components';
import { useBalances } from 'contexts/balances';
import { AmountSlider } from './AmountSlider';
import { TxResultRendering } from '@libs/app-fns';
import { UIElementProps } from '@libs/ui';
import { useFormatters } from '@anchor-protocol/formatter/useFormatters';
import { BroadcastTxStreamResult } from './types';
import big from 'big.js';
import { CircleSpinner } from 'utils/consts';

interface WithdrawDialogParams extends UIElementProps, EarnWithdrawFormReturn {
  txResult: StreamResult<TxResultRendering> | null;
}

type WithdrawDialogReturn = void;

type WithdrawDialogProps = DialogProps<
  WithdrawDialogParams,
  WithdrawDialogReturn
> & {
  renderBroadcastTxResult?: JSX.Element;
};

function WithdrawDialogBase(props: WithdrawDialogProps) {
  const {
    className,
    children,
    txResult,
    closeDialog,
    withdrawAmount,
    estimatedFee,
    estimatedFeeError,
    invalidTxFee,
    invalidWithdrawAmount,
    updateWithdrawAmount,
    renderBroadcastTxResult,
  } = props;

  const { connected } = useAccount();

  const { uaUST } = useBalances();

  const {
    axlUSDC: { formatOutput, formatInput, demicrofy, symbol },
  } = useFormatters();

  const { data } = useEarnEpochStatesQuery();


  const { totalDeposit } = useMemo(() => {
    return {
      totalDeposit: computeTotalDeposit(uaUST, data?.moneyMarketEpochState),
    };
  }, [data?.moneyMarketEpochState, uaUST]);

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
        <h1>Withdraw</h1>

        {!!invalidTxFee && <MessageBox>{invalidTxFee}</MessageBox>}

        <NumberInput
          className="amount"
          value={withdrawAmount}
          maxIntegerPoinsts={UST_INPUT_MAXIMUM_INTEGER_POINTS}
          maxDecimalPoints={UST_INPUT_MAXIMUM_DECIMAL_POINTS}
          label="AMOUNT"
          error={!!invalidWithdrawAmount}
          onChange={({ target }: ChangeEvent<HTMLInputElement>) =>
            updateWithdrawAmount(target.value as UST)
          }
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">{symbol}</InputAdornment>
            ),
          }}
        />

        <div className="wallet" aria-invalid={!!invalidWithdrawAmount}>
          <span>{invalidWithdrawAmount}</span>
          <span>
            Max:{' '}
            <span
              style={{
                textDecoration: 'underline',
                cursor: 'pointer',
              }}
              onClick={() =>
                totalDeposit.gt(0) &&
                updateWithdrawAmount(formatInput(demicrofy(totalDeposit)))
              }
            >
              {formatOutput(demicrofy(totalDeposit))}
              {` ${symbol}`}
            </span>
          </span>
        </div>

        <figure className="graph">
          <AmountSlider
            disabled={!connected}
            max={Number(demicrofy(totalDeposit))}
            value={Number(withdrawAmount)}
            onChange={(value) => {
              updateWithdrawAmount(formatInput(value.toString() as UST));
            }}
          />
        </figure>

        {withdrawAmount && (
          <TxFeeList className="receipt">
            <TxFeeListItem label={<IconSpan>Tx Fee</IconSpan>}>
              {estimatedFee &&
                big(estimatedFee.txFee).gt(0) &&
                `${formatLuna(demicrofy(estimatedFee.txFee))} Luna`}
              {!estimatedFeeError && !estimatedFee && (
                <span className="spinner">
                  <CircleSpinner size={18} color={theme.colors.positive} />
                </span>
              )}
              {estimatedFeeError}
            </TxFeeListItem>
            <TxFeeListItem label="Receive Amount">
              {withdrawAmount}
              {` ${symbol}`}
            </TxFeeListItem>
          </TxFeeList>
        )}

        {children}
      </Dialog>
    </Modal>
  );
}

export const WithdrawDialog = styled(WithdrawDialogBase)`
  width: 720px;

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
    margin-top: 65px;

    width: 100%;
    height: 60px;
    border-radius: 30px;
  }
`;
