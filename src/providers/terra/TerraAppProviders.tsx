import React from 'react';
import { UIElementProps } from '@libs/ui';
import { useReadonlyWalletDialog } from 'components/dialogs/useReadonlyWalletDialog';
import { AppProviders } from 'configurations/app';
import { TerraAccountProvider } from './TerraAccountProvider';
import { TerraBalancesProvider } from './TerraBalancesProvider';
import { TerraNetworkProvider } from './TerraNetworkProvider';
import { ThemeProvider } from 'contexts/theme';
import { lightTheme, darkTheme } from 'themes/terra';
import { QueryProvider } from 'providers/QueryProvider';
import { TerraNetworkGuard } from './TerraNetworkGaurd';

export function TerraAppProviders({
  children,
}: UIElementProps) {
  const [openReadonlyWalletSelector, readonlyWalletSelectorElement] =
    useReadonlyWalletDialog();

  // TODO : view-address
  // const createReadonlyWalletSession = useCallback(
  //   (networks: NetworkInfo[]): Promise<ReadonlyWalletSession | null> => {
  //     return openReadonlyWalletSelector({
  //       networks,
  //     });
  //   },
  //   [openReadonlyWalletSelector],
  // );

  return (
    <TerraNetworkProvider>
      <ThemeProvider
        initialTheme="dark"
        lightTheme={lightTheme}
        darkTheme={darkTheme}
      >
        <TerraNetworkGuard>
          <QueryProvider>
            <TerraAccountProvider>
              <AppProviders dialogs={readonlyWalletSelectorElement}>
                <TerraBalancesProvider>
                  {children}
                </TerraBalancesProvider>
              </AppProviders>
            </TerraAccountProvider>
          </QueryProvider>
        </TerraNetworkGuard>
      </ThemeProvider>
    </TerraNetworkProvider>
  );
}
