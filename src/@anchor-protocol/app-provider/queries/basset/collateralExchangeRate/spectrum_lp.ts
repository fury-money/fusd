import { QueryClient, wasmFetch, WasmQuery } from "@libs/query-client";
import { LSDContracts } from "@anchor-protocol/app-provider";
import {
  cw20,
  CW20Addr,
  HumanAddr,
  NativeDenom,
  Rate,
  Token,
  u,
} from "@libs/types";
import { moneyMarket } from "@anchor-protocol/types";

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

interface CTokenState {
  state: {};
}
interface CTokenStateResponse {
  total_bond_share: string;
}
interface CTokenStateWasmQuery {
  state: WasmQuery<CTokenState, CTokenStateResponse>;
}

interface UserInfo {
  user_info: {
    user: HumanAddr;
    lp_token: HumanAddr;
  };
}
interface UserInfoResponse {
  /// Total supply to the cToken
  bond_share: string;
  bond_amount: string;
  reward_indexes: any[];
  pending_rewards: any[];
}
interface UserInfoWasmQuery {
  user_info: WasmQuery<UserInfo, UserInfoResponse>;
}

interface CW20BalanceWasmQuery {
  tokenBalance: WasmQuery<cw20.Balance, cw20.BalanceResponse<Token>>;
}

export async function getSpectrumExchangeRate(
  queryClient: QueryClient,
  lsd: LSDContracts,
  oracle: HumanAddr
) {
  if (!lsd.info.spectrum_lp) {
    throw "Expected a spectrum like collateral token here";
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
          contractAddress: lsd.info.spectrum_lp.token,
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
