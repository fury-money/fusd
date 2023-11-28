import { IconSpan } from '@libs/neumorphism-ui/components/IconSpan';
import { InfoTooltip } from '@libs/neumorphism-ui/components/InfoTooltip';
import { screen } from 'env';

import React, {
  ChangeEvent,
  Dispatch,
  ReactNode,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  FormControlLabel,
  Radio,
  Slider,
  InputAdornment,
  OutlinedInput,
  Button,
  Modal,
  Checkbox,
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import { useAccount } from 'contexts/account';
import { PaddingSection } from './PaddingSection';
import { useLiquidationDepositForm } from '@anchor-protocol/app-provider/forms/liquidate/deposit';
import { useFormatters } from '@anchor-protocol/formatter';
import { HumanAddr, Luna, Token, u, UST } from '@libs/types';
import { AmountSlider } from './AmountSlider';
import big, { Big, BigSource } from 'big.js';
import {
  UST_INPUT_MAXIMUM_DECIMAL_POINTS,
  UST_INPUT_MAXIMUM_INTEGER_POINTS,
} from '@anchor-protocol/notation';
import { NumberInput } from '@libs/neumorphism-ui/components/NumberInput';
import styled, { useTheme } from 'styled-components';
import { usePlaceLiquidationBidTx } from '@anchor-protocol/app-provider/tx/liquidate/deposit';
import { useConfirm } from '@libs/neumorphism-ui/components/useConfirm';
import { TxFeeList, TxFeeListItem } from 'components/TxFeeList';
import { StreamStatus } from '@rx-stream/react';
import { TxResultRenderer } from 'components/tx/TxResultRenderer';
import { BroadcastTxStreamResult } from './types';
import { Dialog } from '@libs/neumorphism-ui/components/Dialog';
import {
  useAnchorWebapp,
} from '@anchor-protocol/app-provider';
import { useLiquidationWithdrawCollateralForm } from '@anchor-protocol/app-provider/forms/liquidate/collateral';
import { useLiquidationWithdrawCollateralTx } from '@anchor-protocol/app-provider/tx/liquidate/collateral';
import {
  defaultFee,
  EstimatedFee,
  useFeeEstimationFor,
} from '@libs/app-provider';
import { pressed } from '@libs/styled-neumorphism';
import { TextInput } from '@libs/neumorphism-ui/components/TextInput';
import { Coin, Coins, MsgExecuteContract } from '@terra-money/feather.js';
import { formatTokenInput } from '@libs/formatter';
import { CircleSpinner } from 'utils/consts';
import { useMediaQuery } from 'react-responsive';
import { useWithdrawDefaultedCollateral } from './useWithdrawDefaultedCollateral';
import { getLiquidationWithdrawCollateralMsg } from '@anchor-protocol/app-fns/tx/liquidate/collateral';
import { CollateralInfo } from 'pages/borrow/components/useCollaterals';

export interface PlaceBidSectionProps {
  className?: string;
  collateral: CollateralInfo | undefined
  clickedBarState: [
    number | undefined,
    Dispatch<SetStateAction<number | undefined>>,
  ];
}

export function PlaceBidSectionBase({
  className,
  clickedBarState: [clickedBar, setClickedBar],
  collateral
}: PlaceBidSectionProps) {
  const { connected, terraWalletAddress, availablePost } = useAccount();
  const { contractAddress } = useAnchorWebapp();

  const [acceptedTerms, setAcceptedTerms] = useState(false);


  const {
    axlUSDC: { formatInput, formatOutput, demicrofy, symbol },
    luna,
  } = useFormatters();

  const { withdrawableWrapper, withdrawableLSD, withdrawableUnderlying, withdrawableText } = useWithdrawDefaultedCollateral(collateral);
  console.log(withdrawableLSD.toString(), withdrawableUnderlying.toString())
  /*******************************
   *
   * Place Bid Submit Section
   *
   * *****************************/

  const state = useLiquidationDepositForm();
  const [openConfirm, confirmElement] = useConfirm();
  const [placeBid, placeBidTxResult] = usePlaceLiquidationBidTx(collateral?.collateral);
  const [estimatedFee, estimatedFeeError, estimateFee] =
    useFeeEstimationFor(terraWalletAddress);
  const [isSubmittingBidTx, setIsSubmittingBidTx] = useState(false);

  // Proceed callback --> Submit transaction
  const proceedBid = useCallback(
    async (
      depositAmount: UST,
      premium: number,
      txFee: EstimatedFee | undefined,
      confirm: ReactNode,
    ) => {

      setIsSubmittingBidTx(true);
      if (!connected || !placeBid) {
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

      placeBid({
        depositAmount,
        premium,
        txFee: txFee ?? defaultFee(),
      });
    },
    [connected, placeBid, openConfirm],
  );

  // Update form with fee estimate Effect
  useEffect(() => {
    state.updateEstimatedFee(estimatedFee);
  }, [estimatedFee, state]);

  // Update fee estimate Effect
  useEffect(() => {
    if (!connected || !state.depositAmount || !collateral) {
      return;
    }
    estimateFee([
      new MsgExecuteContract(
        terraWalletAddress as string,
        contractAddress.liquidation.liquidationQueueContract,
        {
          submit_bid: {
            collateral_token: collateral?.collateral.collateral_token,
            premium_slot: state.premium,
          },
        },

        // coins
        new Coins([
          new Coin(
            contractAddress.native.usd,
            formatTokenInput(big(state.depositAmount) as Token<BigSource>),
          ),
        ]),
      ),
    ]);
  }, [
    terraWalletAddress,
    contractAddress,
    state.depositAmount,
    state.premium,
    estimateFee,
    connected,
  ]);

  const renderBroadcastBidTx = useMemo(() => {
    return (
      <TxResultRenderer
        resultRendering={(placeBidTxResult as BroadcastTxStreamResult)?.value}
        onExit={() => setIsSubmittingBidTx(false)}
      />
    );
  }, [placeBidTxResult]);

  /*******************************
   *
   * Withdraw liquidated Collateral Submit Section
   *
   * *****************************/
  const collateralState = useLiquidationWithdrawCollateralForm();
  const [estimatedWithdrawalFee, estimatedWithdrawalFeeError, estimateWithdrawalFee] =
    useFeeEstimationFor(terraWalletAddress);
  useEffect(() => {
    if (!collateral || !withdrawableLSD || withdrawableLSD.eq(0) || !withdrawableUnderlying || withdrawableUnderlying.eq(0)) {
      return;
    }
    estimateWithdrawalFee(
      getLiquidationWithdrawCollateralMsg({
        walletAddr: terraWalletAddress as HumanAddr,
        liquidationQueueAddr:
          contractAddress.liquidation.liquidationQueueContract,
        collateral,
        withdrawLpAssets: collateralState.withdrawLpAssets,
        withdrawableLSD,
        withdrawableUnderlying,
      })
    );
  }, [
    terraWalletAddress,
    contractAddress.liquidation.liquidationQueueContract,
    collateral,
    collateralState.withdrawLpAssets,
    withdrawableLSD,
    withdrawableUnderlying
  ]);

  const [withdrawCollateralTx, withdrawCollateralTxResult] =
    useLiquidationWithdrawCollateralTx(collateral);
  const [isSubmittingCollateralTx, setIsSubmittingCollateralTx] =
    useState(false);

  const proceedWithdrawCollateral = useCallback(
    async (txFee: EstimatedFee | undefined, confirm: ReactNode) => {
      setIsSubmittingCollateralTx(true);

      if (!connected || !withdrawCollateralTx) {
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

      withdrawCollateralTx({
        txFee: txFee ?? defaultFee(),
        withdrawLpAssets: collateralState?.withdrawLpAssets,
      });
    },
    [connected, withdrawCollateralTx, openConfirm, collateralState?.withdrawLpAssets, setIsSubmittingCollateralTx],
  );


  const handleSliderChange = useCallback(
    (newValue: any) => {
      state.updatePremiumValue(newValue);
    },
    [state],
  );
  const handleInputChange = (event: any) => {
    state.updatePremiumValue(
      event.target.value === '' ? undefined : Number(event.target.value),
    );
  };

  /*******************************
   * Update the premium based on the bars clicked
   *
   *
   * ******************************/

  useEffect(() => {
    if (clickedBar == undefined) {
      return;
    }
    handleSliderChange(clickedBar);
    setClickedBar(undefined);
  }, [setClickedBar, clickedBar, handleSliderChange]);

  /******************************
   * Render
   *
   *********************************/

  const theme = useTheme();
  const isVeryLarge = useMediaQuery({ minWidth: screen.monitor.min })

  const renderBroadcastCollateralTx = useMemo(() => {
    return (
      <TxResultRenderer
        resultRendering={
          (withdrawCollateralTxResult as BroadcastTxStreamResult)?.value
        }
        onExit={() => setIsSubmittingCollateralTx(false)}
      />
    );
  }, [withdrawCollateralTxResult]);

  return (
    <PaddingSection className={className} padding="20px 20px">
      <h2>
        <IconSpan>
          Place Bid{' '}
          <InfoTooltip>
            Use the following form to place a bid in the liquidation queue
          </InfoTooltip>
        </IconSpan>
      </h2>
      {isSubmittingBidTx &&
        (placeBidTxResult?.status === StreamStatus.IN_PROGRESS ||
          placeBidTxResult?.status === StreamStatus.DONE) && (
          <Modal open disableEnforceFocus>
            <Dialog
              className={className}
              style={{ width: 720, touchAction: 'none' }}
            >
              {renderBroadcastBidTx}
            </Dialog>
          </Modal>
        )}
      {isSubmittingCollateralTx &&
        (withdrawCollateralTxResult?.status === StreamStatus.IN_PROGRESS ||
          withdrawCollateralTxResult?.status === StreamStatus.DONE) && (
          <Modal open disableEnforceFocus>
            <Dialog
              className={className}
              style={{ width: 720, touchAction: 'none' }}
            >
              {renderBroadcastCollateralTx}
            </Dialog>
          </Modal>
        )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          proceedBid(
            state.depositAmount,
            state.premium ?? 0,
            state.estimatedFee,
            state.invalidNextTxFee,
          );
        }}
      >
        <Grid container spacing={3}>
          <Grid xs={12}>
            <Typography id="input-slider" gutterBottom>
              Premium ({collateral?.collateral.symbol} discount)
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid xs={12} sm={8}>
                <CavernSlider
                  value={state.premium || 0}
                  defaultValue={5}
                  step={1}
                  marks
                  min={0}
                  max={30}
                  aria-labelledby="discrete-slider"
                  valueLabelDisplay="auto"
                  onChange={(
                    { target }: Event,
                    newValue: number | number[],
                  ) => {
                    handleSliderChange(newValue);
                  }}
                  valueLabelFormat={(value) => `${value}%`}
                />
              </Grid>
              <Grid xs={12} sm={4}>
                <TextInput
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">%</InputAdornment>
                    ),
                  }}
                  fullWidth
                  value={state.premium ?? ''}
                  margin="dense"
                  onChange={handleInputChange}
                  error={!!state.invalidPremium}
                  inputProps={{
                    'step': 1,
                    'min': 0,
                    'max': 30,
                    'type': 'number',
                    'aria-labelledby': 'input-slider',
                  }}
                />
              </Grid>
            </Grid>
            <div
              className="premium-error"
              aria-invalid={!!state.invalidPremium}
            >
              <span>
                {' '}
                {state.invalidPremium}
              </span>
            </div>
          </Grid>

          <Grid xs={12}>
            <Grid container spacing={1}>
              <Grid xs={12}>
                <Typography id="input-slider" gutterBottom>
                  Bid amount
                </Typography>
                <NumberInput
                  className="amount"
                  value={state.depositAmount}
                  maxIntegerPoinsts={UST_INPUT_MAXIMUM_INTEGER_POINTS}
                  maxDecimalPoints={UST_INPUT_MAXIMUM_DECIMAL_POINTS}
                  error={!!state.invalidDepositAmount}
                  label="AMOUNT"
                  onChange={({ target }: ChangeEvent<HTMLInputElement>) => {
                    state.updateDepositAmount(target.value as UST);
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">axlUSDC</InputAdornment>
                    ),
                  }}
                />
                <div
                  className="wallet"
                  aria-invalid={!!state.invalidDepositAmount}
                >
                  <span>{state.invalidDepositAmount}</span>
                  <span>
                    Max:{' '}
                    <span
                      style={
                        state.maxAmount
                          ? {
                            textDecoration: 'underline',
                            cursor: 'pointer',
                          }
                          : undefined
                      }
                      onClick={() =>
                        state.maxAmount &&
                        state.updateDepositAmount(
                          formatInput(demicrofy(state.maxAmount)),
                        )
                      }
                    >
                      {state.maxAmount
                        ? formatOutput(demicrofy(state.maxAmount))
                        : 0}{' '}
                      {symbol}
                    </span>
                  </span>
                </div>
              </Grid>

              <Grid xs={12}>
                {big(state.maxAmount).gt(0) && (
                  <figure className="graph">
                    <AmountSlider
                      disabled={!connected}
                      max={Number(demicrofy(state.maxAmount))}
                      txFee={Number(
                        demicrofy(state.estimatedFee?.txFee ?? ('0' as UST)),
                      )}
                      value={Number(state.depositAmount)}
                      onChange={(value) => {
                        state.updateDepositAmount(
                          formatInput(value.toString() as UST),
                        );
                      }}
                    />
                  </figure>
                )}
              </Grid>
            </Grid>
          </Grid>

          <Grid xs={12}>
            <FormControlLabel
              control={<Radio color="default" value="accept-terms" />}
              onChange={() => setAcceptedTerms(true)}
              label={
                <Typography variant="body2">
                  Accept that you are using this queue at you own risks
                </Typography>
              }
              labelPlacement="end"
              aria-describedby="bid-terms-helper-text"
            />

            {connected && state.depositAmount && (
              <TxFeeList className="receipt">
                <TxFeeListItem label={<IconSpan>Tx Fee</IconSpan>}>
                  {estimatedFeeError}

                  {!estimatedFeeError && !state.estimatedFee && (
                    <CircleSpinner size={18} color={theme.colors.positive} />
                  )}

                  {!estimatedFeeError &&
                    state.estimatedFee &&
                    big(state.estimatedFee?.txFee ?? '0').gt(0) &&
                    `${luna.formatOutput(
                      luna.demicrofy(
                        state.estimatedFee?.txFee ?? ('0' as u<Luna>),
                      ),
                    )} ${luna.symbol}`}
                </TxFeeListItem>
              </TxFeeList>
            )}
            <Button
              variant="contained"
              fullWidth
              type="submit"
              color="primary"
              disabled={
                !connected ||
                !state.depositAmount ||
                !acceptedTerms ||
                !proceedBid ||
                !!state.invalidPremium ||
                !!state.invalidDepositAmount
              }
              className="place-bid-button"
            >
              Place My Bid
            </Button>
          </Grid>
          <Grid xs={12} style={{ padding: '12px 0px', marginTop: 20 }}>
            <h2>
              <IconSpan>
                Withdraw defaulted collateral{' '}
                <InfoTooltip>
                  Use the following form to withdraw collateral that was
                  defaulted thanks to your deposit in the pool
                </InfoTooltip>
              </IconSpan>
            </h2>
            <Grid container spacing={1}>
              <Grid xs={12}>
                <OutlinedInput
                  fullWidth
                  value={withdrawableText}
                  sx={{
                    fontSize: isVeryLarge ? "30px" : "3em",
                    caretColor: 'transparent'
                  }}
                />
              </Grid>
              {(collateral?.collateral.type == "spectrum_lp" || collateral?.collateral.type == "amp_lp") &&
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={collateralState.withdrawLpAssets}
                      onChange={(event) => collateralState.updateWithdrawLpAssets(event.target.checked)} />
                  }
                  label="Withdraw assets from LP" />
              }
              <TxFeeList className="receipt">
                <TxFeeListItem label={<IconSpan>Tx Fee</IconSpan>}>
                  {estimatedWithdrawalFeeError}
                  {(!estimatedWithdrawalFeeError && (!estimatedWithdrawalFee ||
                    (!big(estimatedWithdrawalFee?.txFee ?? ('0' as u<Luna>)).gt(
                      0,
                    )))) && (
                      <CircleSpinner size={18} color={theme.colors.positive} />
                    )}
                  {!estimatedWithdrawalFeeError && !!estimatedWithdrawalFee?.txFee &&
                    big(estimatedWithdrawalFee?.txFee).gt(0) &&
                    `${luna.formatOutput(
                      luna.demicrofy(estimatedWithdrawalFee?.txFee),
                    )} ${luna.symbol}`}
                </TxFeeListItem>
              </TxFeeList>
              <Grid xs={12}>
                <Button
                  variant="contained"
                  fullWidth
                  color="primary"
                  disabled={
                    !connected ||
                    !withdrawableLSD ||
                    !estimatedWithdrawalFee ||
                    withdrawableLSD.eq(big(0)) ||
                    !proceedWithdrawCollateral ||
                    !availablePost
                  }
                  onClick={() =>
                    proceedWithdrawCollateral(
                      estimatedWithdrawalFee,
                      collateralState.invalidNextTxFee,
                    )
                  }
                >
                  Withdraw
                </Button>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </form>
      {confirmElement}
    </PaddingSection>
  );
}

export const CavernSlider = styled(Slider)`
  & {
    height: 12px !important;
    color: ${({ theme }) => theme.colors.positive} !important;
    padding: 1px !important;
    ${({ theme }) =>
    pressed({
      color: theme.textInput.backgroundColor,
      backgroundColor: theme.backgroundColor,
      intensity: theme.intensity,
      distance: 1,
    })};

    & .MuiSlider-thumb {
      box-shadow: 0px 0px 6px 2px rgba(0, 0, 0, 0.18);
      background-color: ${({ theme }) => theme.slider.thumb.thumbColor};
    }

    & .MuiSlider-valueLabel {
      background-color: ${({ theme }) => theme.colors.positive};
      border-radius: 3px;
      padding-left: 10px;
      padding-right: 10px;
      z-index: 1;
    }

    & .MuiSlider-thumb:after {
      background-color: darkgray;
      position: absolute;
      height: 4px;
      width: 4px;
      left: 50%;
      border-radius: 50%;
    }

    & .MuiSlider-thumb:hover,
    .MuiSlider-thumb.Mui-focusVisible {
      box-shadow: 0px 0px 6px 2px rgba(0, 0, 0, 0.18) !important;
    }

    & .MuiSlider-rail {
      color: rgba(0, 0, 0, 0);
    }
  }
`;

export const PlaceBidSection = styled(PlaceBidSectionBase)`
  .amount {
    width: 100%;
    margin-bottom: 5px;

    .MuiTypography-colorTextSecondary {
      color: currentColor;
    }
  }
  .graph {
    margin-top: 80px;
    margin-bottom: 10px;
  }

  .receipt {
    width: 100%;
  }

  .place-bid-button {
    margin-top: 30px;
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
  .premium-error {
    display: flex;
    justify-content: flex-end;

    font-size: 12px;
    color: ${({ theme }) => theme.dimTextColor};

    &[aria-invalid='true'] {
      color: ${({ theme }) => theme.colors.negative};
    }
  }
`;
