import React from 'react';
import { UIElementProps } from '@libs/ui';
import { AppProviders } from 'configurations/app';
import { TerraAccountProvider } from './TerraAccountProvider';
import { TerraBalancesProvider } from './TerraBalancesProvider';
import { TerraNetworkProvider } from './TerraNetworkProvider';
import { QueryProvider } from 'providers/QueryProvider';
import { TerraNetworkGuard } from './TerraNetworkGaurd';

import { ChainProvider } from '@cosmos-kit/react';
import { chains, assets } from 'chain-registry';
import { wallets } from '@cosmos-kit/keplr';
import { Chain } from '@chain-registry/types';
import { GasPrice } from '@cosmjs/stargate';
import { wallets as leapwallets } from "@cosmos-kit/leap";
import { wallets as xdefi } from "@cosmos-kit/xdefi";
import { wallets as cosmos_extension_mm } from "@cosmos-kit/cosmos-extension-metamask";

// Import this in your top-level route/layout
import "@interchain-ui/react/styles";
import { MAINNET, useNetwork } from '@anchor-protocol/app-provider';

export function TerraAppProviders({
  children,
}: UIElementProps) {
  const { network, rpcClient } = useNetwork();

  const signerOptions = {
    signingCosmwasm: (chain: Chain) => {
      switch (chain.chain_name) {
        case MAINNET.chainName:
          return {
            gasPrice: GasPrice.fromString(MAINNET.gasPrices.toString())
          };
      }
    }
  }
  console.log(rpcClient);
  const endpointOptions = {
    endpoints: {
      [MAINNET.chainName]: {
        rpc: [rpcClient]
      }
    }
  }
  return (
    <TerraNetworkProvider>
      <ChainProvider
        chains={chains} // supported chains
        assetLists={assets} // supported asset lists
        wallets={[
          ...wallets,
          ...leapwallets,
          ...xdefi,
          ...cosmos_extension_mm
        ]} // supported wallets
        walletConnectOptions={{
          signClient: {
            projectId: "a73d1cf4de48cf85ee48887c1886d5c0"
          }
        }} // required if `wallets` contains mobile wallets
        signerOptions={signerOptions}
        endpointOptions={endpointOptions}
      >
        <TerraNetworkGuard>
          <QueryProvider>
            <TerraAccountProvider>
              <AppProviders>
                <TerraBalancesProvider>
                  {children}
                </TerraBalancesProvider>
              </AppProviders>
            </TerraAccountProvider>
          </QueryProvider>
        </TerraNetworkGuard>
      </ChainProvider>
    </TerraNetworkProvider>
  );
}