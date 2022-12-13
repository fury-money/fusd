import { Divider } from '@mui/material';
import React, { ReactNode } from 'react';
import styled from 'styled-components';

export interface StatsCardProps {
  className?: string;
  title: string;
  children: ReactNode;
}

const Component: React.FC<StatsCardProps> = (props: StatsCardProps) => {
  return (
    <div className={props.className}>
      {props.title}
      <Divider className="stats-figure-card-divider" />
      <ValueContainer>{props.children}</ValueContainer>
    </div>
  );
};

const ValueContainer = styled.div`
  font-size: 24px;
`;

export const StatsFigureCard = styled(Component)`
  max-width: 150px;
  height: 100%;
  text-align: center;
  .stats-figure-card-divider {
    margin: 20px 0px 10px;
  }
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  justify-content: stretch;
`;
