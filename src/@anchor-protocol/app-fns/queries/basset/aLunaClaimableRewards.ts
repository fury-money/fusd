import { aluna, HumanAddr } from "@anchor-protocol/types";
import {
  QueryClient,
  wasmFetch,
  WasmQuery,
  WasmQueryData,
} from "@libs/query-client";

interface BLunaClaimableRewardsWasmQuery {
  rewardState: WasmQuery<aluna.reward.State, aluna.reward.StateResponse>;
  claimableReward: WasmQuery<aluna.reward.Holder, aluna.reward.HolderResponse>;
}

export type BLunaClaimableRewards =
  WasmQueryData<BLunaClaimableRewardsWasmQuery>;

export async function aLunaClaimableRewardsQuery(
  queryClient: QueryClient,
  walletAddr: HumanAddr | undefined,
  bAssetRewardContract: HumanAddr
): Promise<BLunaClaimableRewards | undefined> {
  if (!walletAddr) {
    return undefined;
  }

  return wasmFetch<BLunaClaimableRewardsWasmQuery>({
    ...queryClient,
    id: `bond--claimable-rewards`,
    wasmQuery: {
      rewardState: {
        contractAddress: bAssetRewardContract,
        query: {
          state: {},
        },
      },
      claimableReward: {
        contractAddress: bAssetRewardContract,
        query: {
          holder: {
            address: walletAddr,
          },
        },
      },
    },
  });
}
