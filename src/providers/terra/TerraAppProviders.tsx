import React from 'react';
import { UIElementProps } from '@libs/ui';
import { AppProviders } from 'configurations/app';
import { TerraAccountProvider } from './TerraAccountProvider';
import { TerraBalancesProvider } from './TerraBalancesProvider';
import { TerraNetworkProvider } from './TerraNetworkProvider';
import { QueryProvider } from 'providers/QueryProvider';
import { TerraNetworkGuard } from './TerraNetworkGaurd';

export function TerraAppProviders({
  children,
}: UIElementProps) {

  return (
    <TerraNetworkProvider>
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
    </TerraNetworkProvider>
  );
}
