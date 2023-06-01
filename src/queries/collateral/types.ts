import { LSDContracts } from "@anchor-protocol/app-provider";
import { CW20Addr, ERC20Addr, moneyMarket } from "@anchor-protocol/types";
import { WasmQuery } from "@libs/query-client";

export interface WhitelistWasmQuery {
  whitelist: WasmQuery<
    moneyMarket.overseer.Whitelist,
    moneyMarket.overseer.WhitelistResponse
  >;
}

export function isWrappedCollateral(
  collateral: WhitelistCollateral
): collateral is WhitelistWrappedCollateral {
  return "info" in collateral;
}

export type IconObject = string | {asset1: string, asset2: string, protocol_icon: string};

export type WhitelistWrappedCollateral =
  moneyMarket.overseer.WhitelistResponse["elems"][0] & {
    icon?: IconObject;
    decimals: number;
    bridgedAddress?: CW20Addr | ERC20Addr;
    protocol?: string | undefined;
    info: LSDContracts;
  };

export type WhitelistNormalCollateral =
  moneyMarket.overseer.WhitelistResponse["elems"][0] & {
    icon?: IconObject;
    decimals: number;
    bridgedAddress?: CW20Addr | ERC20Addr;
  };

export type WhitelistCollateral =
  | WhitelistNormalCollateral
  | WhitelistWrappedCollateral;
