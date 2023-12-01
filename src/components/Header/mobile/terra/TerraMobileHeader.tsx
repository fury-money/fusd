import React, { useCallback, useMemo, useState } from 'react';
import { useAccount } from 'contexts/account';
import { useBuyUstDialog } from 'pages/earn/components/useBuyUstDialog';
import { useSendDialog } from 'pages/send/useSendDialog';
import { useWalletDialog } from './useWalletDialog';
import { useVestingClaimNotification } from 'components/Header/vesting/VestingClaimNotification';
import { ViewAddressButton } from '../ViewAddressButton';
import { MobileHeader } from '../MobileHeader';
import { WalletStatus } from '@terra-money/wallet-kit';
import { ConnectType } from 'utils/consts';

export function TerraMobileHeader() {
  const [open, setOpen] = useState<boolean>(false);
  const { status, connect } = useAccount();
  const [openWalletDialog, walletDialogElement] = useWalletDialog();
  const [openSendDialog, sendDialogElement] = useSendDialog();
  const [openBuyUstDialog, buyUstDialogElement] = useBuyUstDialog();

  const toggleWallet = useCallback(() => {
    if (status === WalletStatus.CONNECTED) {
      openWalletDialog({
        openSend: () => openSendDialog({}),
        openBuyUst: () => openBuyUstDialog({}),
      });
    } else if (status === WalletStatus.NOT_CONNECTED) {
      connect();
    }
  }, [connect, openBuyUstDialog, openSendDialog, openWalletDialog, status]);

  const [vestingClaimNotificationElement] = useVestingClaimNotification();

  const viewAddress = useCallback(() => {
    setOpen(false);

    if (status === WalletStatus.NOT_CONNECTED) {
      connect(ConnectType.READONLY);
    }
  }, [connect, status]);

  const viewAddressButtonElement = useMemo(() => {
    return (
      status === WalletStatus.NOT_CONNECTED && <ViewAddressButton onClick={viewAddress} />
    );
  }, [status, viewAddress]);

  return (
    <>
      <MobileHeader
        open={open}
        setOpen={setOpen}
        isActive={!!walletDialogElement}
        toggleWallet={toggleWallet}
        vestingClaimNotificationElement={vestingClaimNotificationElement}
        viewAddressButtonElement={viewAddressButtonElement}
      />
      {walletDialogElement}
      {sendDialogElement}
      {buyUstDialogElement}
    </>
  );
}
