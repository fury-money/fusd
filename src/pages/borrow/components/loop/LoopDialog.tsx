import {
  ANCHOR_DANGER_RATIO,
  MAX_LOOPS,
} from '@anchor-protocol/app-fns';
import {
  useAnchorBank,
  useAnchorWebapp,
  useBorrowMarketQuery,
  useLSDCollateralQuery,
} from '@anchor-protocol/app-provider';
import {
  formatLuna,
  UST_INPUT_MAXIMUM_DECIMAL_POINTS,
  UST_INPUT_MAXIMUM_INTEGER_POINTS,
} from '@anchor-protocol/notation';
import { CollateralAmount, Luna, Rate, Token, u, UST } from '@anchor-protocol/types';
import { TxResultRendering } from '@libs/app-fns';
import { demicrofy, formatRate } from '@libs/formatter';
import { ActionButton } from '@libs/neumorphism-ui/components/ActionButton';
import { Dialog } from '@libs/neumorphism-ui/components/Dialog';
import { IconSpan } from '@libs/neumorphism-ui/components/IconSpan';
import { InfoTooltip } from '@libs/neumorphism-ui/components/InfoTooltip';
import { NumberInput } from '@libs/neumorphism-ui/components/NumberInput';
import { useConfirm } from '@libs/neumorphism-ui/components/useConfirm';
import { UIElementProps } from '@libs/ui';
import type { DialogProps } from '@libs/use-dialog';
import { Box, Button, InputAdornment, ListItemIcon, ListItemText, Menu, MenuItem, Modal } from '@mui/material';
import {
  StreamDone,
  StreamInProgress,
  StreamResult,
  StreamStatus,
} from '@rx-stream/react';
import { Big } from 'big.js';
import { MessageBox } from 'components/MessageBox';
import { TxResultRenderer } from 'components/tx/TxResultRenderer';
import { TxFeeList, TxFeeListItem } from 'components/TxFeeList';
import { useAccount } from 'contexts/account';
import { ChangeEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import React, { useCallback } from 'react';
import styled, { useTheme } from 'styled-components';
import big from 'big.js';
import { LTVGraph } from '../LTVGraph';
import { isWrappedCollateral, useWhitelistCollateralQuery, WhitelistCollateral, WhitelistWrappedCollateral } from 'queries';
import { useBalances } from 'contexts/balances';
import { EstimatedFee, useFeeEstimationFor } from '@libs/app-provider';
import { MsgExecuteContract } from '@terra-money/feather.js';
import { CircleSpinner } from 'utils/consts';
import { useBorrowLoopForm } from '@anchor-protocol/app-provider/forms/borrow/loop';
import { CavernSlider } from 'pages/liquidation/components/PlaceBidSection';
import { SelectAndTextInputContainerLabel } from '@libs/neumorphism-ui/components/SelectAndTextInputContainer';
import { TokenIcon } from '@anchor-protocol/token-icons';
import { ArrowDropDown } from '@mui/icons-material';
import { useBalance, useLSDBalance } from 'pages/swap/queries/balanceQuery';
import { formatOutput } from '@anchor-protocol/formatter';
import { useGenericTx } from '@anchor-protocol/app-provider/tx/genericTx';
import { ViewAddressWarning } from 'components/ViewAddressWarning';
import { FRONTRUN_SLIPPAGE, LOW_SLIPPAGE, SLIPPAGE_VALUES } from 'pages/swap/swapCard';
import { SlippageSelectorNegativeHelpText } from 'components/SlippageSelector';
import { DiscloseSlippageSelector } from 'components/DiscloseSlippageSelector';
import { useBorrowOverviewData } from 'pages/borrow/logics/useBorrowOverviewData';

export interface BorrowDialogParams extends UIElementProps {
  txResult: StreamResult<TxResultRendering> | null;
  proceedable: boolean;
  onProceed: (
    borrowAmount: UST,
    txFee: EstimatedFee,
    collateral?: WhitelistCollateral,
    collateralAmount?: u<CollateralAmount<Big>>,
  ) => void;
}

interface TxRenderFnProps {
  txResult:
  | StreamInProgress<TxResultRendering<unknown>>
  | StreamDone<TxResultRendering<unknown>>;
  closeDialog: () => void;
}

type TxRenderFn = (props: TxRenderFnProps) => JSX.Element;

export type BorrowDialogProps = DialogProps<BorrowDialogParams> & {
  renderTxResult?: TxRenderFn;
};

function BorrowDialogBase(props: BorrowDialogProps) {
  const {
    className,
    closeDialog,
    onProceed,
    renderTxResult,
  } = props;

  const {
    netAPR,
  } = useBorrowOverviewData();


  const { availablePost, connected, terraWalletAddress } = useAccount();

  const { fetchWalletBalance } = useBalances();
  const {
    tokenBalances: { uLuna },
  } = useAnchorBank();

  const [input, states] = useBorrowLoopForm();

  const [openConfirm, confirmElement] = useConfirm();

  const [estimatedFee, estimatedFeeError, estimateFee, isEstimatingFee] =
    useFeeEstimationFor(terraWalletAddress);

  const updateCollateralAmount = useCallback(
    (nextCollateralAmount: string, maxCollateralAmount: string) => {
      input({
        collateralAmount: nextCollateralAmount as CollateralAmount,
        maxCollateralAmount: maxCollateralAmount as CollateralAmount,
      });
    },
    [input],
  );

  const updateTargetLeverage = useCallback(
    (nextLeverage: string | number) => {
      input({
        targetLeverage: nextLeverage.toString() as Rate,
      });
    },
    [input],
  );

  const updateMaximumLTV = useCallback(
    (maximumLTV: Rate<Big>) => {
      input({
        maximumLTV: maximumLTV.toString() as Rate
      });
    },
    [input],
  );

  const updateSlippage = useCallback(
    (nextSlippage: number) => {
      input({
        slippage: nextSlippage.toString() as Rate
      })
    },
    [input],
  );



  const { data: allCollaterals } = useWhitelistCollateralQuery();

  const allLSDCollaterals: WhitelistWrappedCollateral[] = useMemo(() =>
    (allCollaterals ?? []).filter(isWrappedCollateral)
    , [allCollaterals])

  const onCollateralChanged = useCallback(
    (collateral: WhitelistWrappedCollateral) => {
      input({
        collateral,
        collateralAmount: undefined,
        maxCollateralAmount: undefined,
      });

      fetchWalletBalance(collateral).then((maxCollateralAmount) => {
        input({ maxCollateralAmount: maxCollateralAmount.toString() as CollateralAmount });
      });
    },
    [input, fetchWalletBalance],
  );

  const [proceedGenericTx, txResult] = useGenericTx();

  const proceed = useCallback(
    async (
      msgs: MsgExecuteContract[] | undefined,
      confirm: ReactNode,
    ) => {
      if (!connected || !onProceed || !estimatedFee || !msgs || !availablePost || !proceedGenericTx) {
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
      proceedGenericTx({ msgs, txFee: estimatedFee });
    },
    [onProceed, connected, estimatedFee, openConfirm, availablePost],
  );

  const {
    data: { oraclePrices } = { data: { oraclePrices: undefined } }
  } = useBorrowMarketQuery();


  // ---------------------------------------------
  // Loop token selection
  // ---------------------------------------------

  const [loopToken, setLoopToken] = useState<WhitelistWrappedCollateral | undefined>(allLSDCollaterals[0]);

  const loopTokenBalance = useLSDBalance(loopToken?.info);

  const [collateralAnchorEl, setCollaterallAnchorEl] = useState<null | HTMLElement>(null);
  const collateralDialogOpen = Boolean(collateralAnchorEl);

  useEffect(() => {
    input({
      collateral: loopToken
    })
  }, [loopToken, input])

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setCollaterallAnchorEl(event.currentTarget);
  };

  const handleClose = useCallback((token?: WhitelistWrappedCollateral) => {
    if (token) {
      setLoopToken(token)
      onCollateralChanged(token);
    }
    setCollaterallAnchorEl(null);
  }, [setLoopToken, setCollaterallAnchorEl]);

  useEffect(() => {
    if (!states.executeMsgs) {
      return undefined;
    }
    estimateFee(states.executeMsgs);

  }, [
    states.executeMsgs,
    estimateFee,
  ]);

  // We have to handle the txFee outside of states, or there is a infinite render loop
  const invalidTxFee = useMemo(() => {
    // txFee
    const txFee = (() => {
      if (!connected) {
        return undefined;
      }
      return big(estimatedFee?.txFee ?? "0") as u<Luna<Big>>;
    })();

    return (() => {
      return connected && txFee && big(uLuna).lt(txFee)
        ? "Not enough transaction fees"
        : undefined;
    })();
  }, [estimatedFee?.txFee, uLuna])


  // ---------------------------------------------
  // presentation
  // ---------------------------------------------

  const theme = useTheme();

  if (
    txResult?.status === StreamStatus.IN_PROGRESS ||
    txResult?.status === StreamStatus.DONE
  ) {
    return (
      <Modal open disableEnforceFocus>
        <Dialog className={className}>
          {renderTxResult ? (
            renderTxResult({ txResult, closeDialog })
          ) : (
            <TxResultRenderer
              resultRendering={txResult.value}
              onExit={closeDialog}
            />
          )}
        </Dialog>
      </Modal>
    );
  }

  return (
    <Modal open onClose={() => closeDialog()} sx={{ overflowY: "scroll" }}>
      <Dialog className={className} onClose={() => closeDialog()}>
        <h1>
          Borrow with Leverage{' '}
          <p>
            <IconSpan>
              Borrow APY : {formatRate(netAPR)}%{' '}
              <InfoTooltip>
                Current rate of annualized borrowing interest applied for this
                stablecoin
              </InfoTooltip>
            </IconSpan>
          </p>
        </h1>

        {!!invalidTxFee && (
          <MessageBox>{invalidTxFee}</MessageBox>
        )}


        {/* Collateral amount */}
        <NumberInput
          className="amount"
          value={states.collateralAmount}
          maxIntegerPoinsts={UST_INPUT_MAXIMUM_INTEGER_POINTS}
          maxDecimalPoints={UST_INPUT_MAXIMUM_DECIMAL_POINTS}
          label="Initial collateral deposit"
          error={!!states.invalidCollateralAmount}
          onChange={({ target }: ChangeEvent<HTMLInputElement>) => {
            updateCollateralAmount(target.value, loopTokenBalance)
          }
          }
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                {/* Collateral looping selection */}
                <SelectAndTextInputContainerLabel>
                  <Button
                    id="basic-button"
                    aria-controls={collateralDialogOpen ? 'basic-menu' : undefined}
                    aria-haspopup="true"
                    aria-expanded={collateralDialogOpen ? 'true' : undefined}
                    onClick={(event) => handleClick(event)}
                    sx={{ color: theme.textColor, textTransform: "unset" }}
                  >
                    <TokenIcon token={loopToken?.info.info.symbol} /> {loopToken?.info.info.symbol} <ArrowDropDown />
                  </Button>
                  <Menu
                    id="basic-menu"
                    anchorEl={collateralAnchorEl}
                    open={collateralDialogOpen}
                    onClose={() => handleClose()}
                    MenuListProps={{
                      'aria-labelledby': 'basic-button',
                    }}
                  >
                    {allLSDCollaterals.map(collateral => {
                      return (
                        <MenuItem key={`${collateral.name}`} onClick={() => handleClose(collateral)}>
                          <ListItemIcon>
                            <TokenIcon token={collateral.info.info.symbol} />
                          </ListItemIcon>
                          <ListItemText>
                            {collateral.info.info.symbol}
                          </ListItemText>
                        </MenuItem>
                      )
                    })}
                  </Menu>
                </SelectAndTextInputContainerLabel>
              </InputAdornment>

            ),
          }}
        />

        <div
          className="wallet"
          aria-invalid={
            !!states.invalidCollateralAmount
          }
        >
          <span>{states.invalidCollateralAmount}</span>
          <span>
            <span
              style={{
                textDecoration: 'underline',
                cursor: 'pointer',
              }}
              onClick={() => {
                updateTargetLeverage(states.maximumLeverage.toFixed(2))
              }
              }
            >
              Max : {formatOutput(demicrofy(loopTokenBalance as u<Token>))} {loopToken?.info.info.symbol}
            </span>
          </span>

        </div>
        <div
          style={{ marginBottom: "-40px", marginTop: "40px" }}
        >
          Maximum Borrow Usage
        </div>
        <figure className="graph">
          <LTVGraph
            disabled={!connected}
            borrowLimit={undefined}
            start={0}
            end={ANCHOR_DANGER_RATIO}
            value={big(states.maximumLTV) as Rate<Big>}
            onChange={updateMaximumLTV}
            onStep={undefined}

          />
        </figure>

        <div
          style={{ marginTop: "-30px", marginBottom: "30px" }}
          className="wallet"
          aria-invalid={
            !!states.invalidLTV
          }
        >
          <span>{states.invalidLTV}</span>
          {' '}
        </div>

        {!states.invalidLTV && <>
          <div style={{ marginBottom: "10px" }}>
            Target Leverage
          </div>
          <CavernSlider
            value={parseFloat(states.targetLeverage)}
            defaultValue={1 + parseFloat(states.collateral?.max_ltv ?? "0.6")}
            step={1 / 100}
            min={states.minimumLeverage}
            max={parseFloat(states.maximumLeverage.toFixed(2))}
            aria-labelledby="discrete-slider"
            valueLabelDisplay="auto"
            onChange={(
              { target }: Event,
              newValue: number | number[],
            ) => {
              updateTargetLeverage(Array.isArray(newValue) ? newValue[0] : newValue)
            }}
            valueLabelFormat={(value) => `${value}x`}
          />
          <div
            className="wallet"
            aria-invalid={
              !!states.invalidLeverage
            }
          >
            <span>{states.invalidLeverage}</span>
            {' '}
            <span>
              <span
                style={{
                  textDecoration: 'underline',
                  cursor: 'pointer',
                }}
                onClick={() => {
                  updateTargetLeverage((states.maximumLeverage).toFixed(2))
                }
                }
              >
                Max : {states.maximumLeverage.toFixed(2)}x
              </span>
            </span>
          </div>

          <div style={{ margin: "20px auto" }}>
            <DiscloseSlippageSelector
              className="slippage"
              items={SLIPPAGE_VALUES}
              value={parseFloat(states.slippage)}
              onChange={updateSlippage}
              helpText={
                parseFloat(states.slippage) < LOW_SLIPPAGE ? (
                  <SlippageSelectorNegativeHelpText>
                    The transaction may fail
                  </SlippageSelectorNegativeHelpText>
                ) : parseFloat(states.slippage) > FRONTRUN_SLIPPAGE ? (
                  <SlippageSelectorNegativeHelpText>
                    The transaction may be frontrun
                  </SlippageSelectorNegativeHelpText>
                ) : undefined
              }
            />
          </div>

          <Box sx={{ gap: "10px", display: "flex", flexDirection: "column" }}>
            {states.numberOfLoops && !states.finalLoopData && !states.loopError &&
              <span className="spinner" style={{ margin: "auto" }}>
                <CircleSpinner size={50} color={theme.colors.positive} />
              </span>
            }
            {
              states.allLoopData?.map(({ provideAmount, stableAmount }, i) => {
                return (<div key={`provideAmount-${i}`}>
                  Loop n° {i + 1}
                  <div className="wallet">
                    <span>
                      Provide Amount
                    </span>
                    {' '}
                    <span>
                      {formatOutput(demicrofy(provideAmount))} {loopToken?.info.info.symbol}
                    </span>
                  </div>
                  <div className="wallet">
                    <span>
                      Borrow Amount
                    </span>
                    {' '}
                    <span>
                      {formatOutput(demicrofy(stableAmount))} axlUSDC
                    </span>
                  </div>
                </div>)
              })
            }
            {states.finalLoopData &&
              <div className="wallet" style={{ marginTop: "15px" }}>
                <span>
                  Collateral left in wallet after looping
                </span>
                {' '}
                <span>
                  {formatOutput(demicrofy(states.finalLoopData))} {loopToken?.info.info.symbol}
                </span>
              </div>
            }
            {<Box sx={{ color: theme.colors.negative }}>{states.loopError}</Box>}
            {states?.swapSimulation?.quote.price_impact &&
              <div className="wallet" style={{ marginTop: "15px" }}>
                <span>
                  TFM Swap Price Impact
                </span>
                {' '}
                <span>
                  {formatRate((states.swapSimulation.quote.price_impact) as Rate<number>)} %
                </span>
              </div>
            }

          </Box>



          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", marginTop: "20px" }}>
            <div className="wallet">
              <span>
                Loop Number (Max : {MAX_LOOPS})
              </span>
              {' '}
              <span>
                {states.numberOfLoops}
              </span>
            </div>
          </div>
          {(estimatedFee || estimatedFeeError || isEstimatingFee) && <TxFeeList className="receipt">
            <TxFeeListItem label={<IconSpan>Tx Fee</IconSpan>}>
              {estimatedFee &&
                big(estimatedFee.txFee).gt(0) &&
                `${formatLuna(demicrofy(estimatedFee.txFee))} Luna`}
              {(!estimatedFeeError && !estimatedFee) && (
                <span className="spinner">
                  <CircleSpinner size={18} color={theme.colors.positive} />
                </span>
              )}
              {estimatedFeeError}
            </TxFeeListItem>
          </TxFeeList>}
          {estimatedFee &&

            <ViewAddressWarning>
              <div style={{ textAlign: "center", marginTop: "10px" }}>
                <ActionButton
                  style={{ padding: "10px", margin: "auto" }}
                  className="estimateFee"
                  disabled={
                    !connected ||
                    !loopToken ||
                    !terraWalletAddress ||
                    !states.collateralAmount ||
                    !oraclePrices ||
                    !states.executeMsgs ||
                    !availablePost
                  }
                  onClick={() => proceed(states.executeMsgs, states.warningOverSafeLtv)}
                >
                  Loop !
                </ActionButton>

              </div>
            </ViewAddressWarning>
          }
        </>

        }
        {confirmElement}
      </Dialog>
    </Modal>
  );
}

export const LoopDialogComponent = styled(BorrowDialogBase)`
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
  }

  .graph {
    margin-top: 70px;
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
