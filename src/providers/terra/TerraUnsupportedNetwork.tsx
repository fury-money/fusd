import React from 'react';
import styled from 'styled-components';
import { Modal } from '@mui/material';
import { Dialog } from '@libs/neumorphism-ui/components/Dialog';
import { UIElementProps } from '@libs/ui';

function TerraUnsupportedNetworkBase({ className }: UIElementProps) {
  return (
    <Modal open disableEnforceFocus>
      <Dialog className={className}>
        <h3>You're connected to an unsupported network.</h3>
        <p>Please connect to the Terra Mainnet network and reload.</p>
      </Dialog>
    </Modal>
  );
}

export const TerraUnsupportedNetwork = styled(TerraUnsupportedNetworkBase)`
  font-family: Gotham, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu,
    Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  background-color: ${({ theme }) => theme.backgroundColor};

  text-align: center;

  .title {
    margin: 2rem 0 1rem;
  }
`;
