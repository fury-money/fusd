import React from 'react';
import { UIElementProps } from '@libs/ui';
import styled from 'styled-components';
import { ChainButton } from './ChainButton';

const ChainSelectorBase = (props: UIElementProps) => {
  const { className } = props;

  return (
    <div className={className}>
      <ChainButton />
    </div>
  );
};

export const ChainSelector = styled(ChainSelectorBase)`
  display: inline-block;
  position: relative;
  text-align: left;
`;
