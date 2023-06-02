import { QueryClient, wasmFetch, WasmQuery } from "@libs/query-client";
import { LSDContracts } from "@anchor-protocol/app-provider";
import { cw20, HumanAddr, Rate, Token, u } from "@libs/types";

interface WrapperTokenInfoResponse {
  decimals: number;
  name: string;
  symbol: string;
  total_supply: u<Token>;
  exchange_rate: Rate;
  expected_exchange_rate: Rate;
}
interface CollateralWrapperTokenInfoWasmQuery {
  tokenInfo: WasmQuery<cw20.TokenInfo, WrapperTokenInfoResponse>;
}

interface CW20BalanceWasmQuery {
  tokenBalance: WasmQuery<cw20.Balance, cw20.BalanceResponse<Token>>;
}

export async function getAmpLPExchangeRate(
  queryClient: QueryClient,
  lsd: LSDContracts,
  oracle: HumanAddr
) {
  if (!lsd.info.amp_lp) {
    throw "Expected a amp_lp like collateral token here";
  } // We need
  const [wrapperInfoResponse, wrapper_lsd_balance] = await Promise.all([
    // 1. The wrapper total supply
    wasmFetch<CollateralWrapperTokenInfoWasmQuery>({
      ...queryClient,
      id: `cw20--token-info=${lsd.token}`,
      wasmQuery: {
        tokenInfo: {
          contractAddress: lsd.token,
          query: {
            token_info: {},
          },
        },
      },
    }),
    // 2. The wrapper lsd balance
    wasmFetch<CW20BalanceWasmQuery>({
      ...queryClient,
      id: `cw20--balance=${lsd.token}`,
      wasmQuery: {
        tokenBalance: {
          contractAddress: lsd.info.amp_lp.token,
          query: {
            balance: {
              address: lsd.token as HumanAddr,
            },
          },
        },
      },
    }),
  ]);

  let wrapperSupply = parseFloat(wrapperInfoResponse.tokenInfo.total_supply);
  let wrapperBalance = parseFloat(wrapper_lsd_balance.tokenBalance.balance);

  if (wrapperSupply == 0 || wrapperBalance == 0) {
    return {
      hubState: {
        exchange_rate: "1" as Rate<string>,
      },
    };
  }

  return {
    hubState: {
      exchange_rate: (
        wrapperSupply / wrapperBalance
      ).toString() as Rate<string>,
    },
  };
}

interface AmpLpState {
  state: {
    addr?: string;
  };
}
interface AmpLpStateResponse {
  total_lp: string;
  total_amp_lp: string;
  exchange_rate: Rate;

  pair_contract: String;
  locked_assets: any[];
  user_info: any;
}
interface AmpLpStateWasmQuery {
  state: WasmQuery<AmpLpState, AmpLpStateResponse>;
}

export async function getAmpLPLSDExchangeRate(
  queryClient: QueryClient,
  lsd: LSDContracts,
  oracle: HumanAddr
) {
  if (!lsd.info.amp_lp) {
    throw "Expected a amp_lp like collateral token here";
  } // We need
  const ampLPStateResponse = await wasmFetch<AmpLpStateWasmQuery>({
    ...queryClient,
    id: `cw20--amp-state-info=${lsd.token}`,
    wasmQuery: {
      state: {
        contractAddress: lsd.info.amp_lp.hub,
        query: {
          state: {},
        },
      },
    },
  });

  return ampLPStateResponse.state.exchange_rate;
}
