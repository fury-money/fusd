import { IconSpan } from '@libs/neumorphism-ui/components/IconSpan';
import { InfoTooltip } from '@libs/neumorphism-ui/components/InfoTooltip';
import React, { useMemo } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { styled } from '@mui/material';
import { PaddingSection } from './PaddingSection';
import { useLiquidationHistoryQuery } from '@anchor-protocol/app-provider/queries/liquidate/history';
import { LiquidationData } from '@anchor-protocol/app-fns/queries/liquidate/history';
import { useFormatters } from '@anchor-protocol/formatter';
import { u, UST } from '@libs/types';
import { bLuna } from '@anchor-protocol/types';

export interface LiquidationStatsSectionProps {
  className?: string;
}

export type Period = 'total' | 'year' | 'month' | 'week' | 'day';

export function LiquidationStatsSection({
  className,
}: LiquidationStatsSectionProps) {
  const { data: liquidationHistory } = useLiquidationHistoryQuery();

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

  const LowPaddingTableCell = styled(TableCell)({
    padding: '5px 10px',
    backgroundColor: 'unset',
  });

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
    </PaddingSection>
  );
}
