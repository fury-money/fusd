import React, { useCallback, useMemo } from 'react';
import { computeTotalDeposit } from '@anchor-protocol/app-fns';
import { useEarnEpochStatesQuery } from '@anchor-protocol/app-provider';
import {
  formatUST,
  formatUSTWithPostfixUnits,
  MILLION,
} from '@anchor-protocol/notation';
import { demicrofy, MICRO } from '@libs/formatter';
import { ActionButton } from '@libs/neumorphism-ui/components/ActionButton';
import { BorderButton } from '@libs/neumorphism-ui/components/BorderButton';
import { IconSpan } from '@libs/neumorphism-ui/components/IconSpan';
import { InfoTooltip } from '@libs/neumorphism-ui/components/InfoTooltip';
import { Section } from '@libs/neumorphism-ui/components/Section';
import { AnimateNumber } from '@libs/ui';
import { SubAmount } from 'components/primitives/SubAmount';
import { useAccount } from 'contexts/account';
import { useBalances } from 'contexts/balances';
import { useDepositDialog } from './useDepositDialog';
import { useWithdrawDialog } from './useWithdrawDialog';
import Big from 'big.js';
import { useLenderValue } from '@anchor-protocol/app-provider/queries/earn/lenderValue';
import { u, UST } from '@libs/types';
import { Box, Grid } from '@mui/material';
import { EmbossButton } from '@libs/neumorphism-ui/components/EmbossButton';

import kado from './assets/kado.svg';
import { useBuyUstDialog } from './useBuyUstDialog';

export interface TotalDepositSectionProps {
  className?: string;
}

export function TotalDepositSection({ className }: TotalDepositSectionProps) {
  // ---------------------------------------------
  // dependencies
  // ---------------------------------------------
  const { connected } = useAccount();

  // ---------------------------------------------
  // queries
  // ---------------------------------------------
  const { uUST, uaUST } = useBalances();

  const { data: { moneyMarketEpochState } = {} } = useEarnEpochStatesQuery();

  const { data: lenderValue } = useLenderValue();

  // ---------------------------------------------
  // computes
  // ---------------------------------------------
  const { totalDeposit } = useMemo(() => {
    return {
      totalDeposit: computeTotalDeposit(uaUST, moneyMarketEpochState),
    };
  }, [moneyMarketEpochState, uaUST]);

  const totalProfit = useMemo(() => {
    if(lenderValue?.lenderValue.stableAmount == "0"){
      return Big(0) as u<UST<Big>>
    }
    return totalDeposit.minus(lenderValue?.lenderValue.stableAmount ?? 0) as u<UST<Big>>
  },[lenderValue, totalDeposit])

  // ---------------------------------------------
  // dialogs
  // ---------------------------------------------
  const [openDepositDialog, depositDialogElement] = useDepositDialog();

  const [openWithdrawDialog, withdrawDialogElement] = useWithdrawDialog();

  const openDeposit = useCallback(async () => {
    await openDepositDialog();
  }, [openDepositDialog]);

  const openWithdraw = useCallback(async () => {
    await openWithdrawDialog();
  }, [openWithdrawDialog]);

  const [openBuyUstDialog, buyUstDialogElement] = useBuyUstDialog();

  // ---------------------------------------------
  // presentation
  // ---------------------------------------------
  return (
    <Section className={className}>

    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <h2>
          <IconSpan>
            TOTAL DEPOSIT{' '}
            <InfoTooltip>
              Total amount of axlUSDC deposited and interest earned by the user
            </InfoTooltip>
          </IconSpan>
        </h2>

        <div className="amount">
          <AnimateNumber format={formatUSTWithPostfixUnits}>
            {demicrofy(totalDeposit)}
          </AnimateNumber>{' '}
          <span className="denom">axlUSDC</span>
          {totalDeposit.gt(MILLION * MICRO) && (
            <SubAmount style={{ fontSize: '16px' }}>
              <AnimateNumber format={formatUST}>
                {demicrofy(totalDeposit)}
              </AnimateNumber>{' '}
              axlUSDC
            </SubAmount>
          )}
        </div>
      </Grid>

      <Grid item xs={12} md={6}>
        <h2>
          <IconSpan>
            TOTAL PROFIT{' '}
            <InfoTooltip>
              Total amount of axlUSDC earned while depositing on Cavern 
                (This doesn't account for token transfers outside the platform)
            </InfoTooltip>
          </IconSpan>
        </h2>

        <div className="amount profit-amount">
          <AnimateNumber format={formatUSTWithPostfixUnits}>
            {demicrofy(totalProfit)}
          </AnimateNumber>{' '}
          <span className="denom">axlUSDC</span>
          {totalProfit.gt(MILLION * MICRO) && (
            <SubAmount style={{ fontSize: '16px' }}>
              <AnimateNumber format={formatUST}>
                {demicrofy(totalProfit)}
              </AnimateNumber>{' '}
              axlUSDC
            </SubAmount>
          )}
        </div>
      </Grid>
    </Grid>

      <aside className="total-deposit-buttons">
       <EmbossButton
            component="button"
            onClick = {() => openBuyUstDialog({})}
          >
            <span>
              Buy axlUSDC{' '}
            </span>
            <i>
              <img src={kado} alt="Kado Ramp" style={{width: "32px", paddingLeft: "10px"}} />
            </i>
          </EmbossButton>
        <ActionButton
          disabled={
            !connected || !moneyMarketEpochState || Big(uUST).lte(0)
          }
          onClick={openDeposit}
        >
          Deposit
        </ActionButton>
        <BorderButton
          disabled={!connected || !moneyMarketEpochState || Big(uaUST).lte(0)}
          onClick={openWithdraw}
        >
          Withdraw
        </BorderButton>
      </aside>

      {depositDialogElement}
      {withdrawDialogElement}
      {buyUstDialogElement}
    </Section>
  );
}
