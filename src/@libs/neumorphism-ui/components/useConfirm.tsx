import { DialogProps, OpenDialog, useDialog } from '@libs/use-dialog';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import React, { ReactNode } from 'react';
import { useTheme } from 'styled-components';
import { ActionButton } from './ActionButton';
export function useConfirm(): [OpenDialog<ConfirmParams, boolean>, ReactNode] {
  return useDialog(Component as any);
}

export interface ConfirmParams {
  title?: ReactNode;
  description: ReactNode;
  agree?: string;
  disagree?: string;
}

export function Component({
  closeDialog,
  title,
  description,
  agree = 'Agree',
  disagree = 'Disagree',
}: DialogProps<ConfirmParams, boolean>) {
  const theme = useTheme();

  return (
    <Dialog
      open
      PaperProps={{
        style: {
          backgroundColor: theme.sectionBackgroundColor,
          color: theme.dialog.normal.textColor,
          padding: 10,
        },
      }}
      onClose={() => closeDialog(false)}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      {title && <DialogTitle id="alert-dialog-title">{title}</DialogTitle>}

      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          {description}
        </DialogContentText>
      </DialogContent>

      <DialogActions>
        <ActionButton style={{ width: 150 }} onClick={() => closeDialog(false)}>
          {disagree}
        </ActionButton>
        <ActionButton
          autoFocus
          style={{ width: 150 }}
          onClick={() => closeDialog(true)}
        >
          {agree}
        </ActionButton>
      </DialogActions>
    </Dialog>
  );
}
