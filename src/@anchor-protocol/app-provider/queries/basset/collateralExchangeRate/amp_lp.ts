import { QueryClient, wasmFetch, WasmQuery } from "@libs/query-client";
import { LSDContracts } from "@anchor-protocol/app-provider";
import { cw20, HumanAddr, Rate, Token, u } from "@libs/types";

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

interface AmpLpState{
  state: {
    addr?: string
  }
}
interface AmpLpStateResponse{
  total_lp: string,
  total_amp_lp: string,
  exchange_rate: Rate,

  pair_contract: String,
  locked_assets: any[],
  user_info: any,
}
interface AmpLpStateWasmQuery {
  state: WasmQuery<AmpLpState,AmpLpStateResponse>;
}

export async function getAmpLPExchangeRate(
  queryClient: QueryClient,
  lsd: LSDContracts,
  oracle: HumanAddr,
){
	if(!lsd.info.amp_lp){
		throw "Expected a amp_lp like collateral token here"
	}// We need 
    const [wrapperInfoResponse, ampLpState] = await Promise.all([
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

      wasmFetch<AmpLpStateWasmQuery>({
        ...queryClient,
        id: `amp-lp--state=${lsd.token}`,
        wasmQuery: {
          state: {
            contractAddress: lsd.info.amp_lp.hub,
            query: {
              state: {},
            },
          },
        },
      }),
    ]);
    return {
        hubState: {
          exchange_rate: 
          (
            parseFloat(ampLpState.state.exchange_rate)
              /
            parseFloat(wrapperInfoResponse.tokenInfo.expected_exchange_rate)
          ).toString() as Rate<string>
      }
    }
}