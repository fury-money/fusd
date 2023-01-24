import { IconSpan } from '@libs/neumorphism-ui/components/IconSpan';
import { InfoTooltip } from '@libs/neumorphism-ui/components/InfoTooltip';
import React, { useMemo } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { Divider, Grid, styled } from '@mui/material';
import { PaddingSection } from './PaddingSection';
import { useLiquidationHistoryQuery } from '@anchor-protocol/app-provider/queries/liquidate/history';
import { LiquidationData } from '@anchor-protocol/app-fns/queries/liquidate/history';
import { useFormatters } from '@anchor-protocol/formatter';
import { u, UST } from '@libs/types';
import { bLuna } from '@anchor-protocol/types';
import { useMediaQuery } from 'react-responsive';
import { useTheme } from 'styled-components';
import { WhitelistCollateral } from 'queries';

export interface LiquidationStatsSectionProps {
  className?: string;
  collateral: WhitelistCollateral | undefined;
}

export type Period = 'total' | 'year' | 'month' | 'week' | 'day';

export function LiquidationStatsSection({
  className,
  collateral,
}: LiquidationStatsSectionProps) {
  const { data: liquidationHistory } = useLiquidationHistoryQuery();

  console.log(liquidationHistory, "history data")

  const { bLuna: bluna, ust } = useFormatters();

  const liquidations = useMemo(
    () =>
      liquidationHistory?.map((liquidation: LiquidationData) => {
        return {
          time: new Date(Date.parse(liquidation?.date)).toLocaleString(),
          collateral: bluna.formatOutput(
            bluna.demicrofy(
              liquidation?.amountLiquidated.toString() as u<bLuna>,
            ),
          ),
          axlUSDC: ust.formatOutput(
            ust.demicrofy(liquidation?.amountPaid.toString() as u<UST>),
          ),
          price: liquidation?.currentPrice,
        };
      }) ?? [],
    [liquidationHistory, bluna, ust],
  );
  
  const theme = useTheme();
  const isVerySmall = useMediaQuery({ maxWidth: 755 });

  return (
    <PaddingSection className={className}>
      <h2 style={{ padding: 10 }}>
        <IconSpan>
          Liquidation Stats{' '}
          <InfoTooltip>
            Some additionnal statistics about bids and liquidations
          </InfoTooltip>
        </IconSpan>
      </h2>

      {!isVerySmall && 
      <TableContainer style={{ maxHeight: 300, overflow: 'scroll' }}>
        <Table
          sx={{ minWidth: 650, padding: '5px 10px' }}
          aria-label="simple table"
          stickyHeader
        >
          <TableHead>
            <TableRow>
              <LowPaddingTableCell>Time</LowPaddingTableCell>
              <LowPaddingTableCell align="right">
                aLuna Liquidated
              </LowPaddingTableCell>
              <LowPaddingTableCell align="right">
                axlUSDC Paid
              </LowPaddingTableCell>
              <LowPaddingTableCell align="right">
                Average Price
              </LowPaddingTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {liquidations.map((liquidation: any, index: number) => (
              <TableRow
                key={`${liquidation.time}-${index}`}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <LowPaddingTableCell scope="row">
                  {liquidation.time}
                </LowPaddingTableCell>
                <LowPaddingTableCell align="right">
                  {liquidation.collateral}
                </LowPaddingTableCell>
                <LowPaddingTableCell align="right">
                  {liquidation.axlUSDC}
                </LowPaddingTableCell>
                <LowPaddingTableCell align="right">
                  {liquidation.price}
                </LowPaddingTableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    }
    {isVerySmall && 
        <Grid container spacing={2} sx={{padding: "16px 16px", maxHeight: "300px", marginTop: "10px",marginLeft:0, overflowY: "scroll"}}>
        {liquidations.map((liquidation, index: number) => (
          <Grid container spacing={2} key={index} >
                <Grid item xs={6}>
                  Time
                </Grid> 
                <Grid item xs={6} sx={{fontWeight: "bold"}}>
                  {liquidation.time}
                </Grid> 
                <Grid item xs={6}>
                  aLuna Liquidated
                </Grid>
                <Grid item xs={6}>
                  {liquidation.collateral}
                </Grid> 
                <Grid item xs={6}>
                  axlUSDC Paid
                </Grid>
                <Grid item xs={6} sx={{color: theme.colors.positive}}>
                  {liquidation.axlUSDC}
                </Grid> 
                <Grid item xs={6}>
                  Average Price
                </Grid>
                <Grid item xs={6}>
                  {liquidation.price}
                </Grid> 
                <Grid item xs={12} sx={{textAlign:"center", margin: "10px" }}>

                </Grid>
                <Grid item xs={12}>
                  {index != (liquidations.length - 1) && <Divider orientation="horizontal" flexItem variant="middle"sx ={{backgroundColor: "white"}}/>}
                </Grid> 
          </Grid>
              
              ))}
        </Grid>
      }
    </PaddingSection>
  );
}


  const LowPaddingTableCell = styled(TableCell)({
    padding: '5px 10px',
    backgroundColor: 'unset',
  });
