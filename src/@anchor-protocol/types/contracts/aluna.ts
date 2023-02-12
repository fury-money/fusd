import { DateTime, HumanAddr, Luna, Num, Rate, Token, u } from "@libs/types";
import { aLuna } from "../currencies";

export namespace aluna {
  export namespace airdropRegistry {
    /**
     * @see https://anchor-protocol.gitbook.io/anchor-2/smart-contracts/aluna/airdrop-registry#airdropinfo
     */
    export interface AirdropInfo {
      airdrop_info: {
        airdrop_token?: string;
        start_after?: string;
        limit?: number;
      };
    }

    /**
     * @see https://anchor-protocol.gitbook.io/anchor-2/smart-contracts/aluna/airdrop-registry#airdropinforesponse
     */
    export interface AirdropInfoResponse {
      airdrop_info: Array<{
        airdrop_token: string;
        info: {
          airdrop_token_contract: HumanAddr;
          airdrop_contract: HumanAddr;
          airdrop_swap_contract: HumanAddr;
          swap_belief_price?: Rate;
          swap_max_spread?: Rate;
        };
      }>;
    }

    export interface IsClaimed {
      is_claimed: {
        stage: number;
        address: HumanAddr;
      };
    }

    export interface IsClaimedResponse {
      is_claimed: boolean;
    }

    /**
     * @see https://anchor-protocol.gitbook.io/anchor-2/smart-contracts/aluna/airdrop-registry#config-1
     */
    export interface Config {
      config: {};
    }

    /**
     * @see https://anchor-protocol.gitbook.io/anchor-2/smart-contracts/aluna/airdrop-registry#configresponse
     */
    export interface ConfigResponse {
      owner: HumanAddr;
      hub_contract: HumanAddr;
      reward_contract: HumanAddr;
      airdrop_tokens: Array<string>;
    }
  }

  export namespace hub {
    /**
     * @see https://anchor-protocol.gitbook.io/anchor-2/smart-contracts/aluna/hub-1#allhistory
     */
    export interface AllHistory {
      all_history: {
        start_from?: number;
        limit?: number;
      };
    }

    /**
     * @see https://anchor-protocol.gitbook.io/anchor-2/smart-contracts/aluna/hub-1#allhistoryresponse
     */
    export interface AllHistoryResponse {
      history: Array<{
        batch_id: number;
        time: DateTime;
        amount: u<aLuna>;
        applied_exchange_rate: Rate;
        withdraw_rate: Rate;
        released: boolean;
      }>;
    }

    /**
     * @see https://anchor-protocol.gitbook.io/anchor-2/smart-contracts/aluna/hub-1#config-1
     */
    export interface Config {
      config: {};
    }

    /**
     * @see https://anchor-protocol.gitbook.io/anchor-2/smart-contracts/aluna/hub-1#configresponse
     */
    export interface ConfigResponse {
      owner: HumanAddr;
      reward_contract?: HumanAddr;
      token_contract?: HumanAddr;
      airdrop_registry_contract?: HumanAddr;
    }

    /**
     * @see https://anchor-protocol.gitbook.io/anchor-2/smart-contracts/aluna/hub-1#currentbatch
     */
    export interface CurrentBatch {
      current_batch: {};
    }

    /**
     * @see https://anchor-protocol.gitbook.io/anchor-2/smart-contracts/aluna/hub-1#currentbatchresponse
     */
    export interface CurrentBatchResponse {
      id: number;
      requested_with_fee: u<aLuna>;
    }

    /**
     * @see https://anchor-protocol.gitbook.io/anchor-2/smart-contracts/aluna/hub-1#parameters-1
     */
    export interface Parameters {
      parameters: {};
    }

    /**
     * @see https://anchor-protocol.gitbook.io/anchor-2/smart-contracts/aluna/hub-1#parametersresponse
     */
    export interface ParametersResponse {
      epoch_period: number;
      underlying_coin_denom: string;
      unbonding_period: number;
      peg_recovery_fee: Rate;
      er_threshold: Rate;
      reward_denom: string;
    }

    /**
     * @see https://anchor-protocol.gitbook.io/anchor-2/smart-contracts/aluna/hub-1#state
     */
    export interface State {
      state: {};
    }

    /**
     * @see https://anchor-protocol.gitbook.io/anchor-2/smart-contracts/aluna/hub-1#stateresponse
     */
    export interface StateResponse {
      exchange_rate: Rate;
      total_bond_amount: u<Luna>;
      last_index_modification: DateTime;
      prev_hub_balance: u<Luna>;
      actual_unbonded_amount: u<Luna>;
      last_unbonded_time: DateTime;
      last_processed_batch: number;
    }

    /**
     * @see https://anchor-protocol.gitbook.io/anchor-2/smart-contracts/aluna/hub-1#unbondrequests
     */
    export interface UnbondRequests {
      unbond_requests: {
        address: HumanAddr;
      };
    }

    /**
     * @see https://anchor-protocol.gitbook.io/anchor-2/smart-contracts/aluna/hub-1#unbondrequestsresponse
     */
    export interface UnbondRequestsResponse {
      address: HumanAddr;
      requests: Array<[number, u<aLuna>]>;
    }

    /**
     * @see https://anchor-protocol.gitbook.io/anchor-2/smart-contracts/aluna/hub-1#whitelistedvalidators
     */
    export interface WhitelistedValidators {
      whitelisted_validators: {};
    }

    /**
     * @see https://anchor-protocol.gitbook.io/anchor-2/smart-contracts/aluna/hub-1#whitelistedvalidatorsresponse
     */
    export interface WhitelistedValidatorsResponse {
      validators: HumanAddr[];
    }

    /**
     * @see https://anchor-protocol.gitbook.io/anchor-2/smart-contracts/aluna/hub-1#withdrawableunbonded
     */
    export interface WithdrawableUnbonded {
      withdrawable_unbonded: {
        address: HumanAddr;
        block_time: number;
      };
    }

    /**
     * @see https://anchor-protocol.gitbook.io/anchor-2/smart-contracts/aluna/hub-1#withdrawableunbondedresponse
     */
    export interface WithdrawableUnbondedResponse {
      withdrawable: u<Luna>;
    }
  }

  export namespace reward {
    /**
     * @see https://anchor-protocol.gitbook.io/anchor-2/smart-contracts/aluna/reward#accruedrewards
     */
    export interface AccruedRewards {
      accrued_rewards: {
        address: HumanAddr;
      };
    }

    /**
     * @see https://anchor-protocol.gitbook.io/anchor-2/smart-contracts/aluna/reward#accruedrewardsresponse
     */
    export interface AccruedRewardsResponse {
      amount: u<Token>; // depends on reward_denom of ConfigResponse
    }

    /**
     * @see https://anchor-protocol.gitbook.io/anchor-2/smart-contracts/aluna/reward#config-1
     */
    export interface Config {
      config: {};
    }

    /**
     * @see https://anchor-protocol.gitbook.io/anchor-2/smart-contracts/aluna/reward#configresponse
     */
    export interface ConfigResponse {
      hub_contract: HumanAddr;
      reward_denom: string;
    }

    /**
     * @see https://anchor-protocol.gitbook.io/anchor-2/smart-contracts/aluna/reward#holder
     */
    export interface Holder {
      holder: {
        address: HumanAddr;
      };
    }

    /**
     * @see https://anchor-protocol.gitbook.io/anchor-2/smart-contracts/aluna/reward#holderresponse
     */
    export interface HolderResponse {
      address: HumanAddr;
      balance: u<aLuna>;
      index: Num;
      pending_rewards: u<Token>; // depends on reward_denom of ConfigResponse
    }

    /**
     * @see https://anchor-protocol.gitbook.io/anchor-2/smart-contracts/aluna/reward#holders
     */
    export interface Holders {
      holders: {
        start_after: HumanAddr;
        limit?: number;
      };
    }

    /**
     * @see https://anchor-protocol.gitbook.io/anchor-2/smart-contracts/aluna/reward#holdersresponse
     */
    export interface HoldersResponse {
      holders: Array<HolderResponse>;
    }

    /**
     * @see https://anchor-protocol.gitbook.io/anchor-2/smart-contracts/aluna/reward#state
     */
    export interface State {
      state: {};
    }

    /**
     * @see https://anchor-protocol.gitbook.io/anchor-2/smart-contracts/aluna/reward#stateresponse
     */
    export interface StateResponse {
      global_index: Num;
      total_balance: u<aLuna>;
    }
  }
}
