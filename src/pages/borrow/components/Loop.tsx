import { useFormatters } from '@anchor-protocol/formatter';
import {
  APY,
  BorrowAPR,
  BorrowValue,
  CollateralValue,
} from '@anchor-protocol/icons';
import {
  formatUST,
  formatUSTWithPostfixUnits,
  MILLION,
} from '@anchor-protocol/notation';
import { demicrofy, formatRate, MICRO } from '@libs/formatter';
import { IconCircle } from '@libs/neumorphism-ui/components/IconCircle';
import { IconSpan } from '@libs/neumorphism-ui/components/IconSpan';
import { InfoTooltip } from '@libs/neumorphism-ui/components/InfoTooltip';
import { Section } from '@libs/neumorphism-ui/components/Section';
import { TooltipIconCircle } from '@libs/neumorphism-ui/components/TooltipIconCircle';
import { AnimateNumber } from '@libs/ui';
import { SubAmount } from 'components/primitives/SubAmount';
import { screen } from 'env';
import { fixHMR } from 'fix-hmr';
import { LoanButtons } from 'pages/borrow/components/LoanButtons';
import React from 'react';
import styled from 'styled-components';
import { useBorrowOverviewData } from '../logics/useBorrowOverviewData';
import { BorrowUsageGraph } from './BorrowUsageGraph';
import { LoopButtons } from './LoopButtons';

export interface OverviewProps {
  className?: string;
}

function Component({ className }: OverviewProps) {
  const {
    borrowAPR,
    borrowedValue,
    collateralValue,
    borrowLimit,
    netAPR,
    currentLtv,
    //dangerLtv,
    borrowerDistributionAPYs,
  } = useBorrowOverviewData();

  const { ust } = useFormatters();

  // ---------------------------------------------
  // presentation
  // ---------------------------------------------
  return (
    <Section className={className}>
      <header>
        <h2>LOOP</h2>
        <div className="loan-buttons">
          <LoopButtons />
        </div>
      </header>
      Cavern Protocol allows you to borrow funds with leverage. By borrowing with leverage, you understand that you will be more exposed to the price of the underlying collateral.
      This function is for advanced user only.
    </Section>
  );
}

export const CircleOnly = styled.div`
  text-align: right;
`;

export const Circles = styled.div`
  display: flex;

  margin-left: -20px;
  margin-right: -30px;

  > div {
    flex: 1;

    display: flex;
    align-items: center;

    font-size: 12px;
    color: ${({ theme }) => theme.dimTextColor};

    word-break: keep-all;
    white-space: nowrap;

    b {
      display: block;
      color: ${({ theme }) => theme.textColor};
    }

    > :nth-child(odd) {
      margin-right: 10px;
    }

    > :nth-child(even) {
      line-height: 18px;
    }
  }

  @media (max-width: 1400px) {
    margin-left: 0;
    margin-right: 0;
  }

  @media (max-width: ${screen.mobile.max}px) {
    flex-direction: column;

    > :last-child {
      margin-top: 10px;
    }
  }
`;

export const LabelAndCircle = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: ${({ theme }) => theme.dimTextColor};
  font-size: 13px;
`;

const StyledComponent = styled(Component)`
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    gap: 16px;

    h2 {
      flex: 1;

      font-size: 12px;
      font-weight: 500;
    }

    .loan-buttons {
      display: flex;
      gap: 16px;

      button {
        width: 180px;
      }
    }

    margin-bottom: 60px;
  }

  article,
  figure {
    h3 {
      font-size: 12px;
      font-weight: 500;
    }
  }

  figure {
    h3 {
      margin-bottom: 20px;
    }
  }

  article {
    margin-bottom: 44px !important;
  }

  article > div {
    background: ${({ theme }) =>
      theme.palette_type === 'light' ? '#fcfcfc' : '#262940'};
    box-shadow: 0 8px 14px -8px rgba(0, 0, 0, 0.07);
    border-radius: 22px;
    padding: 35px 40px;
    height: auto;

    display: grid;
    grid-template-rows: 30px 84px 1fr;

    .value {
      font-size: 32px;
      font-weight: 500;
    }

    &.apy {
      color: ${({ theme }) => theme.colors.primary};

      .value {
        font-weight: 500;
      }
    }
  }

  @media (max-width: 700px) {
    header {
      flex-direction: column;
      justify-content: start;
      align-items: start;

      .loan-buttons {
        width: 100%;

        button {
          flex: 1;
        }
      }

      margin-bottom: 30px;
    }
  }

  @media (max-width: ${screen.mobile.max}px) {
    article > div {
      padding: 20px;
    }
  }
`;

export const Loop = fixHMR(StyledComponent);
