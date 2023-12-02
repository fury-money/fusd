import React, { Dispatch, SetStateAction } from 'react';
import { BorderButton } from '@libs/neumorphism-ui/components/BorderButton';
import { FlatButton } from '@libs/neumorphism-ui/components/FlatButton';
import { IconSpan } from '@libs/neumorphism-ui/components/IconSpan';
import { Tooltip } from '@libs/neumorphism-ui/components/Tooltip';
import { ConnectionTypeList } from '../../desktop/ConnectionTypeList';
import { TermsMessage } from '../../desktop/TermsMessage';
import { ConnectType } from 'utils/consts';
import { useAccount } from 'contexts/account';
import { Button } from '@mui/material';
import { useChain } from '@cosmos-kit/react';
import { useNetwork } from '@anchor-protocol/app-provider';
import { ADDRESS_VIEWER_ID } from 'wallets/viewer';


interface FooterProps {
  includesReadonly: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

const Footer = (props: FooterProps) => {
  const { setOpen, includesReadonly } = props;
  const { connect } = useAccount();
  return (
    <>
      {includesReadonly && (
        <Tooltip
          title="Read-only mode for viewing information. Please connect through Terra Station (extension or mobile) to make transactions."
          placement="bottom"
        >
          <BorderButton
            className="readonly"
            onClick={() => {
              connect(ADDRESS_VIEWER_ID);
              setOpen(false);
            }}
          >
            View an address
          </BorderButton>
        </Tooltip>
      )}
      <TermsMessage />
    </>
  );
};

interface ConnectionListProps {
  setOpen: Dispatch<SetStateAction<boolean>>;
}

const ConnectionList = (props: ConnectionListProps): React.JSX.Element => {
  const { setOpen } = props;
  const {
    connect,
    availableWallets,
  } = useAccount();

  const { network } = useNetwork();

  const { openView } = useChain(network.chainName);

  return (
    <ConnectionTypeList
      footer={
        <Footer
          setOpen={setOpen}
          includesReadonly={true}

        // {availableConnectTypes.includes(
        //   ConnectType.READONLY,
        // )}
        />
      }
    >
      {availableWallets
        .filter(({ isInstalled }) => isInstalled)
        .filter(({ id }) => {
          return id != ADDRESS_VIEWER_ID
        })
        .map(({ id, icon, name }) => (
          <FlatButton
            key={'connection' + id}
            className="connect"
            onClick={() => {
              connect(id);
              setOpen(false);
            }}
          >
            <IconSpan>
              {name}
              <img
                src={
                  icon ===
                    'https://assets.terra.dev/icon/station-extension/icon.png'
                    ? 'https://assets.terra.dev/icon/wallet-provider/station.svg'
                    : icon
                }
                alt={name}
              />
            </IconSpan>
          </FlatButton>
        ))}

      {availableWallets
        .filter(({ isInstalled, website }) => !isInstalled && website)
        .map(({ name, icon, website }) => (
          <BorderButton
            key={'installation' + name}
            className="install"
            component="a"
            href={website}
            target="_blank"
            rel="noreferrer"
            onClick={() => {
              setOpen(false);
            }}
          >
            <IconSpan>
              Install {name}
              <img src={icon} alt={`Install ${name}`} />
            </IconSpan>
          </BorderButton>
        ))}

      <BorderButton
        className="connect" type="button" onClick={openView}>
        Other Wallets
      </BorderButton>
    </ConnectionTypeList>
  );
};

export { ConnectionList };
