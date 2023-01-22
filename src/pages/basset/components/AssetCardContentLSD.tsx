import {
  useAnchorBank,
  useBLunaClaimableRewards,
  useBLunaWithdrawableAmount,
} from '@anchor-protocol/app-provider';
import { formatUST } from '@anchor-protocol/notation';
import { demicrofy, formatUToken } from '@libs/formatter';
import { Luna, Token, u } from '@libs/types';
import big, { Big, BigSource } from 'big.js';
import { RegisteredLSDs } from 'env';
import React, { useMemo } from 'react';
import { claimableRewards as _claimableRewards } from '../logics/claimableRewards';

export function AssetCardContentLSD({
  asset
}: {
  asset: string
}) {
  const { tokenBalances } = useAnchorBank();

  const { data: { withdrawableUnbonded: _withdrawableAmount } = {} } =
    useBLunaWithdrawableAmount();

  const { data: { claimableReward, rewardState } = {} } =
    useBLunaClaimableRewards();

  const claimableRewards = useMemo(
    () => _claimableRewards(claimableReward, rewardState),
    [claimableReward, rewardState],
  );

  const withdrawableLuna = useMemo(
    () => big(_withdrawableAmount?.withdrawable ?? 0) as u<Luna<Big>>,
    [_withdrawableAmount?.withdrawable],
  );

  return (
    <table>
      <tbody>
        <tr>
          <th>LUNA</th>
          <td>{formatUToken(tokenBalances.uLuna)}</td>
        </tr>
        <tr>
          <th>{asset}</th>
          <td>{formatUToken(tokenBalances.uLSDs[asset as RegisteredLSDs] as u<Token<BigSource>>)}</td>
        </tr>
      </tbody>
    </table>
  );
}
