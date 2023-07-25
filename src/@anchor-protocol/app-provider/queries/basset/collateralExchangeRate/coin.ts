import { QueryClient, wasmFetch, WasmQuery } from "@libs/query-client";
import { LSDContracts } from "@anchor-protocol/app-provider";
import { CW20Addr, HumanAddr, NativeDenom, Rate } from "@libs/types";
import { moneyMarket } from "@anchor-protocol/types";

interface OraclePriceQuery {
  oraclePrice: WasmQuery<
    moneyMarket.oracle.Price,
    moneyMarket.oracle.PriceResponse
  >;
}

export async function getCoinExchangeRate(
  queryClient: QueryClient,
  lsd: LSDContracts,
  oracle: HumanAddr
) {
  if (!lsd.info.coin) {
    throw "Expected a coin like collateral token here";
  }
  const oracleExchangeRate = await wasmFetch<OraclePriceQuery>({
    ...queryClient,
    id: `basset--claimable-rewards`,
    wasmQuery: {
      oraclePrice: {
        contractAddress: oracle,
        query: {
          price: {
            base: lsd.info.coin?.denom as CW20Addr,
            quote: lsd.info.underlyingToken as NativeDenom,
          },
        },
      },
    },
  });

  return {
    hubState: {
      exchange_rate: oracleExchangeRate.oraclePrice
        .rate as string as Rate<string>,
    },
  };
}
