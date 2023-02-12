import { CenteredLayout } from 'components/layouts/CenteredLayout';

import { FlexTitleContainer, PageTitle } from 'components/primitives/PageTitle';
import { links, screen } from 'env';
import { fixHMR } from 'fix-hmr';
import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import { EarnProps } from 'pages/earn';
import { useWhitelistCollateralQuery, WhitelistCollateral } from 'queries';
import { useLSDCollateralQuery } from '@anchor-protocol/app-provider/queries/borrow/useLSDCollateralQuery';
import { PaddingSection } from './components/PaddingSection';
import { HorizontalScrollTable } from '@libs/neumorphism-ui/components/HorizontalScrollTable';
import { InfoTooltip } from '@libs/neumorphism-ui/components/InfoTooltip';
import { IconSpan } from '@libs/neumorphism-ui/components/IconSpan';
import { useBorrowMarketQuery } from '@anchor-protocol/app-provider';
import big, { Big, BigSource } from 'big.js';
import { microfyPrice } from 'utils/microfyPrice';
import { useAllBidByUserByCollateralQuery } from '@anchor-protocol/app-provider/queries/liquidate/allBIdsByUser';
import { u, UST } from '@libs/types';
import { TokenIcon } from '@anchor-protocol/token-icons';
import { demicrofy, formatOutput, useFormatters } from '@anchor-protocol/formatter';
import { BorderButton } from '@libs/neumorphism-ui/components/BorderButton';
import { useAllLiquidationStats } from './components/useLiquidationGraph';
import { StatsDoughnutCard } from './components/StatsDoughnutCard';
import { Link } from 'react-router-dom';

export interface LiquidationProps {
  className?: string;
}

export interface CollateralLiquidationInfo {
  collateral: WhitelistCollateral;
  price: UST;
  bidNumber: number;
  bidAmountInUST: u<UST<BigSource>>;
  totalBidAmountInUST: string | undefined;
  poolToCollateralRatio: number;
}

function Component({ className }: EarnProps) {
  const {
    ust: { formatOutput: formatUSTOutput, demicrofy: demicrofyUST },
  } = useFormatters();
  const [clickedBar, setClickedBar] = useState<number | undefined>();

  const { data: whitelist } = useWhitelistCollateralQuery();

  const additionalLSDInfo = useLSDCollateralQuery(); 

  const { data: borrowMarket } = useBorrowMarketQuery();

  const liquidationBids = useAllBidByUserByCollateralQuery();

  const globalLiquidationStats = useAllLiquidationStats();

  const collaterals = useMemo<CollateralLiquidationInfo[]>(() => {
    if (!borrowMarket || !whitelist) {
      return [];
    }

    return whitelist
      .filter((collateral) => collateral.bridgedAddress !== undefined)
      .map((collateral) => {
        const oracle = borrowMarket.oraclePrices.prices.find(
          ({ asset }) => collateral.collateral_token === asset,
        );
        const bidAmounts =
          liquidationBids?.find(
            (bids) =>
              collateral.collateral_token === bids.info.token,
          );

        const additionalInfo = additionalLSDInfo?.find(
          (c) => c.info?.token === collateral.collateral_token
        );

        const liquidationStats = globalLiquidationStats?.find(
          (c) => c.info?.token === collateral.collateral_token
        );
      const exchangeRate = parseFloat(additionalInfo?.additionalInfo?.hubState?.exchange_rate ?? "1");

      // We exchange the token values with the one in memory for LSD
      if(additionalInfo?.info?.info?.symbol){
        collateral.symbol = additionalInfo?.info?.info?.symbol;
      }
      if(additionalInfo?.info?.info?.name){
        collateral.name = additionalInfo?.info?.info?.name;
      }

      console.log(liquidationStats)
      const bids = bidAmounts?.bids?.bidByUser.bids;
      const totalBidAmountStat = liquidationStats?.liquidationStats?.otherStats.find((c) => c.id == "pool_value_stable");
      return {
        collateral,
        price: big(microfyPrice(oracle?.price, collateral.decimals)).mul(exchangeRate).toString() as UST,
        bidNumber: bids?.filter((bid) => bid.amount !="0").length ?? 0,
        bidAmountInUST: big(bids?.reduce((partialSum, el) => partialSum.plus(el.amount), big(0)) ?? 0) as u<UST<BigSource>>,
        totalBidAmountInUST: totalBidAmountStat?.format_func(totalBidAmountStat.value ?? 0),
        poolToCollateralRatio: liquidationStats?.liquidationStats?.ratio ?? 0
      };
    })
    .sort((a, b) =>
      big(a.bidAmountInUST).gte(big(b.bidAmountInUST)) ? -1 : 1,
    )
  }, [liquidationBids, borrowMarket, whitelist, additionalLSDInfo, globalLiquidationStats]);




  return (
    <CenteredLayout className={className} maxWidth={2000}>
      <>
        <FlexTitleContainer>
          <PageTitle title="LIQUIDATE" docs={links.docs.liquidate} />
        </FlexTitleContainer>
        <section className="grid">
          <PaddingSection className="main-section" padding="20px 20px" >
            <HorizontalScrollTable minWidth={850}>
              <colgroup>
                <col style={{ width: 200 }} />
                <col style={{ width: 200 }} />
                <col style={{ width: 200 }} />
                <col style={{ width: 250 }} />
              </colgroup>
              <thead>
                <tr>
                  <th style={{display: "flex", alignItems: "center", gap: "5px"}}>LIQUIDATION QUEUES 
                    <InfoTooltip>
                      Cavern Protocol allows depositing multiple collaterals. 
                      Collateral liquidations are carried out using liquidation Queues when loans default. 
                      Provide some liquidity to either queue in order to get assets for cheaper that their market price.
                    </InfoTooltip>
                  </th>
                  <th>
                    <IconSpan>
                      Price{' '}
                      <InfoTooltip>
                        Current price of Collateral 
                      </InfoTooltip>
                    </IconSpan>
                  </th>
                  <th>
                    <IconSpan>
                      Bids{' '}
                      <InfoTooltip>
                        Number of bids you have active in the liquidation queue
                      </InfoTooltip>
                    </IconSpan>
                  </th>
                  <th>
                    <IconSpan>
                      Bids Value{' '}
                      <InfoTooltip>
                        Value of funds you deposited in the liquidation queue /
                        Total value of funds deposited in the liquidation queue
                      </InfoTooltip>
                    </IconSpan>
                  </th>
                  <th>
                    <IconSpan>
                      Ratio to provided collateral{' '}
                      <InfoTooltip>
                        Ratio of bids in the queue to the total collaterals provided
                      </InfoTooltip>
                    </IconSpan>
                  </th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {collaterals.map(
                  ({
                    collateral,
                    price,
                    bidNumber,
                    bidAmountInUST,
                    totalBidAmountInUST,
                    poolToCollateralRatio
                  }) => (
                    <tr key={collateral.collateral_token}>
                      <td>
                        <i>
                          <TokenIcon
                            symbol={collateral.symbol}
                            path={collateral.icon}
                          />
                        </i>
                        <div>
                          <div className="coin">
                            {collateral.symbol}
                          </div>
                          <p className="name">{collateral.name}</p>
                        </div>
                      </td>
                      <td>
                        <div className="value">{formatUSTOutput(price)} axlUSDC</div>
                      </td>
                      <td>
                        <div className="value">
                          {bidNumber} {bidNumber != 1 ? "bids" : "bid"}
                        </div>
                      </td>
                      <td>
                        <div className="value">
                          {formatOutput(
                            demicrofy(bidAmountInUST, collateral.decimals),
                            {
                              decimals: 3,
                            },
                          )}{' '}
                          axlUSDC
                        </div>
                        <p className="volatility">
                          {totalBidAmountInUST} axlUSDC
                        </p>
                      </td>
                      <td>
                        <AlignedRightStatsDoughnutCard
                          title=""
                          value={poolToCollateralRatio}
                          className={'stats-doughtnut-card'}
                        />
                      </td>
                      <td>
                          <Link to={`${collateral.symbol}`} style={{color:"inherit", textDecoration: "none"}}>
                            <BorderButton>
                              See Liquidation Queue
                            </BorderButton>
                          </Link>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </HorizontalScrollTable>
        </PaddingSection>
      </section>
      </>
    </CenteredLayout>
  );
}

const AlignedRightStatsDoughnutCard = styled(StatsDoughnutCard)`
  margin-left: auto;
  margin-right: 0;
  max-width: 150px;
  .text-inside-doughnut .doughnut-value{
    font-size: 20px
  }
`


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

  // ---------------------------------------------
  // layout
  // ---------------------------------------------
  .main-section {
    h2 {
      margin-bottom: 15px;
    }
  }

  // pc
  @media (min-width: ${screen.monitor.min}px) {
    .grid {
      display: grid;

      grid-template-columns: repeat(1fr);
      grid-template-rows: auto auto auto;
      grid-gap: 20px;

      .NeuSection-root {
        margin: 0;
      }

      .main-section {
        grid-column: 1/1;
        grid-row: 1 / 1;
        margin: auto 50px;
      }
    }
  }

  // under pc
  @media (max-width: ${screen.pc.max}px) {
    .grid > * {
      margin: 20px 0px;
    }
  }

  .grid{

    border-color: red;

    table {
      thead {
        th {
          text-align: right;

          &:first-child {
            font-size: 12px;
            font-weight: 500;
            color: ${({ theme }) => theme.textColor};
            text-align: left;
          }
        }
      }

      tbody {
        td {
          text-align: right;

          .value,
          .coin {
            font-size: 16px;
          }

          .volatility,
          .name {
            font-size: 12px;
            color: ${({ theme }) => theme.dimTextColor};
          }

          &:first-child {
            text-align: left;

            display: flex;
            height: 210px;

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

          &:last-child {
            button {
              height: 32px;
              font-size: 12px;
              font-weight: 500;

              padding: 0 24px;

              &:not(:last-child) {
                margin-right: 10px;
              }
            }
          }
        }
      }
    }
  }

  // mobile
  @media (max-width: ${screen.mobile.max}px) {
    .collateral-list{
      h2 {
        margin-bottom: 20px;
      }
    }
  }

`;

export const LiquidateList = fixHMR(StyledComponent);