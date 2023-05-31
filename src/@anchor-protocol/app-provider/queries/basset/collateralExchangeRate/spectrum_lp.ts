import { QueryClient, wasmFetch, WasmQuery } from "@libs/query-client";
import { LSDContracts } from "@anchor-protocol/app-provider";
import { cw20, CW20Addr, HumanAddr, NativeDenom, Rate, Token, u } from "@libs/types";
import { moneyMarket } from "@anchor-protocol/types";

interface WrapperTokenInfoResponse{
  decimals: number;
  name: string;
  symbol: string;
  total_supply: u<Token>;
  exchange_rate: Rate;
  expected_exchange_rate: Rate;
}
interface CollateralWrapperTokenInfoWasmQuery {
  tokenInfo: WasmQuery<cw20.TokenInfo,WrapperTokenInfoResponse>;
}

interface CTokenState{
  state: {}
}
interface CTokenStateResponse{
    total_bond_share: string,
}
interface CTokenStateWasmQuery {
  state: WasmQuery<CTokenState,CTokenStateResponse>;
}

interface UserInfo{
  user_info: {
    user: HumanAddr,
    lp_token: HumanAddr
  }
}
interface UserInfoResponse {
    /// Total supply to the cToken
    bond_share: string,
    bond_amount: string,
    reward_indexes: any[],
    pending_rewards: any[],
}
interface UserInfoWasmQuery {
  user_info: WasmQuery<UserInfo,UserInfoResponse>;
}

export async function getSpectrumExchangeRate(
  queryClient: QueryClient,
  lsd: LSDContracts,
  oracle: HumanAddr,
){
	if(!lsd.info.spectrum_lp){
		throw "Expected a spectrum like collateral token here"
	}// We need 
    const [wrapperInfoResponse, bondAmount, bondShare] = await Promise.all([
    // 1. The token expected exchange rate
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
    // 2. The actual exchange rate (bond_amount / bond_share)
    // a. Bond amount
      wasmFetch<UserInfoWasmQuery>({
        ...queryClient,
        id: `cw20--token-info=${lsd.token}`,
        wasmQuery: {
          user_info: {
            contractAddress: lsd.info.spectrum_lp.generator,
            query: {
              user_info: {
                user: lsd.info.spectrum_lp.token as HumanAddr,
                lp_token: lsd.info.spectrum_lp.underlyingToken as HumanAddr
              },
            },
          },
        },
      }),
    // b. Bond share
      wasmFetch<CTokenStateWasmQuery>({
        ...queryClient,
        id: `compound--state=${lsd.info.spectrum_lp.token}`,
        wasmQuery: {
          state: {
            contractAddress: lsd.info.spectrum_lp.token,
            query: {
              state: {},
            },
          },
        },
      }),
    ]);

    console.log(
      parseFloat(bondAmount.user_info.bond_amount)
        /
      parseFloat(bondShare.state.total_bond_share)
    )

    return {
        hubState: {
          exchange_rate: 
          (
            parseFloat(bondAmount.user_info.bond_amount)
              /
            parseFloat(bondShare.state.total_bond_share)
              /
            parseFloat(wrapperInfoResponse.tokenInfo.expected_exchange_rate)
          ).toString() as Rate<string>
      }
    }
}