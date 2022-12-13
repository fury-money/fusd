import { SnackbarContent as MuiSnackbarContent } from '@mui/material';
import styled from 'styled-components';

export const SnackbarContent = styled(MuiSnackbarContent)`
  && {
    border-radius: 5px;

    .MuiButton-label,
    .MuiIconButton-label {
      opacity: 0.6;
    }
  }
`;

export const NormalSnackbarContent = styled(SnackbarContent)`
  && {
    background-color: ${({ theme }) => theme.snackbar.normal.backgroundColor};
    color: ${({ theme }) => theme.snackbar.normal.textColor};
  }
`;

export const SuccessSnackbarContent = styled(SnackbarContent)`
  && {
    background-color: ${({ theme }) => theme.snackbar.success.backgroundColor};
    color: ${({ theme }) => theme.snackbar.success.textColor};
  }
`;

export const WarningSnackbarContent = styled(SnackbarContent)`
  && {
    background-color: ${({ theme }) => theme.snackbar.warning.backgroundColor};
    color: ${({ theme }) => theme.snackbar.warning.textColor};
  }
`;

export const ErrorSnackbarContent = styled(SnackbarContent)`
  && {
    background-color: ${({ theme }) => theme.snackbar.error.backgroundColor};
    color: ${({ theme }) => theme.snackbar.error.textColor};
  }
`;
