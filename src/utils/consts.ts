import { InfoResponse, WalletResponse } from "@terra-money/wallet-kit";

export type EMPTY = Record<string, never>;

export type NetworkInfo = InfoResponse[string] & {name: string};

export enum ConnectType {
    READONLY = "readonly",
    WALLET_KIT = "wallet_kit",
  }
  
export type Connection = WalletResponse["availableWallets"][number] & {
  type: ConnectType
};