import React from 'react';
import { InfoResponse, WalletResponse } from "@terra-money/wallet-kit";
import { Oval } from 'react-loader-spinner';
export type EMPTY = Record<string, never>;

export type NetworkInfo = InfoResponse[string] & { name: string };

export enum ConnectType {
  READONLY = "readonly",
  WALLET_KIT = "wallet_kit",
  COSMOS_KIT = "cosmos_kit",
}

export type Connection = WalletResponse["availableWallets"][number] & {
  type: ConnectType
};


export function CircleSpinner({ color, size }: { color: string, size: number } = { color: "#4fa94d", size: 80 }) {
  return (
    <Oval
      height={size}
      width={size}
      color={color}
      wrapperStyle={{}}
      wrapperClass=""
      visible={true}
      ariaLabel='oval-loading'
      secondaryColor="#4fa94d"
      strokeWidth={8}
      strokeWidthSecondary={8}
    />
  )
}