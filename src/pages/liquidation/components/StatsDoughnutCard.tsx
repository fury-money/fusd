import { Divider } from '@mui/material';
import React from 'react';
import styled from 'styled-components';
import { Doughnut } from 'react-chartjs-2';
import { ChartOptions } from 'chart.js';

export interface StatsDoughnutCardProps {
  className: string;
  value: number;
  title: string;
}

const Component: React.FC<StatsDoughnutCardProps> = (
  props: StatsDoughnutCardProps,
) => {
  const data = {
    labels: [],
    datasets: [
      {
        data: [1],
        backgroundColor: ['rgba(255, 159, 64, 0.2)'],
        borderColor: ['rgba(255, 159, 64, 0)'],
        radius: '100%',
        cutout: '85%',
      },
      {
        data: [1],
        backgroundColor: ['rgba(255, 159, 64, 1)'],
        borderColor: ['rgba(255, 255,255, 0)'],
        circumference: 360 * Math.max(Math.min(props.value, 1), 0),
        radius: '125%',
        cutout: '60%',
      },
    ],
  };

  let options: ChartOptions = {
    plugins: {
      tooltip: {
        enabled: false,
      },
    },
    animation: false,
    //hover: false
  };
  return (
    <div className={props.className}>
      <Doughnut data={data} options={options} />
      <div className="text-inside-doughnut">
        {props.title}
        <Divider className="stats-figure-card-divider" />
        <ValueContainer className="doughnut-value">
          {props.value.toLocaleString(undefined, {
            style: 'percent',
            minimumFractionDigits: 1,
          })}
        </ValueContainer>
      </div>
    </div>
  );
};

const ValueContainer = styled.div`
  font-size: 24px;
`;

export const StatsDoughnutCard = styled(Component)`
  max-width: 200px;
  height: 100%;
  text-align: center;
  position: relative;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  justify-content: stretch;

  .stats-figure-card-divider {
    margin: 10px 0px 5px;
  }
  .text-inside-doughnut {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 100%;
    max-width: 60px;
    transform: translate(-50%, -50%);
  }
  .text-inside-doughnut .doughnut-value {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
`;
