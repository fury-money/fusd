import { CenteredLayout } from 'components/layouts/CenteredLayout';

import { FlexTitleContainer, PageTitle } from 'components/primitives/PageTitle';
import { links, screen } from 'env';
import { fixHMR } from 'fix-hmr';
import React, { useState } from 'react';
import styled from 'styled-components';
import { LiquidationQueueSection } from './components/LiquidationQueueSection';
import { LiquidationStatsSection } from './components/LiquidationStatsSection';
import { EarnProps } from 'pages/earn';
import { PlaceBidSection } from './components/PlaceBidSection';
import { MyBidsSection } from './components/MyBidsSection';

export interface LiquidationProps {
  className?: string;
}

function Component({ className }: EarnProps) {
  const [clickedBar, setClickedBar] = useState<number | undefined>();

  return (
    <CenteredLayout className={className} maxWidth={2000}>
      <FlexTitleContainer>
        <PageTitle title="LIQUIDATE" docs={links.docs.liquidate} />
      </FlexTitleContainer>
      <section className="grid">
        <PlaceBidSection
          className="place-bid"
          clickedBarState={[clickedBar, setClickedBar]}
        />
        <LiquidationQueueSection
          className="liquidation-graph"
          setClickedBar={setClickedBar}
        />
        <LiquidationStatsSection className="liquidation-stats" />
        <MyBidsSection className="my-bids" />
      </section>
    </CenteredLayout>
  );
}

const StyledComponent = styled(Component)`
  // ---------------------------------------------
  // style
  // ---------------------------------------------
  h2 {
    margin: 0;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: -0.3px;
    color: ${({ theme }) => theme.textColor};
  }

  hr {
    margin: 30px 0;
  }

  .decimal-point {
    color: ${({ theme }) => theme.dimTextColor};
  }

  .liquidation-stats {
    .amount {
      font-size: 32px;
      font-weight: 500;
      letter-spacing: -0.3px;
      color: ${({ theme }) => theme.textColor};

      .denom {
        font-size: 18px;
      }
    }

    .liquidation-stats-numbers {
      margin-top: 64px;
    }
  }

  .place-bid {
    .apy {
      text-align: center;

      .name {
        margin-bottom: 5px;
      }

      .value {
        font-size: 50px;
        font-weight: 500;
        color: ${({ theme }) => theme.colors.primary};
      }

      .projectedValue {
        font-size: 12px;
        color: ${({ theme }) => theme.textColor};
        margin-bottom: 50px;

        b {
          font-weight: 500;
        }
      }

      figure {
        width: 100%;
        height: 300px;
      }
    }
  }

  .liquidation-graph {
    .amount {
      font-size: 32px;
      font-weight: 500;
      letter-spacing: -0.3px;
      color: ${({ theme }) => theme.textColor};

      .denom {
        font-size: 18px;
      }
    }

    .tab {
      margin-top: 64px;
    }
  }

  // ---------------------------------------------
  // layout
  // ---------------------------------------------
  .liquidation-stats,
  .my-bids {
    h2 {
      margin-bottom: 15px;
    }
  }

  .place-bid {
    h2 {
      margin-bottom: 10px;
    }
  }

  .liquidation-graph {
    h2 {
      margin-bottom: 15px;
    }
  }

  // pc
  @media (min-width: ${screen.monitor.min}px) {
    .grid {
      display: grid;

      grid-template-columns: repeat(12, 1fr);
      grid-template-rows: auto auto auto;
      grid-gap: 20px;

      .NeuSection-root {
        margin: 0;
      }

      .liquidation-graph {
        grid-column: 1/10;
        grid-row: 1 / 3;
      }

      .place-bid {
        grid-column: 10/13;
        grid-row: 1/3;
      }

      .liquidation-stats {
        grid-column: 1/6;
        grid-row: 3/4;
      }
      .my-bids {
        grid-column: 6/13;
        grid-row: 3/4;
      }
    }

    .place-bid {
      .NeuSection-content {
        padding: 60px 40px;
      }
    }
  }

  // under pc
  @media (max-width: ${screen.pc.max}px) {
    .grid > * {
      margin: 20px 0px;
    }
    .place-bid {
      .apy {
        figure {
          height: 180px;
        }
      }
    }

    .liquidation-graph {
      height: unset;
    }
  }

  // mobile
  @media (max-width: ${screen.mobile.max}px) {
    .decimal-point {
      display: none;
    }

    .liquidation-stats,
    .my-bids {
      h2 {
        margin-bottom: 10px;
      }

      .amount {
        font-size: 40px;
      }
    }

    .place-bid {
      .apy {
        figure {
          height: 150px;
        }
      }
    }

    .liquidation-graph {
      h2 {
        margin-bottom: 10px;
      }

      .amount {
        font-size: 40px;
      }

      .tab {
        margin-top: 30px;
      }
    }
  }
`;

export const Earn = fixHMR(StyledComponent);
