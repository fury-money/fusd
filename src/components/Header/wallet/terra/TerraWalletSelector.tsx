import React, { useCallback, useState } from 'react';
import { useAccount } from 'contexts/account';
import { ConnectionList } from './ConnectionList';
import { WalletSelector } from '../../desktop/WalletSelector';
import { Content } from './Content';
import { useSendDialog } from 'pages/send/useSendDialog';
import {
  DropdownContainer,
  DropdownBox,
} from 'components/Header/desktop/DropdownContainer';
import { useBuyUstDialog } from 'pages/earn/components/useBuyUstDialog';
import { WalletStatus, useWallet } from '@terra-money/wallet-kit';
import { useVestingClaimNotification } from 'components/Header/vesting/VestingClaimNotification';

const TerraWalletSelector = (): React.JSX.Element => {
  const { terraWalletAddress, status, connection } = useAccount();

  const { connect, disconnect, availableWallets } =
    useWallet();

  const availableConnectTypes = availableWallets.filter(({ isInstalled }) => isInstalled);

  const [open, setOpen] = useState(false);

  const [vestingClaimNotificationElement] = useVestingClaimNotification();

  const [openSendDialog, sendDialogElement] = useSendDialog();

  const [openBuyUstDialog, buyUstDialogElement] = useBuyUstDialog();

  const connectWallet = useCallback(() => {
    if (availableConnectTypes.length > 1) {
      setOpen(true);
    } else if (availableConnectTypes.length === 1) {
      connect(availableConnectTypes[0].id);
    }
  }, [availableConnectTypes, connect]);

  const disconnectWallet = useCallback(() => {
    disconnect();
    setOpen(false);
  }, [disconnect]);

  const onClose = useCallback(() => {
    setOpen(false);
  }, []);

  return (
    <WalletSelector
      walletAddress={terraWalletAddress}
      initializing={status === WalletStatus.INITIALIZING}
      onClick={connectWallet}
      onClose={onClose}
    >
      <>
        {vestingClaimNotificationElement}
        {open && (
          <DropdownContainer>
            <DropdownBox>
              {!terraWalletAddress || !connection ? (
                <ConnectionList setOpen={setOpen} />
              ) : (
                <Content
                  walletAddress={terraWalletAddress}
                  connection={connection}
                  onClose={onClose}
                  onDisconnectWallet={disconnectWallet}
                  onSend={() => {
                    openSendDialog({});
                    onClose();
                  }}
                  onBuyUST={() => {
                    openBuyUstDialog({});
                    onClose();
                  }}
                />
              )}
            </DropdownBox>
          </DropdownContainer>
        )}

        {sendDialogElement}
        {buyUstDialogElement}
      </>
    </WalletSelector>
  );
};

export { TerraWalletSelector };
