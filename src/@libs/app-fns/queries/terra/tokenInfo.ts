import { QueryClient } from "@libs/query-client";
import { cw20, terraswap, Token } from "@libs/types";
import { nativeTokenInfoQuery } from "../cw20/nativeTokenInfo";
import { cw20TokenInfoQuery } from "../cw20/tokenInfo";

export async function terraTokenInfoQuery<T extends Token>(
  queryClient: QueryClient,
  asset: terraswap.AssetInfo
): Promise<cw20.TokenInfoResponse<T> | undefined> {
  return "native_token" in asset
    ? nativeTokenInfoQuery<T>(asset.native_token.denom)
    : cw20TokenInfoQuery<T>(queryClient, asset.token.contract_addr).then(
        ({ tokenInfo }) => tokenInfo
      );
}
