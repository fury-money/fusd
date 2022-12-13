import {
  useAnchorWebapp,
  useBorrowProvideCollateralForm,
} from '@anchor-protocol/app-provider';
import {
  formatLuna,
  LUNA_INPUT_MAXIMUM_DECIMAL_POINTS,
  LUNA_INPUT_MAXIMUM_INTEGER_POINTS,
} from '@anchor-protocol/notation';
import { bAsset, NoMicro, Rate, u } from '@anchor-protocol/types';
import { Dialog } from '@libs/neumorphism-ui/components/Dialog';
import { IconSpan } from '@libs/neumorphism-ui/components/IconSpan';
import { InfoTooltip } from '@libs/neumorphism-ui/components/InfoTooltip';
import { NumberInput } from '@libs/neumorphism-ui/components/NumberInput';
import { TextInput } from '@libs/neumorphism-ui/components/TextInput';
import type { DialogProps } from '@libs/use-dialog';
import { InputAdornment, Modal } from '@mui/material';
import { StreamResult, StreamStatus } from '@rx-stream/react';
import big, { Big } from 'big.js';
import { MessageBox } from 'components/MessageBox';
import { IconLineSeparator } from 'components/primitives/IconLineSeparator';
import { TxResultRenderer } from 'components/tx/TxResultRenderer';
import { TxFeeList, TxFeeListItem } from 'components/TxFeeList';
import { useAccount } from 'contexts/account';
import { ChangeEvent, useEffect, useMemo } from 'react';
import React, { useCallback } from 'react';
import styled, { useTheme } from 'styled-components';
import { LTVGraph } from './LTVGraph';
import { UIElementProps } from '@libs/ui';
import { TxResultRendering } from '@libs/app-fns';
import { ProvideCollateralFormParams } from './types';
import { ActionButton } from '@libs/neumorphism-ui/components/ActionButton';
import { ViewAddressWarning } from 'components/ViewAddressWarning';
import {
  formatInput,
  formatOutput,
  demicrofy,
  useFormatters,
  microfy,
} from '@anchor-protocol/formatter';
import { BroadcastTxStreamResult } from 'pages/earn/components/types';
import { EstimatedFee, useFeeEstimationFor } from '@libs/app-provider';
import { MsgExecuteContract } from '@terra-money/terra.js';
import { createHookMsg } from '@libs/app-fns/tx/internal';
import { CircleSpinner } from 'react-spinners-kit';

export interface ProvideCollateralDialogParams
  extends UIElementProps,
    ProvideCollateralFormParams {
  txResult: StreamResult<TxResultRendering> | null;
  uTokenBalance: u<bAsset>;
  proceedable: boolean;
  onProceed: (amount: bAsset & NoMicro, txFee: EstimatedFee) => void;
}

export type ProvideCollateralDialogProps =
  DialogProps<ProvideCollateralDialogParams> & {
    renderBroadcastTxResult?: JSX.Element;
  };

function ProvideCollateralDialogBase(props: ProvideCollateralDialogProps) {
  const {
    className,
    closeDialog,
    txResult,
    proceedable,
    onProceed,
    collateral,
    uTokenBalance,
    fallbackBorrowMarket,
    fallbackBorrowBorrower,
    renderBroadcastTxResult,
  } = props;

  const { availablePost, connected, terraWalletAddress } = useAccount();
  const { contractAddress } = useAnchorWebapp();

  const [input, states] = useBorrowProvideCollateralForm(
    collateral,
    uTokenBalance,
    fallbackBorrowMarket,
    fallbackBorrowBorrower,
  );

  const {
    luna: { formatInput: formatUSTInput, demicrofy: demicrofyUST },
  } = useFormatters();

  const updateDepositAmount = useCallback(
    (depositAmount: bAsset & NoMicro) => {
      input({
        depositAmount,
      });
    },
    [input],
  );

  const { ltvToAmount } = states;

  const [estimatedFee, estimatedFeeError, estimateFee] =
    useFeeEstimationFor(terraWalletAddress);

  useEffect(() => {
    if (!connected || !states.depositAmount) {
      return;
    }

    estimateFee([
      // provide_collateral call
      new MsgExecuteContract(
        terraWalletAddress,
        props.collateral.collateral_token,
        {
          send: {
            contract: props.collateral.custody_contract,
            amount: formatInput(
              microfy(states.depositAmount, props.collateral.decimals),
              props.collateral.decimals,
            ),
            msg: createHookMsg({
              deposit_collateral: {},
            }),
          },
        },
      ),
      // lock_collateral call
      new MsgExecuteContract(
        terraWalletAddress,
        contractAddress.moneyMarket.overseer,
        {
          // @see https://github.com/Anchor-Protocol/money-market-contracts/blob/master/contracts/overseer/src/msg.rs#L75
          lock_collateral: {
            collaterals: [
              [
                props.collateral.collateral_token,
                formatInput(
                  microfy(states.depositAmount, props.collateral.decimals),
                  props.collateral.decimals,
                ),
              ],
            ],
          },
        },
      ),
    ]);
  }, [
    terraWalletAddress,
    contractAddress.moneyMarket.overseer,
    props.collateral,
    estimateFee,
    connected,
    states.depositAmount,
  ]);

  const onLtvChange = useCallback(
    (nextLtv: Rate<Big>) => {
      try {
        const nextAmount = ltvToAmount(nextLtv);
        updateDepositAmount(
          formatInput<bAsset>(
            demicrofy(nextAmount, collateral.decimals),
            collateral.decimals,
          ),
        );
      } catch {}
    },
    [updateDepositAmount, ltvToAmount, collateral.decimals],
  );

  // ---------------------------------------------
  // presentation
  // ---------------------------------------------

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
          <IconSpan>
            Provide Collateral{' '}
            <InfoTooltip>
              Provide bAssets as collateral to borrow stablecoins
            </InfoTooltip>
          </IconSpan>
        </h1>

        {!!states.invalidTxFee && (
          <MessageBox>{states.invalidTxFee}</MessageBox>
        )}

        <NumberInput
          className="amount"
          value={states.depositAmount}
          maxIntegerPoinsts={LUNA_INPUT_MAXIMUM_INTEGER_POINTS}
          maxDecimalPoints={LUNA_INPUT_MAXIMUM_DECIMAL_POINTS}
          label="DEPOSIT AMOUNT"
          error={!!states.invalidDepositAmount}
          onChange={({ target }: ChangeEvent<HTMLInputElement>) =>
            updateDepositAmount(target.value as bAsset)
          }
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                {states.collateral.symbol}
              </InputAdornment>
            ),
          }}
        />

        <div className="wallet" aria-invalid={!!states.invalidDepositAmount}>
          <span>{states.invalidDepositAmount}</span>
          <span>
            Wallet:{' '}
            <span
              style={{
                textDecoration: 'underline',
                cursor: 'pointer',
              }}
              onClick={() =>
                updateDepositAmount(
                  formatInput<bAsset>(
                    demicrofy(states.userBAssetBalance, collateral.decimals),
                    collateral.decimals,
                  ),
                )
              }
            >
              {formatOutput(
                demicrofy(states.userBAssetBalance, collateral.decimals),
                {
                  decimals: collateral.decimals,
                },
              )}{' '}
              {states.collateral.symbol}
            </span>
          </span>
        </div>

        <IconLineSeparator style={{ margin: '10px 0' }} />

        <TextInput
          className="limit"
          value={
            states.borrowLimit
              ? formatUSTInput(demicrofyUST(states.borrowLimit))
              : ''
          }
          label="NEW BORROW LIMIT"
          readOnly
          InputProps={{
            readOnly: true,
            endAdornment: (
              <InputAdornment position="end">axlUSDC</InputAdornment>
            ),
            inputMode: 'numeric',
          }}
          style={{ pointerEvents: 'none' }}
        />

        {big(states.currentLtv ?? 0).gt(0) && (
          <figure className="graph">
            <LTVGraph
              disabled={!connected}
              start={0}
              end={states.currentLtv?.toNumber() ?? 0}
              value={states.nextLtv}
              onChange={onLtvChange}
              onStep={states.ltvStepFunction}
            />
          </figure>
        )}

        {states.depositAmount.length > 0 && (
          <TxFeeList className="receipt">
            <TxFeeListItem label={<IconSpan>Tx Fee</IconSpan>}>
              {estimatedFee &&
                big(estimatedFee.txFee).gt(0) &&
                `${formatLuna(demicrofy(estimatedFee.txFee, 6))} Luna`}
              {!estimatedFeeError && !estimatedFee && (
                <span className="spinner">
                  <CircleSpinner size={14} color={theme.colors.positive} />
                </span>
              )}
              {estimatedFeeError}
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
              estimatedFee && onProceed(states.depositAmount, estimatedFee)
            }
          >
            Proceed
          </ActionButton>
        </ViewAddressWarning>
      </Dialog>
    </Modal>
  );
}

export const ProvideCollateralDialog = styled(ProvideCollateralDialogBase)`
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

  .limit {
    width: 100%;
    margin-bottom: 60px;
  }

  .graph {
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
