import {
  useAnchorBank,
  useAnchorWebapp,
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
  asset,
  underlyingName,
  underlyingToken
}: {
  asset: string,
  underlyingName: string,
  underlyingToken: string
}) {
  const { tokenBalances } = useAnchorBank();

  const { data: { withdrawableUnbonded: _withdrawableAmount } = {} } =
    useBLunaWithdrawableAmount();

  const { data: { claimableReward, rewardState } = {} } =
    useBLunaClaimableRewards();


  const baseTokenBalance = useMemo(()=> {
    if(underlyingToken.toLowerCase() == "uluna"){
      return tokenBalances.uLuna
    }else{
      return tokenBalances.otherBalances[underlyingToken] ?? "0";
    }
  }, [tokenBalances.uLuna, tokenBalances.otherBalances])


  console.log(tokenBalances.uLSDs)


  return (
    <table>
      <tbody>
        <tr>
          <th>{underlyingName.toUpperCase()}</th>
          <td>{formatUToken(baseTokenBalance)}</td>
        </tr>
        <tr>
          <th>{asset}</th>
          <td>{formatUToken(tokenBalances.uLSDs[asset as RegisteredLSDs] as u<Token<BigSource>>)}</td>
        </tr>
      </tbody>
    </table>
  );
}
