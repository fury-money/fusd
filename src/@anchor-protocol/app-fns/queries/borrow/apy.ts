import { DateTime, Rate } from '@anchor-protocol/types';
import big from 'big.js';
import { MarketState } from '../market/state';

export interface BorrowAPYData {
  borrowerDistributionAPYs: Array<{
    DistributionAPY: Rate;
    Height: number;
    Timestamp: DateTime;
  }>;

  govRewards: Array<{
    CurrentAPY: Rate;
    Timestamp: DateTime;
    Height: number;
  }>;

  lpRewards: Array<LPReward>;
}

type LPReward = {
  apr: Rate<number>;
  apy: Rate<number>;
};

export async function borrowAPYQuery(
  marketState: MarketState | undefined,
  blocksPerYear: number,
  lastSyncedHeight: () => Promise<number>,
): Promise<BorrowAPYData> {
  const blockHeight = await lastSyncedHeight();

  // We simply need to query the chain to get the borrower rewards that were just distributed
  // And compare that to the total liabilities
  // Those informations are located in the state variable of the market function

  // We compute the rewards percentage for this block
  let blockRewards = big('0');
  if (
    marketState?.marketState?.total_liabilities &&
    marketState?.marketState?.prev_borrower_incentives
  ) {
    blockRewards = big(marketState?.marketState?.prev_borrower_incentives).div(
      marketState?.marketState.total_liabilities,
    );
  }
  // Now we convert to an APY (block to year)
  const rewardsAPY = blockRewards.mul(blocksPerYear);

  /*await fetch(
    `${endpoint}/v2/distribution-apy`,
  )
    .then((res) => res.json())
    .then(
      ({
        height,
        timestamp,
        distribution_apy,
      }: {
        height: number;
        timestamp: DateTime;
        distribution_apy: Rate;
      }) => {
        return {
          DistributionAPY: distribution_apy,
          Height: height,
          Timestamp: timestamp,
        };
      },
    );
    */

  const govRewards = {
    CurrentAPY: '0' as Rate<string>,
    Timestamp: Date.now() as DateTime,
    Height: 1,
  };

  /*await fetch(`${endpoint}/v2/gov-reward`)
    .then((res) => res.json())
    .then(
      ({
        height,
        timestamp,
        current_apy,
      }: {
        height: number;
        timestamp: DateTime;
        current_apy: Rate;
      }) => {
        return {
          CurrentAPY: current_apy,
          Timestamp: timestamp,
          Height: height,
        };
      },
    );
    */

  const ancAstroLPRewards = {
    apr: 0 as Rate<number>,
    apy: 0 as Rate<number>,
  };

  /*await hiveFetch<any, {}, LpRewardsQueryResult>({
    hiveEndpoint: 'https://api.astroport.fi/graphql',
    variables: {
      address: ancUstPair,
    },
    wasmQuery: {},
    query: LP_REWARDS_QUERY,
  }).then((res) => {
    if (!res.pool) {
      return { apr: 0, apy: 0 };
    }
    return res.pool.total_rewards;
  });
  
  */
  return {
    borrowerDistributionAPYs: [
      {
        DistributionAPY: rewardsAPY.toString() as Rate,
        Timestamp: Date.now() as DateTime,
        Height: blockHeight,
      },
    ],
    govRewards: [govRewards],
    lpRewards: [ancAstroLPRewards as LPReward],
  };
}
