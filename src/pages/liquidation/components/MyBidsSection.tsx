import { IconSpan } from '@libs/neumorphism-ui/components/IconSpan';
import { InfoTooltip } from '@libs/neumorphism-ui/components/InfoTooltip';
import React, {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Table, Modal } from '@mui/material';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { styled, Button } from '@mui/material';
import { PaddingSection } from './PaddingSection';
import {
  useAnchorWebapp,
  useBidByUserByCollateralQuery,
} from '@anchor-protocol/app-provider';
import { formatUToken, formatUTokenWithPostfixUnits } from '@libs/formatter';
import { useAccount } from 'contexts/account';
import { useConfirm } from '@libs/neumorphism-ui/components/useConfirm';
import { useWithdrawLiquidationBidTx } from '@anchor-protocol/app-provider/tx/liquidate/withdraw';
import { useLiquidationWithdrawForm } from '@anchor-protocol/app-provider/forms/liquidate/withdraw';
import { BroadcastTxStreamResult } from './types';
import { TxResultRenderer } from 'components/tx/TxResultRenderer';
import { StreamStatus } from '@rx-stream/react';
import { Dialog } from '@libs/neumorphism-ui/components/Dialog';
import {
  EstimatedFee,
  useEstimateFee,
  useFeeEstimationFor,
} from '@libs/app-provider';
import debounce from 'lodash.debounce';
import { Msg, MsgExecuteContract } from '@terra-money/terra.js';
import { CircleSpinner } from 'react-spinners-kit';
import { useTheme } from 'styled-components';
import { Mutex } from 'async-mutex';
import { useActivateLiquidationBidTx } from '@anchor-protocol/app-provider/tx/liquidate/activate';

export interface MyBidsSectionProps {
  className?: string;
}

export function MyBidsSection({ className }: MyBidsSectionProps) {
  const { connected, terraWalletAddress } = useAccount();
  const { contractAddress } = useAnchorWebapp();
  const { data: { bidByUser } = {} } = useBidByUserByCollateralQuery(
    contractAddress.cw20.bLuna,
  );

  const myBids = useMemo(
    () =>
      (bidByUser?.bids ?? [])
        //.filter(bid => parseFloat(bid.amount) !== 0)
        .map((bid) => ({
          premium: `${bid.premium_slot} %`,
          remaining: formatUTokenWithPostfixUnits(bid.amount),
          status: 'Active',
          idx: bid.idx,
          filled: formatUToken(bid.pending_liquidated_collateral),
        })),
    [bidByUser],
  );

  const HeaderCell = styled(TableCell)({
    backgroundColor: 'unset',
  });

  // We check if there is an inactive bid in the mix that can be activated

  const oneBidToActivate = useMemo(
    () =>
      (bidByUser?.bids ?? [])
        .map((bid) => {
          // bid is activatable when wait_end is not null
          let waitEndNotNull =
            bid.wait_end !== undefined && bid.wait_end != null;
          let wait_end = bid.wait_end ?? 0;
          // and  wait end is lower than the current time
          let blockTimeSufficient = wait_end <= Date.now();

          return waitEndNotNull && blockTimeSufficient;
        })
        .some((item) => item),

    [bidByUser],
  );

  ////////////////////////// Bid Retract Form ////////////////////////////
  const state = useLiquidationWithdrawForm();

  const [openConfirm, confirmElement] = useConfirm();
  const [withdrawBidTx, withdrawBidTxResult] = useWithdrawLiquidationBidTx();

  const [feeEstimatesCallFunc, setFeeEstimatesCallFunc] = useState<{
    [key: string]: Function;
  }>({});
  const [feeEstimates, setFeeEstimates] = useState<{
    [key: string]: EstimatedFee;
  }>({});

  const estimateFee = useEstimateFee(terraWalletAddress);

  const feeMutex = useRef(new Mutex());
  const feeFuncMutex = useRef(new Mutex());

  useEffect(() => {
    (bidByUser?.bids ?? []).forEach((bid: any) => {
      const msgs = [
        new MsgExecuteContract(
          terraWalletAddress as string,
          contractAddress.liquidation.liquidationQueueContract,
          {
            // @see https://github.com/Anchor-Protocol/money-market-contracts/blob/master/contracts/market/src/msg.rs#L65
            retract_bid: {
              bid_idx: bid.idx,
            },
          },
        ),
      ];
      if (feeEstimatesCallFunc[bid.idx]) {
        feeEstimatesCallFunc[bid.idx](msgs);
      }
    });
  }, [feeEstimatesCallFunc, bidByUser, terraWalletAddress, contractAddress]);

  useEffect(() => {
    (bidByUser?.bids ?? []).forEach((bid: any) => {
      const func = debounce((msgs: Msg[] | null) => {
        setFeeEstimates((estimates) => ({
          ...estimates,
          [bid.idx]: undefined,
        }));
        if (!msgs) {
          return;
        }

        estimateFee(msgs).then((estimated) => {
          if (estimated) {
            setFeeEstimates((estimates) => ({
              ...estimates,
              [bid.idx]: estimated,
            }));
          }
        });
      }, 500);

      setFeeEstimatesCallFunc((funcs) => {
        if (funcs[bid.idx]) {
          return funcs;
        }
        return {
          ...funcs,
          [bid.idx]: func,
        };
      });
    });
  }, [
    bidByUser,
    estimateFee,
    setFeeEstimates,
    setFeeEstimatesCallFunc,
    feeMutex,
    feeFuncMutex,
  ]);

  const [isSubmittingTx, setIsSubmittingTx] = useState(false);

  // Proceed callback --> Submit transaction
  const withdrawBid = useCallback(
    async (
      idx: string,
      estimatedFee: EstimatedFee | undefined,
      confirm: ReactNode,
    ) => {
      setIsSubmittingTx(true);
      if (!connected || !withdrawBidTx || !estimatedFee) {
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
      withdrawBidTx({
        bid_idx: idx,
        estimatedFee,
      });
    },
    [connected, withdrawBidTx, openConfirm],
  );

  ////////////////////////// Bid Activation Form ////////////////////////////
  const activationState = useLiquidationWithdrawForm();

  const [activateBidTx, activateBidTxResult] = useActivateLiquidationBidTx();

  const [estimatedFeeActivation, estimatedFeeError, estimateActivationFee] =
    useFeeEstimationFor(terraWalletAddress);

  useEffect(() => {
    if (estimateActivationFee)
      estimateActivationFee([
        new MsgExecuteContract(
          terraWalletAddress as string,
          contractAddress.liquidation.liquidationQueueContract,
          {
            activate_bids: {
              collateral_token: contractAddress.cw20.bLuna,
            },
          },
        ),
      ]);
  }, [
    estimateActivationFee,
    terraWalletAddress,
    contractAddress.liquidation.liquidationQueueContract,
    contractAddress.cw20.bLuna,
  ]);

  const [isSubmittingActivationTx, setIsSubmittingActivationTx] =
    useState(false);

  // Proceed callback --> Submit transaction
  const activateBid = useCallback(
    async (estimatedFee: EstimatedFee | undefined, confirm: ReactNode) => {
      setIsSubmittingActivationTx(true);
      if (!connected || !activateBidTx || !estimatedFee) {
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
      activateBidTx({
        estimatedFee,
      });
    },
    [connected, activateBidTx, openConfirm],
  );

  ////////////////////////////////// Visuals //////////////////////////////
  const theme = useTheme();

  const renderBroadcastTx = useMemo(() => {
    return (
      <TxResultRenderer
        resultRendering={
          (withdrawBidTxResult as BroadcastTxStreamResult)?.value
        }
        onExit={() => setIsSubmittingTx(false)}
      />
    );
  }, [withdrawBidTxResult]);

  const renderBroadcastTxActivation = useMemo(() => {
    return (
      <TxResultRenderer
        resultRendering={
          (activateBidTxResult as BroadcastTxStreamResult)?.value
        }
        onExit={() => setIsSubmittingActivationTx(false)}
      />
    );
  }, [activateBidTxResult]);

  return (
    <PaddingSection className={className}>
      <h2 style={{ padding: 10 }}>
        <IconSpan>
          My Bids{' '}
          <InfoTooltip>
            You can see all the bids you have placed in the liquidation queue
          </InfoTooltip>
        </IconSpan>
      </h2>
      {isSubmittingTx &&
        (withdrawBidTxResult?.status === StreamStatus.IN_PROGRESS ||
          withdrawBidTxResult?.status === StreamStatus.DONE) && (
          <Modal open disableEnforceFocus>
            <Dialog
              className={className}
              style={{ width: 720, touchAction: 'none' }}
            >
              {renderBroadcastTx}
            </Dialog>
          </Modal>
        )}

      {isSubmittingActivationTx &&
        (activateBidTxResult?.status === StreamStatus.IN_PROGRESS ||
          activateBidTxResult?.status === StreamStatus.DONE) && (
          <Modal open disableEnforceFocus>
            <Dialog
              className={className}
              style={{ width: 720, touchAction: 'none' }}
            >
              {renderBroadcastTxActivation}
            </Dialog>
          </Modal>
        )}
      {!!estimatedFeeActivation && oneBidToActivate && (
        <Button
          style={{
            height: 35,
            padding: '10px 10px',
            marginRight: '20px',
            float: 'right',
          }}
          onClick={async () => {
            activateBid(
              estimatedFeeActivation,
              activationState.invalidNextTxFee,
            );
          }}
          color="primary"
          variant="outlined"
        >
          Activate All
        </Button>
      )}
      {!!estimatedFeeError && <>Can't activate bids : {estimatedFeeError}</>}
      <TableContainer style={{ maxHeight: 300, overflow: 'scroll' }}>
        <Table
          sx={{ minWidth: 650 }}
          aria-label="simple table"
          size="small"
          stickyHeader
        >
          <TableHead>
            <TableRow>
              <HeaderCell>Premium</HeaderCell>
              <HeaderCell align="right">Bid Remaining (axlUSDC)</HeaderCell>
              <HeaderCell align="right">Bid Status</HeaderCell>
              <HeaderCell align="right">Amount filled (bLuna)</HeaderCell>
              <HeaderCell align="right"></HeaderCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {myBids.map((bid, index) => (
              <TableRow
                key={index}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell>{bid.premium}</TableCell>
                <TableCell align="right">{bid.remaining}</TableCell>
                <TableCell align="right">{bid.status}</TableCell>
                <TableCell align="right">{bid.filled}</TableCell>
                <TableCell align="right">
                  {!!feeEstimates[bid.idx] && (
                    <Button
                      style={{ height: 35, padding: '10px 10px' }}
                      onClick={async () => {
                        state.updateBidIdx(bid.idx);
                        withdrawBid(
                          bid.idx,
                          feeEstimates[bid.idx],
                          state.invalidNextTxFee,
                        );
                      }}
                      color="primary"
                      variant="outlined"
                    >
                      Retract
                    </Button>
                  )}
                  {!feeEstimates[bid.idx] && (
                    <CircleSpinner size={14} color={theme.colors.positive} />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {confirmElement}
    </PaddingSection>
  );
}
