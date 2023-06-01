import { formatBAssetWithPostfixUnits, formatUSTWithPostfixUnits } from '@anchor-protocol/notation';
import { TokenIcon } from '@anchor-protocol/token-icons';
import { computeTotalDeposit, vectorizeOraclePrices, vectorizeOverseerCollaterals } from '@anchor-protocol/app-fns';
import { useBidByUserByCollateralQuery, useBorrowBorrowerQuery, useBorrowMarketQuery, useEarnEpochStatesQuery } from '@anchor-protocol/app-provider';
import { demicrofy, formatRate } from '@libs/formatter';
import { ActionButton } from '@libs/neumorphism-ui/components/ActionButton';
import { BorderButton } from '@libs/neumorphism-ui/components/BorderButton';
import { HorizontalScrollTable } from '@libs/neumorphism-ui/components/HorizontalScrollTable';
import { Section } from '@libs/neumorphism-ui/components/Section';
import { fixHMR } from 'fix-hmr';
import { useAccount } from 'contexts/account';
import { useDepositDialog } from 'pages/earn/components/useDepositDialog';
import { useWithdrawDialog } from 'pages/earn/components/useWithdrawDialog';
import { EmptySection } from 'pages/mypage/components/EmptySection';
import React, { useCallback, useMemo } from 'react';
import styled, { useTheme } from 'styled-components';
import { useBalances } from 'contexts/balances';
import big, { Big, BigSource } from 'big.js';
import { useDepositApy } from 'hooks/useDepositApy';
import { useBorrowOverviewData } from 'pages/borrow/logics/useBorrowOverviewData';
import { sum, vectorMultiply } from '@libs/big-math';
import { Luna, Rate, Token, u, UST } from '@libs/types';
import { bAsset } from '@anchor-protocol/types';
import { CollateralItem } from './TotalCollateralValue';
import { useLSDCollateralQuery } from '@anchor-protocol/app-provider/queries/borrow/useLSDCollateralQuery';
import { Divider, Grid } from '@mui/material';
import { useAllBidByUserByCollateralQuery } from '@anchor-protocol/app-provider/queries/liquidate/allBIdsByUser';
import { useAbortMissionDialog } from './AbortMissionDialog';
import { useFeeEstimationFor } from '@libs/app-provider';
import { useCollaterals } from 'pages/borrow/components/useCollaterals';
import { useAllWithdrawDefaultedCollateral, useWithdrawDefaultedCollateral } from 'pages/liquidation/components/useWithdrawDefaultedCollateral';


const MIN_FOR_ABORT = 1_000;
export interface AbortMissionProps {
  className?: string;
}

function AbortMissionBase({ className }: AbortMissionProps) {
  // ---------------------------------------------
  // dependencies
  // ---------------------------------------------
  const { connected, terraWalletAddress } = useAccount();

  const { data: { oraclePrices, overseerWhitelist } = {} } =
    useBorrowMarketQuery();

  const { data: {overseerCollaterals} = {} } = useBorrowBorrowerQuery();

  const { borrowedValue } =
    useBorrowOverviewData();

  const additionalLSDInfo = useLSDCollateralQuery(); 
  // ---------------------------------------------
  // queries
  // ---------------------------------------------
  const { uUST, uaUST } = useBalances();

  const { data: { moneyMarketEpochState } = {} } = useEarnEpochStatesQuery();

  const allLiquidationBids = useAllBidByUserByCollateralQuery();

  // ---------------------------------------------
  // computes
  // ---------------------------------------------
  const { totalDeposit } = useMemo(() => {
    return {
      totalDeposit: computeTotalDeposit(uaUST, moneyMarketEpochState),
    };
  }, [moneyMarketEpochState, uaUST]);

  const collaterals = useCollaterals();

  const totalCollateralValue = useMemo(() => {
    return sum(...collaterals.map((collateral)=> collateral.lockedAmountInUST)) as u<UST<BigSource>>;

  }, [collaterals]);

  const liquidationQueueValue = useMemo(
    () =>
      (allLiquidationBids ?? [])
        //.filter(bid => parseFloat(bid.amount) !== 0)
        .map((bid) => bid.bids?.bidByUser.bids
          .reduce((arraySum, el) => arraySum.plus(el.amount), big(0)) ?? big(0))
          .reduce((arraySum, el)=> arraySum.plus(el), big(0)),
    [allLiquidationBids],
  );

  const allWithdrawableDefaultedCollaterals = useAllWithdrawDefaultedCollateral();
  // ---------------------------------------------
  // dialogs
  // ---------------------------------------------
  const [openAbortMissionDialog, abortMissionDialogElement] = useAbortMissionDialog();

  const openAbortMission = useCallback(async () => {
    if(!allLiquidationBids || !overseerCollaterals?.collaterals){
      return;
    }

    const collateralsWithdrawAmount = collaterals.map((collateral) => {
      const liquidatedCollaterals = allWithdrawableDefaultedCollaterals
      .find((other) => collateral.collateral.collateral_token == other.collateral.token)
      ?.withdrawable_number ?? big(0) as u<Token<Big>>;
      const providedCollaterals = collateral.lockedAmount;
      return {
        collateral,
        amount: liquidatedCollaterals.add(providedCollaterals) as u<Token<Big>>
      }
    });

    const withdrawableFromLiquidations = allWithdrawableDefaultedCollaterals.map(({collateral, withdrawable_number}) => {
      const collateralInfo = collateralsWithdrawAmount.find((other) => other.collateral.collateral.collateral_token == collateral.token);
      return ({
        collateral: collateralInfo,
        withdrawable_number
      })
    })


    await openAbortMissionDialog({
      totalDeposit,
      totalAUST: uaUST,
      allLiquidationBids,
      liquidationQueueValue: liquidationQueueValue as u<UST<Big>>,
      borrowedValue,
      allWithdrawableDefaultedCollaterals:withdrawableFromLiquidations.filter(({withdrawable_number})=>withdrawable_number.gt(MIN_FOR_ABORT)),
      collateralsWithdrawAmount: collateralsWithdrawAmount.filter(({amount}) => amount && amount.gt(MIN_FOR_ABORT))
    }
    );
  }, [openAbortMissionDialog, overseerCollaterals, allLiquidationBids, borrowedValue, uaUST, totalDeposit]);

  const theme = useTheme();

  return (
    <Section className={className}>
      <HorizontalScrollTable minWidth={600} startPadding={20}>
        <colgroup>
          <col style={{ minWidth: 150 }} />
          <col style={{ minWidth: 100 }} />
          <col style={{ minWidth: 150 }} />
          <col style={{ minWidth: 200 }} />
        </colgroup>
        <thead>
          <tr>
            <th>Total Deposit</th>
            <th>Total Liquidation Bids</th>
            <th>Total pending Liquidated Collateral</th>
            <th>Total Borrowed</th>
            <th>Total Collateral deposited</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              {formatUSTWithPostfixUnits(demicrofy(totalDeposit))} axlUSDC
            </td>
            <td>
              {formatUSTWithPostfixUnits(demicrofy(liquidationQueueValue as u<Token<Big>>) as u<UST<Big>>)} axlUSDC
            </td>
            <td>
              <Grid container spacing={2}>
              {allWithdrawableDefaultedCollaterals.filter(({withdrawable_number})=>withdrawable_number.gt(MIN_FOR_ABORT)).map(({ collateral, withdrawable_number }, i) => (
                <Grid item xs={6}
                  key={collateral?.info?.symbol}
                  style={{ color: theme.dimTextColor, fontSize: "0.95em", textAlign: "left", paddingLeft: 20}}
                >
                   <TokenIcon token={collateral?.info?.symbol} variant="@4x"/> {formatBAssetWithPostfixUnits(demicrofy(withdrawable_number))} 
                </Grid>
              ))}
              </Grid>            
              </td>
            <td>
              {formatUSTWithPostfixUnits(demicrofy(borrowedValue))} axlUSDC
            </td>
            <td style={{textAlign:"center"}}>
              {formatUSTWithPostfixUnits(demicrofy(totalCollateralValue))} axlUSDC              
              <Divider style={{borderColor: theme.textColor, margin: 10}} />
              <Grid container spacing={2}>
              {collaterals.filter(({lockedAmount})=>big(lockedAmount).gt(MIN_FOR_ABORT)).map(({ collateral, lockedAmount }, i) => (
                <Grid item xs={6}
                  key={collateral.symbol}
                  style={{ color: theme.dimTextColor, fontSize: "0.95em", textAlign: "left", paddingLeft: 20}}
                >
                   <TokenIcon token={collateral.symbol} variant="@4x"/> {formatBAssetWithPostfixUnits(demicrofy(lockedAmount))} 
                </Grid>
              ))}
              </Grid>

            </td>         
            <td>
              <ActionButton
                disabled={
                  !connected || !moneyMarketEpochState || Big(uUST).lte(0)
                }
                onClick={openAbortMission}
              >
                Abort Mission
              </ActionButton>
            </td>
          </tr>
        </tbody>
      </HorizontalScrollTable>

      {abortMissionDialogElement}
    </Section>
  );
}

const StyledAbortMission = styled(AbortMissionBase)`
  table {
    thead,
    tbody {
      th:nth-child(2),
      td:nth-child(2),
      th:nth-child(3),
      td:nth-child(3),
      th:nth-child(4),
      td:nth-child(4) {
        text-align: center;
      }

      td:first-child > div {
        text-decoration: none;
        color: currentColor;

        text-align: left;

        display: flex;

        align-items: center;

        i {
          width: 60px;
          height: 60px;

          margin-right: 15px;

          svg,
          img {
            display: block;
            width: 60px;
            height: 60px;
          }
        }

        .coin {
          font-weight: bold;

          grid-column: 2;
          grid-row: 1/2;
        }

        .name {
          grid-column: 2;
          grid-row: 2;
        }
      }
    }

    button {
      font-size: 12px;
      width: 120px;
      height: 32px;

      &:first-child {
        margin-right: 8px;
      }
    }
  }
`;

export const AbortMission = fixHMR(StyledAbortMission);
