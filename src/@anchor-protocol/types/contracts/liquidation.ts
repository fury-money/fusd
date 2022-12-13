import {
  UST,
  CW20Addr,
  HumanAddr,
  NativeDenom,
  Num,
  Rate,
  u,
} from '@libs/types';
import { bLuna } from '../currencies';

export namespace liquidation {
  export namespace liquidationContract {
    /**
     * @see https://anchor-protocol.gitbook.io/anchor-2/smart-contracts/liquidations/liquidation-contract#bid
     */
    export interface Bid {
      collateral_token: HumanAddr;
      bidder: HumanAddr;
    }

    /**
     * @see https://anchor-protocol.gitbook.io/anchor-2/smart-contracts/liquidations/liquidation-contract#bidresponse
     */
    export interface BidResponse {
      collateral_token: HumanAddr;
      bidder: HumanAddr;
      amount: u<UST>;
      premium_rate: Rate;
    }

    /**
     * @see https://anchor-protocol.gitbook.io/anchor-2/smart-contracts/liquidations/liquidation-contract#bidsbycollateral
     */
    export interface BidsByCollateral {
      bids_by_collateral: {
        collateral_token: HumanAddr;
        start_after?: HumanAddr;
        limit?: number;
      };
    }

    /**
     * @see https://anchor-protocol.gitbook.io/anchor-2/smart-contracts/liquidations/liquidation-contract#bidsbycollateralresponse
     */
    export interface BidsByCollateralResponse {
      bids: Array<BidResponse>;
    }

    /**
     * @see https://anchor-protocol.gitbook.io/anchor-2/smart-contracts/liquidations/liquidation-contract#bidsbyuser
     */
    export interface BidsByUser {
      bids_by_user: {
        bidder: HumanAddr;
        start_after?: HumanAddr;
        limit?: number;
      };
    }

    /**
     * @see https://anchor-protocol.gitbook.io/anchor-2/smart-contracts/liquidations/liquidation-contract#bidsbyuserresponse
     */
    export interface BidsByUserResponse {
      bids: Array<BidResponse>;
    }

    /**
     * @see https://anchor-protocol.gitbook.io/anchor-2/smart-contracts/liquidations/liquidation-contract#config-1
     */
    export interface Config {
      config: {};
    }

    /**
     * @see https://anchor-protocol.gitbook.io/anchor-2/smart-contracts/liquidations/liquidation-contract#configresponse
     */
    export interface ConfigResponse {
      owner: HumanAddr;
      oracle_contract: HumanAddr;
      stable_denom: NativeDenom;
      safe_ratio: Rate;
      bid_fee: Rate;
      max_premium_rate: Rate;
      liquidation_threshold: Num;
      price_timeframe: number;
    }

    /**
     * @see https://anchor-protocol.gitbook.io/anchor-2/smart-contracts/liquidations/liquidation-contract#liquidationamount
     */
    export interface LiquidationAmount {
      liquidation_amount: {
        borrow_amount: u<UST>;
        borrow_limit: u<UST>;
        collaterals: [
          [CW20Addr, u<UST>], // (Cw20 contract address, Locked amount)
          [CW20Addr, u<UST>],
        ];
        collateral_prices: [
          u<UST>, // Price of collateral
          u<UST>,
        ];
      };
    }

    /**
     * @see https://anchor-protocol.gitbook.io/anchor-2/smart-contracts/liquidations/liquidation-contract#liquidationamountresponse
     */
    export interface LiquidationAmountResponse {
      collaterals: Array<[CW20Addr, u<UST>]>;
    }
  }
  export namespace liquidationQueueContract {
    /**
     * @see https://docs.cavernprotocol.com/smart-contracts/liquidations/liquidation-queue-contract#whitelistcollateral
     */
    export interface WhitelistCollateral {
      whitelist_collateral: {
        collateral_token: CW20Addr;
        bid_threshold: u<UST>;
        max_slot: number;
        premium_rate_per_slot: Rate;
      };
    }
    /**
     * @see https://docs.cavernprotocol.com/anchor-2/smart-contracts/liquidations/liquidation-queue-contract#bid
     */
    export interface Bid {
      bid: {
        bid_idx: number;
      };
    }

    /**
     * @see https://docs.cavernprotocol.com/anchor-2/smart-contracts/liquidations/liquidation-queue-contract#bidresponse
     */
    export interface BidResponse {
      collateral_token: HumanAddr;
      bidder: HumanAddr;
      amount: u<UST>;
      premium_rate: Rate;
      idx: string;
      premium_slot: number;
      product_snapshot: string;
      sum_snapshot: string;
      pending_liquidated_collateral: u<bLuna>;
      wait_end?: number;
      epoch_snapshot: string;
      scale_snapshot: string;
    }

    /**
     * @see https://docs.cavernprotocol.com/anchor-2/smart-contracts/liquidations/liquidation-queue-contract#bidpool
     */
    export interface BidPool {
      bid_pool: {
        collateral_token: String;
        bid_slot: number;
      };
    }

    /**
     * @see https://docs.cavernprotocol.com/anchor-2/smart-contracts/liquidations/liquidation-queue-contract#bidpoolresponse
     */
    export interface BidPoolResponse {
      sum_snapshot: string;
      product_snapshot: string;
      total_bid_amount: string;
      premium_rate: string;
      current_epoch: string;
      current_scale: string;
    }

    /**
     * @see https://docs.cavernprotocol.com/anchor-2/smart-contracts/liquidations/liquidation-queue-contract#bidpoolsbycollateral
     */
    export interface BidPoolsByCollateral {
      bid_pools_by_collateral: {
        collateral_token: CW20Addr;
        start_after?: HumanAddr;
        limit?: number;
      };
    }

    export interface BidsPoolsByCollateralResponse {
      bid_pools: Array<BidPoolResponse>;
    }

    /**
     * @see https://docs.cavernprotocol.com/anchor-2/smart-contracts/liquidations/liquidation-queue-contract#bidsbyuser
     */
    export interface BidsByUser {
      bids_by_user: {
        collateral_token: CW20Addr;
        bidder?: HumanAddr;
        start_after?: HumanAddr;
        limit?: number;
      };
    }

    /**
     * @see https://docs.cavernprotocol.com/anchor-2/smart-contracts/liquidations/liquidation-queue-contract#bidsbyuserresponse
     */
    export interface BidsByUserResponse {
      bids: Array<BidResponse>;
    }
  }
}
