import React, { useState } from 'react';
import { DeploymentSwitch } from 'components/layouts/DeploymentSwitch';
import { TerraApp } from 'apps/TerraApp';
import { DeploymentTargetProvider } from '@anchor-protocol/app-provider/contexts/target';
import CssBaseline from '@mui/material/CssBaseline';
import AddressViewerWallet, { EventTypes } from 'wallets/viewer';
import { useReadonlyWalletDialog } from 'components/dialogs/useReadonlyWalletDialog';
import { CLASSIC, MAINNET, TESTNET } from '@anchor-protocol/app-provider';
import { ThemeProvider } from 'contexts/theme';
import { lightTheme, darkTheme } from 'themes/terra';

export function App({ viewer_wallet }: { viewer_wallet: AddressViewerWallet }): React.JSX.Element {

  // We can do something about the viewer_wallet
  const [openDialog, dialog] = useReadonlyWalletDialog();

  viewer_wallet.addListener(EventTypes.Connect, () => {
    openDialog({
      networks: [MAINNET, TESTNET, CLASSIC]
    }).then((result) => {
      if (result) {
        viewer_wallet.close(result.address)
      } else {
        viewer_wallet.close(undefined)
      }
    })
  })

  return (
    <DeploymentTargetProvider>
      <ThemeProvider
        initialTheme="dark"
        lightTheme={lightTheme}
        darkTheme={darkTheme}
      >
        <CssBaseline />
        <DeploymentSwitch
          terra={<TerraApp />}
        />
        {dialog}
      </ThemeProvider>
    </DeploymentTargetProvider>
  );
}
