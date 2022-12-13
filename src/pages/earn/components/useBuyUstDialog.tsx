import { Modal } from '@mui/material';
import { Launch } from '@mui/icons-material';
import { Dialog } from '@libs/neumorphism-ui/components/Dialog';
import { EmbossButton } from '@libs/neumorphism-ui/components/EmbossButton';
import { DialogProps, OpenDialog, useDialog } from '@libs/use-dialog';
import React, { ReactNode } from 'react';
import styled from 'styled-components';

import kado from './assets/kado.svg';

import { dialogStyle } from './useInsuranceCoverageDialog';

interface FormParams {
  className?: string;
}

type FormReturn = void;

export function useBuyUstDialog(): [
  OpenDialog<FormParams, FormReturn>,
  ReactNode,
] {
  return useDialog(Component);
}

function ComponentBase({
  className,
  closeDialog,
}: DialogProps<FormParams, FormReturn>) {
  return (
    <Modal open onClose={() => closeDialog()}>
      <Dialog className={className} onClose={() => closeDialog()}>
        <h1>Buy axlUSDC</h1>

        <section>
          <h2>With Fiat</h2>

          <EmbossButton
            component="a"
            href="https://ramp.kado.money"
            target="_blank"
            rel="noreferrer"
          >
            <span>
              Kado Ramp{' '}
              <sub>
                <Launch />
              </sub>
            </span>
            <i>
              <img src={kado} alt="Kado Ramp" />
            </i>
          </EmbossButton>
        </section>
      </Dialog>
    </Modal>
  );
}

const Component = styled(ComponentBase)`
  width: 458px;

  ${dialogStyle};

  section {
    i {
      img {
        max-width: 32px;
      }
    }
  }
`;
