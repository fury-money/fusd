import { LCDClient } from '@terra-money/terra.js';
import { NetworkInfo } from '@terra-money/wallet-provider';
import { createContext, useContext } from 'react';

export const TESTNET: NetworkInfo = {
  name: 'testnet',
  chainID: 'pisco-1',
  lcd: 'https://pisco-lcd.terra.dev',
  walletconnectID: 0,
};

export const CLASSIC: NetworkInfo = {
  name: 'classic',
  chainID: 'columbus-5',
  lcd: 'https://columbus-lcd.terra.dev',
  walletconnectID: 0,
};

export const MAINNET: NetworkInfo = {
  name: 'mainnet',
  chainID: 'phoenix-1',
  lcd: 'https://phoenix-lcd.terra.dev',
  walletconnectID: 0,
};

const LCDClients: Record<string, LCDClient> = {
  testnet: new LCDClient({
    chainID: TESTNET.chainID,
    URL: TESTNET.lcd,
  }),
  classic: new LCDClient({
    chainID: CLASSIC.chainID,
    URL: CLASSIC.lcd,
  }),
  mainnet: new LCDClient({
    chainID: MAINNET.chainID,
    URL: MAINNET.lcd,
  }),
};

export const NetworkContext = createContext<NetworkInfo>(TESTNET);

type UseNetworkReturn = {
  network: NetworkInfo;
  lcdClient: LCDClient;
};

const useNetwork = (): UseNetworkReturn => {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error('The NetworkContext has not been defined.');
  }
  return {
    network: context,
    lcdClient: LCDClients[context.name ?? 'mainnet'],
  };
};

export { useNetwork };
