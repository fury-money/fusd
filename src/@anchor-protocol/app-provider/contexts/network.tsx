import { LCDClient, LCDClientConfig } from '@terra-money/feather.js';
import { createContext, useContext } from 'react';

export type CavernNetworkInfo = LCDClientConfig & { name: string, chainName: string };


export const TESTNET: CavernNetworkInfo = {
  name: "testnet",
  chainID: 'pisco-1',
  lcd: 'https://pisco-lcd.erisprotocol.com/',
  prefix: "terra",
  gasAdjustment: 1.6,
  gasPrices: "0.015uluna",
  chainName: "terra2",
};

export const CLASSIC: CavernNetworkInfo = {
  name: "classic",
  chainID: 'columbus-5',
  lcd: 'https://columbus-lcd.terra.dev',
  prefix: "terra",
  gasAdjustment: 1.6,
  gasPrices: "0.015uluna",
  chainName: "terra",
};

export const MAINNET: CavernNetworkInfo = {
  name: "mainnet",
  chainID: 'furya-1',
  lcd: 'https://api.furya.xyz/',
  prefix: "furya",
  gasAdjustment: 1.6,
  gasPrices: "28.325ufury",
  chainName: "furya",
};

const LCDClients: Record<string, LCDClient> = {
  testnet: new LCDClient({
    testnet: TESTNET,
  }),
  mainnet: new LCDClient({
    mainnet: MAINNET,
  }),
  classic: new LCDClient({
    classic: CLASSIC,
  }),
}

const RPCClients: Record<string, string> = {
  testnet: "https://pisco-rpc.erisprotocol.com/",
  mainnet: `https://rpc.furya.xyz/`,
}

export const NetworkContext = createContext<CavernNetworkInfo>(MAINNET);

type UseNetworkReturn = {
  network: CavernNetworkInfo;
  lcdClient: LCDClient;
  rpcClient: string;
};

const useNetwork = (): UseNetworkReturn => {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error('The NetworkContext has not been defined.');
  }
  return {
    network: context,
    lcdClient: LCDClients[context.name ?? 'mainnet'],
    rpcClient: RPCClients[context.name ?? 'mainnet'],
  };
};

export { useNetwork };
