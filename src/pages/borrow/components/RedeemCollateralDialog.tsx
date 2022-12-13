import { ANCHOR_SAFE_RATIO } from '@anchor-protocol/app-fns';
import {
  useAnchorWebapp,
  useBorrowRedeemCollateralForm,
} from '@anchor-protocol/app-provider';
import {
  formatLuna,
  LUNA_INPUT_MAXIMUM_DECIMAL_POINTS,
  LUNA_INPUT_MAXIMUM_INTEGER_POINTS,
} from '@anchor-protocol/notation';
import { bAsset, NoMicro, Rate, u } from '@anchor-protocol/types';
import { TxResultRendering } from '@libs/app-fns';
import { ActionButton } from '@libs/neumorphism-ui/components/ActionButton';
import { Dialog } from '@libs/neumorphism-ui/components/Dialog';
import { IconSpan } from '@libs/neumorphism-ui/components/IconSpan';
import { InfoTooltip } from '@libs/neumorphism-ui/components/InfoTooltip';
import { NumberInput } from '@libs/neumorphism-ui/components/NumberInput';
import { TextInput } from '@libs/neumorphism-ui/components/TextInput';
import { UIElementProps } from '@libs/ui';
import type { DialogProps } from '@libs/use-dialog';
import { InputAdornment, Modal } from '@mui/material';
import { StreamResult, StreamStatus } from '@rx-stream/react';
import { Big } from 'big.js';
import { MessageBox } from 'components/MessageBox';
import { IconLineSeparator } from 'components/primitives/IconLineSeparator';
import { TxResultRenderer } from 'components/tx/TxResultRenderer';
import { TxFeeList, TxFeeListItem } from 'components/TxFeeList';
import { ViewAddressWarning } from 'components/ViewAddressWarning';
import { useAccount } from 'contexts/account';
import React, { ChangeEvent, useCallback, useEffect, useMemo } from 'react';
import styled, { useTheme } from 'styled-components';
import { LTVGraph } from './LTVGraph';
import { RedeemCollateralFormParams } from './types';
import {
  formatInput,
  formatOutput,
  demicrofy,
  useFormatters,
  microfy,
} from '@anchor-protocol/formatter';
import { BroadcastTxStreamResult } from 'pages/earn/components/types';
import big from 'big.js';
import { EstimatedFee, useFeeEstimationFor } from '@libs/app-provider';
import { MsgExecuteContract } from '@terra-money/terra.js';
import { CircleSpinner } from 'react-spinners-kit';

export interface RedeemCollateralDialogParams
  extends UIElementProps,
    RedeemCollateralFormParams {
  txResult: StreamResult<TxResultRendering> | null;
  uTokenBalance: u<bAsset>;
  proceedable: boolean;
  onProceed: (amount: bAsset & NoMicro, txFee: EstimatedFee) => void;
}

export type RedeemCollateralDialogProps =
  DialogProps<RedeemCollateralDialogParams> & {
    renderBroadcastTxResult?: JSX.Element;
  };

function RedeemCollateralDialogBase(props: RedeemCollateralDialogProps) {
  const {
    className,
    closeDialog,
    collateral,
    fallbackBorrowMarket,
    fallbackBorrowBorrower,
    txResult,
    uTokenBalance,
    proceedable,
    onProceed,
    renderBroadcastTxResult,
  } = props;

  const { availablePost, connected, terraWalletAddress } = useAccount();
  const { contractAddress } = useAnchorWebapp();

  const {
    ust: { formatInput: formatUSTInput, demicrofy: demicrofyUST },
  } = useFormatters();

  const [input, states] = useBorrowRedeemCollateralForm(
    collateral,
    uTokenBalance,
    fallbackBorrowMarket,
    fallbackBorrowBorrower,
  );

  const updateRedeemAmount = useCallback(
    (nextRedeemAmount: bAsset & NoMicro) => {
      input({ redeemAmount: nextRedeemAmount });
    },
    [input],
  );

  const [estimatedFee, estimatedFeeError, estimateFee] =
    useFeeEstimationFor(terraWalletAddress);

  useEffect(() => {
    if (!connected || !states.redeemAmount) {
      return;
    }

    estimateFee([
      // unlock collateral
      new MsgExecuteContract(
        terraWalletAddress,
        contractAddress.moneyMarket.overseer,
        {
          // @see https://github.com/Anchor-Protocol/money-market-contracts/blob/master/contracts/overseer/src/msg.rs#L78
          unlock_collateral: {
            collaterals: [
              [
                props.collateral.collateral_token,
                formatInput(
                  microfy(states.redeemAmount, props.collateral.decimals),
                  props.collateral.decimals,
                ),
              ],
            ],
          },
        },
      ),

      // withdraw from custody
      new MsgExecuteContract(
        terraWalletAddress,
        props.collateral.custody_contract,
        {
          // @see https://github.com/Anchor-Protocol/money-market-contracts/blob/master/contracts/custody/src/msg.rs#L69
          withdraw_collateral: {
            amount: formatInput(
              microfy(states.redeemAmount, props.collateral.decimals),
              props.collateral.decimals,
            ),
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
    states.redeemAmount,
  ]);

  const onLtvChange = useCallback(
    (nextLtv: Rate<Big>) => {
      const ltvToAmount = states.ltvToAmount;
      try {
        const nextAmount = ltvToAmount(nextLtv);
        input({
          redeemAmount: formatInput<bAsset>(
            demicrofy(nextAmount, collateral.decimals),
            collateral.decimals,
          ),
        });
      } catch {}
    },
    [input, states.ltvToAmount, collateral.decimals],
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
            Withdraw Collateral{' '}
            <InfoTooltip>Withdraw aAsset to your wallet</InfoTooltip>
          </IconSpan>
        </h1>

        {!!states.invalidTxFee && (
          <MessageBox>{states.invalidTxFee}</MessageBox>
        )}

        <NumberInput
          className="amount"
          value={states.redeemAmount}
          maxIntegerPoinsts={LUNA_INPUT_MAXIMUM_INTEGER_POINTS}
          maxDecimalPoints={LUNA_INPUT_MAXIMUM_DECIMAL_POINTS}
          label="WITHDRAW AMOUNT"
          error={!!states.invalidRedeemAmount}
          onChange={({ target }: ChangeEvent<HTMLInputElement>) =>
            updateRedeemAmount(target.value as bAsset)
          }
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                {states.collateral.symbol}
              </InputAdornment>
            ),
          }}
        />

        <div className="wallet" aria-invalid={!!states.invalidRedeemAmount}>
          <span>{states.invalidRedeemAmount}</span>
          <span>
            Withdrawable:{' '}
            <span
              style={{
                textDecoration: 'underline',
                cursor: 'pointer',
              }}
              onClick={() =>
                states.withdrawableAmount &&
                updateRedeemAmount(
                  formatInput(
                    demicrofy(states.withdrawableAmount, collateral.decimals),
                    collateral.decimals,
                  ),
                )
              }
            >
              {states.withdrawableAmount
                ? formatOutput(
                    demicrofy(states.withdrawableAmount, collateral.decimals),
                    {
                      decimals: 3,
                    },
                  )
                : 0}{' '}
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
          }}
          style={{ pointerEvents: 'none' }}
        />

        <figure className="graph">
          <LTVGraph
            disabled={!connected}
            start={states.currentLtv?.toNumber() ?? 0}
            end={1}
            value={states.nextLtv}
            onChange={onLtvChange}
            onStep={states.ltvStepFunction}
          />
        </figure>

        {states.nextLtv?.gt(ANCHOR_SAFE_RATIO) && (
          <MessageBox
            level="error"
            hide={{
              id: 'redeem-collateral-ltv',
              period: 1000 * 60 * 60 * 24 * 5,
            }}
            style={{ userSelect: 'none', fontSize: 12 }}
          >
            Caution: As current borrow usage is above the recommended amount,
            fluctuations in collateral value may trigger immediate liquidations.
            It is strongly recommended to keep the borrow usage below the
            maximum by repaying loans with stablecoins or providing additional
            collateral.
          </MessageBox>
        )}

        {states.redeemAmount.length > 0 && big(states.txFee).gt(0) && (
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
              estimatedFee &&
              onProceed(
                states.redeemAmount.length > 0
                  ? states.redeemAmount
                  : ('0' as bAsset),
                estimatedFee,
              )
            }
          >
            Proceed
          </ActionButton>
        </ViewAddressWarning>
      </Dialog>
    </Modal>
  );
}

export const RedeemCollateralDialog = styled(RedeemCollateralDialogBase)`
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
