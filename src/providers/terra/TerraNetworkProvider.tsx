import React from 'react';
import { UIElementProps } from '@libs/ui';
import { MAINNET, NetworkContext } from '@anchor-protocol/app-provider/contexts/network';

const TerraNetworkProvider = ({ children }: UIElementProps) => {

  return (
    <NetworkContext.Provider value={MAINNET}>
      {children}
    </NetworkContext.Provider>
  );
};

export { TerraNetworkProvider };
