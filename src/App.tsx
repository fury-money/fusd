import React from 'react';
import { DeploymentSwitch } from 'components/layouts/DeploymentSwitch';
import { TerraApp } from 'apps/TerraApp';
import { DeploymentTargetProvider } from '@anchor-protocol/app-provider/contexts/target';
import CssBaseline from '@mui/material/CssBaseline';
import { WalletControllerOptions, WalletControllerChainOptions, NetworkInfo } from '@terra-money/wallet-provider'
import {useState, useEffect} from "react";

export function useChainOptions(): WalletControllerChainOptions | null {
  const [chainOptions, setChainOptions] =
    useState<WalletControllerChainOptions | null>(null);

  useEffect(() => {
    getChainOptions().then(setChainOptions);
  }, []);

  return chainOptions;
}

const FALLBACK_MAINNET = {
  name: 'mainnet',
  chainID: 'phoenix-1',
  lcd: 'https://phoenix-lcd.terra.dev',
  walletconnectID: 1
};

const FALLBACK: WalletControllerChainOptions = {
  defaultNetwork: FALLBACK_MAINNET,
  walletConnectChainIds: {
    1: FALLBACK_MAINNET,
    0: {
      name: 'testnet',
      chainID: 'pisco-1',
      lcd: 'https://pisco-lcd.terra.dev',
      walletconnectID: 1
    },
    2: {
      name: 'classic',
      chainID: 'columbus-5',
      lcd: 'https://columbus-lcd.terra.dev',
      walletconnectID: 1
    },
  },
};

let cache: WalletControllerChainOptions;
export async function getChainOptions(): Promise<WalletControllerChainOptions> {
  return fetch('https://assets.terra.dev/chains.json')
    .then((res) => res.json())
    .then((data: Record<string, NetworkInfo>) => {
      const chains = Object.values(data);
      const walletConnectChainIds = chains.reduce((result, network) => {
        if (typeof network.walletconnectID === 'number') {
          result[network.walletconnectID] = network;
        } else if (!result[1] && network.name === 'mainnet') {
          result[1] = network;
        } else if (!result[0] && network.name === 'testnet') {
          result[0] = network;
        } else if (!result[2] && network.name === 'classic') {
          result[2] = network;
        }
        return result;
      }, {} as Record<number, NetworkInfo>);
      const chainOptions: WalletControllerChainOptions = {
        defaultNetwork: walletConnectChainIds[1],
        walletConnectChainIds,
      };
      cache = chainOptions;
      return chainOptions;
    })
    .catch((error) => {
      console.error('Failed to fetch chains.json', error);
      return cache ?? FALLBACK;
    });
}


export function App() {
  const chainOptions = useChainOptions();

  return (
    <DeploymentTargetProvider>
      <CssBaseline />
      <DeploymentSwitch
        terra={<TerraApp chainOptions={chainOptions} />}
      />
    </DeploymentTargetProvider>
  );
}
