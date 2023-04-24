import React from 'react';
import { demicrofy } from '@libs/formatter';
import { u, UST } from '@anchor-protocol/types';
import { Big } from 'big.js';
import { IconSpan } from '@libs/neumorphism-ui/components/IconSpan';
import { formatUSTWithPostfixUnits } from '@anchor-protocol/notation';

interface AncUstLpRewardsProps {
  rewardsAmountInUst: u<UST<Big>>;
}

export const AncUstLpRewards = ({
  rewardsAmountInUst,
}: AncUstLpRewardsProps) => {
  return (
    <>
      <p className="subtext">
        <IconSpan>
          ≈ {formatUSTWithPostfixUnits(demicrofy(rewardsAmountInUst))} axlUSDC
        </IconSpan>
      </p>
    </>
  );
};
