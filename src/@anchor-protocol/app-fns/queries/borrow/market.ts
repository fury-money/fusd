import {
  UST,
  CW20Addr,
  HumanAddr,
  moneyMarket,
  Rate,
  u,
  NativeDenom,
} from '@anchor-protocol/types';
import { terraBalancesQuery } from '@libs/app-fns';
import {
  QueryClient,
  wasmFetch,
  WasmQuery,
  WasmQueryData,
} from '@libs/query-client';
import big from 'big.js';
import { ANCHOR_SAFE_RATIO } from '../../env';

export type BAssetLtv = {
  max: Rate;
  safe: Rate;
};

export type BAssetLtvs = Map<CW20Addr, BAssetLtv>;

interface BorrowMarketWasmQuery {
  marketState: WasmQuery<
    moneyMarket.market.State,
    moneyMarket.market.StateResponse
  >;
  borrowRate: WasmQuery<
    moneyMarket.interestModel.BorrowRate,
    moneyMarket.interestModel.BorrowRateResponse
  >;
  oraclePrices: WasmQuery<
    moneyMarket.oracle.Prices,
    moneyMarket.oracle.PricesResponse
  >;
  overseerWhitelist: WasmQuery<
    moneyMarket.overseer.Whitelist,
    moneyMarket.overseer.WhitelistResponse
  >;
}

export interface BorrowMarketStateQueryVariables {
  marketContract: string;
}

export type BorrowMarket = WasmQueryData<BorrowMarketWasmQuery> & {
  marketBalances: {
    uUST: u<UST>;
  };
  bAssetLtvs: BAssetLtvs;
};

type MarketStateWasmQuery = Pick<BorrowMarketWasmQuery, 'marketState'>;
type MarketWasmQuery = Omit<BorrowMarketWasmQuery, 'marketState'>;

export async function borrowMarketQuery(
  marketContract: HumanAddr,
  interestContract: HumanAddr,
  oracleContract: HumanAddr,
  overseerContract: HumanAddr,
  stableDenom: NativeDenom,
  queryClient: QueryClient,
): Promise<BorrowMarket> {
  const _marketBalances = await terraBalancesQuery(
    marketContract,
    [
      {
        native_token: {
          denom: 'uluna',
        },
      },
      {
        native_token: {
          denom: stableDenom,
        },
      },
    ],
    queryClient,
  );

  const { marketState } = await wasmFetch<MarketStateWasmQuery>({
    ...queryClient,
    id: `borrow--market-state`,
    wasmQuery: {
      marketState: {
        contractAddress: marketContract,
        query: {
          state: {},
        },
      },
    },
  });

  const marketBalances: Pick<BorrowMarket, 'marketBalances'>['marketBalances'] =
    {
      uUST: (_marketBalances.balances.find(
        ({ asset }: any) => asset?.native_token?.denom === stableDenom,
      )?.balance ?? '0') as u<UST>,
    };

  const {
    borrowRate,
    oraclePrices: _oraclePrices,
    overseerWhitelist,
  } = await wasmFetch<MarketWasmQuery>({
    ...queryClient,
    id: `borrow--market`,
    wasmQuery: {
      borrowRate: {
        contractAddress: interestContract,
        query: {
          borrow_rate: {
            market_balance: marketBalances.uUST,
            total_liabilities: marketState.total_liabilities,
            total_reserves: marketState.total_reserves,
          },
        },
      },
      oraclePrices: {
        contractAddress: oracleContract,
        query: {
          prices: {},
        },
      },
      overseerWhitelist: {
        contractAddress: overseerContract,
        query: {
          whitelist: {},
        },
      },
    },
  });

  const whitelistIndex: Map<
    string,
    moneyMarket.overseer.WhitelistResponse['elems'][number]
  > = new Map();

  for (const elem of overseerWhitelist.elems) {
    whitelistIndex.set(elem.collateral_token, elem);
  }

  const bAssetLtvs: BAssetLtvs = new Map();

  const oraclePrices: moneyMarket.oracle.PricesResponse =
    //@ts-ignore
    'Ok' in _oraclePrices ? _oraclePrices.Ok : _oraclePrices;

  for (const price of oraclePrices.prices) {
    const max = whitelistIndex.has(price.asset)
      ? whitelistIndex.get(price.asset)?.max_ltv ?? ('0.5' as Rate)
      : ('0.5' as Rate);

    const safe = big(max).mul(ANCHOR_SAFE_RATIO).toFixed() as Rate;

    if (max && safe) {
      bAssetLtvs.set(price.asset, { max, safe });
    }
  }

  return {
    marketBalances,
    marketState,
    overseerWhitelist,
    oraclePrices,
    borrowRate,
    bAssetLtvs,
  };
}
