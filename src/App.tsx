import React from 'react';
import { DeploymentSwitch } from 'components/layouts/DeploymentSwitch';
import { TerraApp } from 'apps/TerraApp';
import { DeploymentTargetProvider } from '@anchor-protocol/app-provider/contexts/target';
import CssBaseline from '@mui/material/CssBaseline';

export function App(): React.JSX.Element {

  return (
    <DeploymentTargetProvider>
      <CssBaseline />
      <DeploymentSwitch
        terra={<TerraApp />}
      />
    </DeploymentTargetProvider>
  );
}
