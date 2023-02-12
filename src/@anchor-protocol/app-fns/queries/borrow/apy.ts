import { DateTime, HumanAddr, moneyMarket, Rate } from "@anchor-protocol/types";
import { QueryClient, wasmFetch, WasmQuery } from "@libs/query-client";
import big from "big.js";
import { MarketState } from "../market/state";

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

interface MarketBorrowIncentivesWasmQuery {
  borrowIncentives: WasmQuery<
    moneyMarket.market.BorrowerIncentives,
    moneyMarket.market.BorrowRateResponse
  >;
}

export async function borrowAPYQuery(
  queryClient: QueryClient,
  blocksPerYear: number,
  lastSyncedHeight: number,
  mmMarketContract: HumanAddr
): Promise<BorrowAPYData> {
  // We simply need to query the chain to get the borrower rewards that were just distributed
  // And compare that to the total liabilities
  // Those informations are located in the state variable of the market function

  // Now we evolve from that and rather compute the future APY,
  // We can simply query the market contract, we added a function just for that.

  let { borrowIncentives } = await wasmFetch<MarketBorrowIncentivesWasmQuery>({
    ...queryClient,
    id: `market--borrow-incentives`,
    wasmQuery: {
      borrowIncentives: {
        contractAddress: mmMarketContract,
        query: {
          borrower_incentives: {},
        },
      },
    },
  })
    // If the function is not defined on the contract(testnet)
    .catch((error) => ({
      borrowIncentives: {
        rate: "0",
      },
    }));

  // Now we convert to an APY (block to year)
  const rewardsAPY = big(borrowIncentives.rate).mul(blocksPerYear);

  const govRewards = {
    CurrentAPY: "0" as Rate<string>,
    Timestamp: Date.now() as DateTime,
    Height: 1,
  };

  const ancAstroLPRewards = {
    apr: 0 as Rate<number>,
    apy: 0 as Rate<number>,
  };

  return {
    borrowerDistributionAPYs: [
      {
        DistributionAPY: rewardsAPY.toString() as Rate,
        Timestamp: Date.now() as DateTime,
        Height: lastSyncedHeight,
      },
    ],
    govRewards: [govRewards],
    lpRewards: [ancAstroLPRewards as LPReward],
  };
}
