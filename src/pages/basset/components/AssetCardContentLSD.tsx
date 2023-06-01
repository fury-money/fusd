import {
  useAnchorBank,
  useAnchorWebapp,
  useBLunaClaimableRewards,
  useBLunaWithdrawableAmount,
} from '@anchor-protocol/app-provider';
import { formatUST } from '@anchor-protocol/notation';
import { useCW20Balance } from '@libs/app-provider';
import { demicrofy, formatUToken } from '@libs/formatter';
import { CW20Addr, Luna, Token, u } from '@libs/types';
import big, { Big, BigSource } from 'big.js';
import { useAccount } from 'contexts/account';
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

  const {terraWalletAddress} = useAccount();

  const underlyingCW20Balance = useCW20Balance(underlyingName.includes("terra") ? underlyingName as CW20Addr : undefined, terraWalletAddress);



  const baseTokenBalance = useMemo(()=> {
    if(underlyingToken.toLowerCase() == "uluna"){
      return tokenBalances.uLuna
    }else if(underlyingCW20Balance && underlyingCW20Balance != "0"){
      return underlyingCW20Balance
    }else if (underlyingToken in tokenBalances.otherBalances){
      return tokenBalances.otherBalances[underlyingToken]
    }else{
      return "0"
    }
  }, [tokenBalances.uLuna, tokenBalances.otherBalances])

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
