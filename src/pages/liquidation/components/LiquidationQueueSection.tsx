import React, {
  useRef,
  useEffect,
  useState,
  useMemo,
  Dispatch,
  SetStateAction,
} from 'react';
import styled, { useTheme } from 'styled-components';
import { screen } from 'env';

import { Section } from '@libs/neumorphism-ui/components/Section';
import {
  useLiquidationGraph,
  useMyLiquidationStats,
} from './useLiquidationGraph';
import { StatsFigureCard } from './StatsFigureCard';
import { StatsDoughnutCard } from './StatsDoughnutCard';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TooltipItem,
  ChartData,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useMediaQuery } from '@mui/material';
import { AnimateNumber } from '@libs/ui';
import { WhitelistCollateral } from 'queries';
import { HumanAddr } from '@libs/types';

export interface LiquidationQueueProps {
  className?: string;
  collateral: WhitelistCollateral | undefined;
  setClickedBar: Dispatch<SetStateAction<number | undefined>>;
}

function Component({ className, collateral, setClickedBar }: LiquidationQueueProps) {

  // ---------------------------------------------
  // Graph imports
  // ---------------------------------------------

  const theme = useTheme();
  const graphData = useLiquidationGraph(collateral?.collateral_token);

  const chartRef = useRef<ChartJS<'bar', number[], number>>(null);

  ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
  );

  const isSmallScreen = useMediaQuery('(max-width:600px)');

  const options = useMemo(
    () => ({
      maintainAspectRatio: false,
      responsive: true,
      plugins: {
        legend: {
          position: 'top' as const,
          align: 'end',
          labels: {
            usePointStyle: true,
            color: theme.palette.text.primary,
          },
          title: { text: 'axlUSDC positions' },
        },
        title: {
          display: false,
        },
        tooltip: {
          callbacks: {
            title: () => 'Click to Bid',
            label: (item: TooltipItem<any>) => [
              `Premium : ${item.label}`,
              `Value : ${item.formattedValue} axlUSDC`,
            ],
          },
          displayColors: false,
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            color: theme.palette.text.primary,
            // Include a % sign in the ticks
            callback: function (value: number) {
              if (value % 2 === 0) {
                return value + '%';
              }
            },
          },
        },
        y: {
          grid: {
            color: theme.liquidationChart?.lineColor,
          },
          ticks: {
            color: theme.palette.text.primary,
            display: !isSmallScreen,
            // Include a dollar sign in the ticks
            callback: function (value: number) {
              if (value !== 0) {
                return '$' + value;
              }
            },
          },
        },
      },
      onClick(e: any) {
        const chart = chartRef.current;
        if (!chart) {
          return;
        }
        const activePoints = chart.getElementsAtEventForMode(
          e,
          'nearest',
          {
            intersect: true,
          },
          false,
        );
        const [{ index }] = activePoints;
        setClickedBar(index);
      },
    }),
    [isSmallScreen, theme, setClickedBar],
  );

  const data = useMemo(
    () => ({
      labels: graphData.labels,
      datasets: [
        {
          label: 'Dataset 1',
          data: graphData.data,
          backgroundColor:
            'linear-gradient(180deg,rgba(30,146,230,.8) 0%,rgba(96,251,208,.8) 125%)',
        },
      ],
    }),
    [graphData],
  );

  const [chartData, setChartData] = useState<
    ChartData<'bar', number[], number>
  >({ datasets: [] });
  const [chartOptions, setChartOptions] = useState({
    plugins: {},
  });

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) {
      return;
    }
    const barGradient = chart.ctx.createLinearGradient(0, 0, 0, 500);
    barGradient.addColorStop(0, '#4BDB4B');
    barGradient.addColorStop(1, 'rgb(45, 131, 45)');

    const chartDisplayData = {
      ...data,
      datasets: data.datasets.map((dataset) => ({
        ...dataset,
        backgroundColor: barGradient,
      })),
    };
    const chartOptions = {
      ...options,
      plugins: {
        ...options.plugins,
        legend: {
          ...options.plugins.legend,
          labels: {
            ...options.plugins.legend.labels,
            generateLabels: () => [
              {
                text: 'axlUSDC Positions',
                fillStyle: barGradient,
                strokeStyle: barGradient,
              },
            ],
          },
        },
      },
    };
    setChartData(chartDisplayData);
    setChartOptions(chartOptions);
  }, [data, options, theme]);

  // ---------------------------------------------
  // Liquidation Stats
  // ---------------------------------------------

  const liquidationStats = useMyLiquidationStats(
    collateral?.collateral_token, 
    collateral?.symbol, 
    collateral && "info" in collateral ? collateral.info.info.hubAddress as HumanAddr : undefined
  );

  // ---------------------------------------------
  // presentation
  // ---------------------------------------------
  return (
    <Section className={className}>
      <div className="liquidation-stats-graph" style={{ minHeight: 400 }}>
        <Bar ref={chartRef} options={chartOptions} data={chartData} />
      </div>
      <FlexContainer>
        <StatsFigureCardContainer className="liquidation-stats-numbers">
          <StatsDoughnutCard
            title="Pool Ratio"
            value={liquidationStats.ratio}
            className={'stats-doughtnut-card'}
          />
        </StatsFigureCardContainer>

        <StatsFigureCardContainer className="liquidation-stats-numbers">
          {liquidationStats.otherStats.map((stat) => {
            return (
              <StatsFigureCard title={stat.title} key={stat.title}>
                <AnimateNumber format={(v: any) => stat.format_func(v)}>
                  {stat.value}
                </AnimateNumber>
              </StatsFigureCard>
            );
          })}
        </StatsFigureCardContainer>
      </FlexContainer>
    </Section>
  );
}

const FlexContainer = styled.div`
  // pc
  @media (min-width: ${screen.mobile.max}px) {
    flex-direction: row;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
  }
`;

const StatsFigureCardContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: end;
  justify-content: center;
  flex-wrap: wrap;
  gap: 20px;
`;

export const LiquidationQueueSection = Component;
