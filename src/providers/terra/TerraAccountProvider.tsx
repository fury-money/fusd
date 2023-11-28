import React, { useMemo } from 'react';
import { UIElementProps } from '@libs/ui';
import {
  useConnectedWallet,
  useWallet,
} from '@terra-money/wallet-kit';
import { AccountContext, Account } from 'contexts/account';
import { WalletStatus } from '@terra-money/wallet-kit';
import { HumanAddr } from '../../@libs/types';
import { MAINNET, useNetwork } from '@anchor-protocol/app-provider';
import { ConnectType } from 'utils/consts';

const TerraAccountProvider = ({ children }: UIElementProps): React.JSX.Element => {
  const wallet = useWallet();
  const connectedWallet = useConnectedWallet();
  const { network } = useNetwork();


  const account = useMemo<Account>(() => {
    return {
      connected: !!connectedWallet as true, // Cast to "true" to fix discriminated union
      nativeWalletAddress: connectedWallet?.addresses[network.chainID] as HumanAddr,
      network: MAINNET,
      status: wallet.status as WalletStatus,
      terraWalletAddress: connectedWallet?.addresses[network.chainID] as HumanAddr,
      readonly: !connectedWallet as false,
      availablePost: !!connectedWallet as true,
      post: wallet.post,
      connection: connectedWallet ? {
        ...wallet.availableWallets.filter(({ name }) => name == connectedWallet?.name)[0],
        type: ConnectType.WALLET_KIT
      } : undefined,

      // TODO : Read-Address
      // readonly:
      //   connectedWallet === undefined ||
      //   connectedWallet.connectType === ConnectType.READONLY,
      // availablePost: !!connectedWallet && connectedWallet.availablePost,
    };
  }, [connectedWallet, network.chainID, wallet.availableWallets, wallet.post, wallet.status]);

  return (
    <AccountContext.Provider value={account}>
      {children}
    </AccountContext.Provider>
  );
};

export { TerraAccountProvider };
