import { DialogTitle, Modal } from '@mui/material';
import { Dialog } from '@libs/neumorphism-ui/components/Dialog';
import { Dialog as MaterialUIDialog } from '@mui/material';
import { EmbossButton } from '@libs/neumorphism-ui/components/EmbossButton';
import { DialogProps, OpenDialog, useDialog } from '@libs/use-dialog';
import React, { ReactNode } from 'react';
import styled from 'styled-components';

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

  const [openKado, setOpenKado] = React.useState(true);

  const handleClickOpen = () => {
    setOpenKado(true);
  };

  const handleClose = () => {
    setOpenKado(false);
    closeDialog()
  };

  return (
    <Modal open onClose={() => closeDialog()}>
      <KadoDialog
        open={openKado}
        onClose={handleClose}
      />
    </Modal>
  );
}


export interface KadoDialogProps {
  open: boolean;
  onClose: () => void;
}

export function KadoDialog(props: KadoDialogProps) {
  const { onClose, open } = props;

  const handleClose = () => {
    onClose();
  };

  return (
    <MaterialUIDialog onClose={handleClose} open={open}>
      <DialogTitle>Buy axlUSDC on Kado OnRamp</DialogTitle>
      <iframe src="https://app.kado.money/?onPayCurrency=USD&onRevCurrency=USDC&network=TERRA" width="480" height="620" style={{ border: "0px" }}></iframe>
    </MaterialUIDialog>
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
